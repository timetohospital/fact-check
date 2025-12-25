"""
SPEC-003/006: Content Analyzer Cloud Run Service

콘텐츠 분석 시스템:
- SPEC-003: A/B 테스트 분석 (동일 주제, 다른 표현)
- SPEC-006: 주제 패턴 실험 분석 (다른 주제/카테고리 비교) - 주요 사용

인증 방식:
- Claude Code OAuth Token (구독 기반)
- 환경변수: CLAUDE_CODE_OAUTH_TOKEN

참고:
- Cloud Function에서 Cloud Run으로 변경 (Docker 지원 필요)
- ghcr.io/cabinlab/claude-code-sdk:python 이미지 사용

주제 패턴 (SPEC-006):
- pattern_a: 기존 상식 뒤집기
- pattern_b: 좋아하는 것 + 두려움
- pattern_c: SNS 트렌드
- pattern_d: 오래된 상식 파괴
- pattern_e: 수치 + 반전
"""

import os
import json
import re
import subprocess
from typing import Dict, List, Optional, Any
from datetime import datetime

import pg8000
from flask import Flask, request, jsonify

from prompts import ANALYSIS_SYSTEM_PROMPT, format_analysis_prompt
from prompts_topic_experiment import TOPIC_EXPERIMENT_SYSTEM_PROMPT, format_topic_experiment_prompt
from prompt_updater import update_prompt_if_needed


# ============================================
# 주제 패턴 상수 (SPEC-006)
# ============================================

TOPIC_PATTERNS = {
    "pattern_a": "기존 상식 뒤집기",
    "pattern_b": "좋아하는 것 + 두려움",
    "pattern_c": "SNS 트렌드",
    "pattern_d": "오래된 상식 파괴",
    "pattern_e": "수치 + 반전",
}


# ============================================
# 설정
# ============================================

# Claude Code OAuth Token (구독 기반 인증)
# 로컬에서 `claude setup-token` 명령어로 생성
CLAUDE_OAUTH_TOKEN = os.environ.get("CLAUDE_CODE_OAUTH_TOKEN")

# Claude 모델 정보 (로깅용)
CLAUDE_MODEL = "claude-code-cli"

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "34.64.111.186"),
    "port": int(os.environ.get("DB_PORT", "5432")),
    "user": os.environ.get("DB_USER", "admin"),
    "password": os.environ.get("DB_PASSWORD", "galddae-password"),
    "database": os.environ.get("DB_NAME", "factcheck_db"),
}


# ============================================
# 데이터베이스 연결
# ============================================

def get_db_connection():
    """PostgreSQL 연결"""
    return pg8000.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"],
    )


# ============================================
# 데이터 조회
# ============================================

def get_unanalyzed_completed_tests(conn) -> List[Dict]:
    """
    분석되지 않은 완료된 A/B 테스트 조회 (DEPRECATED - ab_tests용)

    조건:
    - status = 'completed'
    - content_analysis에 해당 테스트의 분석 결과가 없음

    Note: SPEC-006 이후 topic_experiments 사용 권장
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            t.id,
            t.article_slug,
            t.name,
            t.hypothesis,
            t.target_section,
            t.control_version,
            t.variant_version,
            t.winner_version,
            t.actual_lift,
            t.confidence_level
        FROM ab_tests t
        WHERE t.status = 'completed'
          AND t.winner_version IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM content_analysis ca
              WHERE ca.article_slug = t.article_slug
                AND ca.trigger_type = 'ab_test_complete'
                AND ca.analyzed_at > t.ended_at
          )
        ORDER BY t.ended_at DESC
        LIMIT 10
    """)

    tests = []
    for row in cursor.fetchall():
        tests.append({
            "id": str(row[0]),
            "article_slug": row[1],
            "name": row[2],
            "hypothesis": row[3],
            "target_section": row[4],
            "control_version": row[5],
            "variant_version": row[6],
            "winner_version": row[7],
            "actual_lift": float(row[8]) if row[8] else 0,
            "confidence_level": float(row[9]) if row[9] else 0,
        })

    return tests


# ============================================
# SPEC-006: 주제 패턴 실험 데이터 조회
# ============================================

def get_running_topic_experiments(conn) -> List[Dict]:
    """
    진행 중인 주제 패턴 실험 조회

    조건:
    - status = 'running'
    - 시작 후 test_duration_days 경과
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            id,
            name,
            description,
            prompt_version,
            patterns_tested,
            articles_per_pattern,
            primary_metric,
            test_duration_days,
            started_at
        FROM topic_experiments
        WHERE status = 'running'
          AND started_at + (test_duration_days || ' days')::INTERVAL <= NOW()
        ORDER BY started_at ASC
        LIMIT 5
    """)

    experiments = []
    for row in cursor.fetchall():
        experiments.append({
            "id": str(row[0]),
            "name": row[1],
            "description": row[2],
            "prompt_version": row[3],
            "patterns_tested": row[4] if row[4] else [],
            "articles_per_pattern": row[5],
            "primary_metric": row[6],
            "test_duration_days": row[7],
            "started_at": row[8].isoformat() if row[8] else None,
        })

    return experiments


def get_experiment_articles_by_pattern(conn, experiment_id: str) -> Dict[str, List[Dict]]:
    """
    실험에 포함된 글을 패턴별로 그룹화하여 조회

    Returns:
        Dict[pattern_group, List[article_data]]
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            ea.pattern_group,
            a.id,
            a.slug,
            a.title,
            a.description,
            a.sections,
            a.topic_pattern,
            a.topic_category,
            ea.total_pageviews,
            ea.avg_time_on_page,
            ea.avg_bounce_rate,
            ea.avg_scroll_depth,
            ea.engagement_score
        FROM experiment_articles ea
        JOIN articles a ON a.id = ea.article_id
        WHERE ea.experiment_id = %s
        ORDER BY ea.pattern_group, a.created_at
    """, (experiment_id,))

    result = {}
    for row in cursor.fetchall():
        pattern_group = row[0]
        if pattern_group not in result:
            result[pattern_group] = []

        result[pattern_group].append({
            "id": str(row[1]),
            "slug": row[2],
            "title": row[3],
            "description": row[4],
            "sections": row[5] if row[5] else [],
            "topic_pattern": row[6],
            "topic_category": row[7],
            "metrics": {
                "total_pageviews": int(row[8]) if row[8] else 0,
                "avg_time_on_page": float(row[9]) if row[9] else 0,
                "avg_bounce_rate": float(row[10]) if row[10] else 0,
                "avg_scroll_depth": float(row[11]) if row[11] else 0,
                "engagement_score": float(row[12]) if row[12] else 0,
            }
        })

    return result


def update_experiment_article_metrics(conn, experiment_id: str) -> int:
    """
    실험에 포함된 글들의 메트릭을 최신 데이터로 업데이트

    Returns:
        int: 업데이트된 글 수
    """
    cursor = conn.cursor()

    # 실험 시작일 조회
    cursor.execute("""
        SELECT started_at, test_duration_days FROM topic_experiments WHERE id = %s
    """, (experiment_id,))
    row = cursor.fetchone()
    if not row:
        return 0

    started_at = row[0]
    duration_days = row[1]

    # 각 글의 메트릭 업데이트
    cursor.execute("""
        UPDATE experiment_articles ea
        SET
            total_pageviews = sub.total_pv,
            avg_time_on_page = sub.avg_time,
            avg_bounce_rate = sub.avg_bounce,
            avg_scroll_depth = sub.avg_scroll,
            engagement_score = sub.avg_engagement,
            metrics_updated_at = NOW()
        FROM (
            SELECT
                a.id as article_id,
                COALESCE(SUM(m.pageviews), 0) as total_pv,
                COALESCE(AVG(m.avg_time_on_page), 0) as avg_time,
                COALESCE(AVG(m.bounce_rate), 0) as avg_bounce,
                COALESCE(AVG(m.scroll_depth_avg), 0) as avg_scroll,
                COALESCE(AVG(m.engagement_score), 0) as avg_engagement
            FROM experiment_articles ea2
            JOIN articles a ON a.id = ea2.article_id
            LEFT JOIN article_metrics m ON m.article_slug = a.slug
                AND m.date >= %s::date
                AND m.date <= (%s::date + (%s || ' days')::INTERVAL)
            WHERE ea2.experiment_id = %s
            GROUP BY a.id
        ) sub
        WHERE ea.article_id = sub.article_id AND ea.experiment_id = %s
    """, (started_at, started_at, duration_days, experiment_id, experiment_id))

    updated_count = cursor.rowcount
    conn.commit()

    print(f"[Analyzer] 실험 {experiment_id}: {updated_count}개 글 메트릭 업데이트")
    return updated_count


def calculate_pattern_rankings(articles_by_pattern: Dict[str, List[Dict]], primary_metric: str) -> Dict:
    """
    패턴별 성과를 집계하고 순위 계산

    Returns:
        Dict: 패턴별 성과 및 순위 정보
    """
    pattern_stats = {}

    for pattern_group, articles in articles_by_pattern.items():
        if not articles:
            continue

        metrics = [a["metrics"] for a in articles]

        # 집계
        total_pv = sum(m["total_pageviews"] for m in metrics)
        avg_time = sum(m["avg_time_on_page"] for m in metrics) / len(metrics)
        avg_bounce = sum(m["avg_bounce_rate"] for m in metrics) / len(metrics)
        avg_scroll = sum(m["avg_scroll_depth"] for m in metrics) / len(metrics)
        avg_engagement = sum(m["engagement_score"] for m in metrics) / len(metrics)

        pattern_stats[pattern_group] = {
            "article_count": len(articles),
            "total_pageviews": total_pv,
            "avg_time_on_page": round(avg_time, 2),
            "avg_bounce_rate": round(avg_bounce, 2),
            "avg_scroll_depth": round(avg_scroll, 2),
            "avg_engagement": round(avg_engagement, 2),
            "pattern_name_ko": TOPIC_PATTERNS.get(pattern_group, pattern_group),
        }

    # 순위 계산 (primary_metric 기준 내림차순)
    metric_key = "avg_engagement"  # 기본값
    if primary_metric == "avg_time_on_page":
        metric_key = "avg_time_on_page"
    elif primary_metric == "scroll_depth_avg":
        metric_key = "avg_scroll_depth"
    elif primary_metric == "bounce_rate":
        # 이탈률은 낮을수록 좋음
        sorted_patterns = sorted(pattern_stats.keys(),
                                  key=lambda p: pattern_stats[p]["avg_bounce_rate"])
    else:
        sorted_patterns = sorted(pattern_stats.keys(),
                                  key=lambda p: pattern_stats[p][metric_key],
                                  reverse=True)

    if primary_metric != "bounce_rate":
        sorted_patterns = sorted(pattern_stats.keys(),
                                  key=lambda p: pattern_stats[p][metric_key],
                                  reverse=True)

    # 순위 추가
    for rank, pattern in enumerate(sorted_patterns, 1):
        pattern_stats[pattern]["rank"] = rank

    return {
        "pattern_stats": pattern_stats,
        "ranking": sorted_patterns,
        "winner": sorted_patterns[0] if sorted_patterns else None,
        "primary_metric": primary_metric,
    }


def get_article_by_slug_version(conn, slug: str, version: str) -> Optional[Dict]:
    """글 조회 (slug + version)"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, slug, version, title, description, sections, tags
        FROM articles
        WHERE slug = %s AND version = %s AND is_active = true
        LIMIT 1
    """, (slug, version))

    row = cursor.fetchone()
    if row:
        return {
            "id": str(row[0]),
            "slug": row[1],
            "version": row[2],
            "title": row[3],
            "description": row[4],
            "sections": row[5] if row[5] else [],
            "tags": row[6] if row[6] else [],
        }
    return None


def get_version_metrics(conn, slug: str, version: str) -> Dict:
    """버전별 메트릭 조회 (최근 7일 평균)"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            AVG(avg_time_on_page) as avg_time,
            AVG(bounce_rate) as bounce_rate,
            AVG(scroll_75_pct::float / NULLIF(pageviews, 0)) as scroll_75_rate,
            AVG(engagement_score) as engagement_score,
            SUM(pageviews) as total_pageviews
        FROM article_metrics
        WHERE article_slug = %s
          AND article_version = %s
          AND date >= CURRENT_DATE - INTERVAL '7 days'
    """, (slug, version))

    row = cursor.fetchone()
    if row and row[0] is not None:
        return {
            "avg_time_on_page": float(row[0]) if row[0] else 0,
            "bounce_rate": float(row[1]) if row[1] else 0,
            "scroll_75_rate": float(row[2]) if row[2] else 0,
            "engagement_score": float(row[3]) if row[3] else 0,
            "total_pageviews": int(row[4]) if row[4] else 0,
        }

    return {
        "avg_time_on_page": 0,
        "bounce_rate": 0,
        "scroll_75_rate": 0,
        "engagement_score": 0,
        "total_pageviews": 0,
    }


# ============================================
# Claude Code CLI 분석
# ============================================

def analyze_with_claude(
    test: Dict,
    article_a: Dict,
    article_b: Dict,
    metrics_a: Dict,
    metrics_b: Dict
) -> Dict:
    """
    Claude Code CLI를 사용하여 A/B 테스트 분석

    인증: CLAUDE_CODE_OAUTH_TOKEN 환경변수 (구독 기반)
    비용: $0 (Claude Max/Pro 구독으로 사용)

    Returns:
        Dict: 분석 결과 (patterns, recommendations 포함)
    """
    if not CLAUDE_OAUTH_TOKEN:
        raise ValueError("CLAUDE_CODE_OAUTH_TOKEN 환경 변수가 설정되지 않았습니다. "
                        "로컬에서 'claude setup-token' 명령어로 토큰을 생성하세요.")

    # 프롬프트 구성
    user_prompt = format_analysis_prompt(
        test_name=test["name"],
        hypothesis=test["hypothesis"],
        target_section=test.get("target_section"),
        article_a=article_a,
        article_b=article_b,
        metrics_a=metrics_a,
        metrics_b=metrics_b,
        winner=test["winner_version"],
        p_value=0.1,  # 실제 p-value 저장 필요
        lift=test["actual_lift"],
    )

    # 전체 프롬프트 (시스템 + 사용자)
    full_prompt = f"""{ANALYSIS_SYSTEM_PROMPT}

---

{user_prompt}"""

    print(f"[Analyzer] Claude Code CLI 분석 요청: {test['name']}")

    # Claude Code CLI 호출 (headless mode)
    try:
        result = subprocess.run(
            [
                "claude",
                "-p", full_prompt,
                "--output-format", "json"
            ],
            capture_output=True,
            text=True,
            timeout=120,  # 2분 타임아웃
            env={**os.environ, "CLAUDE_CODE_OAUTH_TOKEN": CLAUDE_OAUTH_TOKEN}
        )

        if result.returncode != 0:
            error_msg = result.stderr or result.stdout
            raise RuntimeError(f"Claude CLI 실행 실패: {error_msg}")

        # Claude CLI JSON 응답 파싱
        cli_response = json.loads(result.stdout)
        response_text = cli_response.get("result", "")

        print(f"[Analyzer] Claude 응답 길이: {len(response_text)}")

    except subprocess.TimeoutExpired:
        raise RuntimeError("Claude CLI 타임아웃 (120초 초과)")
    except json.JSONDecodeError as e:
        print(f"[Analyzer] CLI 응답 파싱 오류: {e}")
        print(f"[Analyzer] stdout: {result.stdout[:500]}")
        raise RuntimeError(f"Claude CLI 응답 파싱 실패: {e}")

    # 분석 결과 JSON 파싱
    try:
        # JSON 블록 추출
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            analysis = json.loads(json_match.group(1))
        else:
            # 직접 JSON 파싱 시도
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                analysis = json.loads(json_match.group())
            else:
                raise ValueError("JSON 형식을 찾을 수 없습니다")
    except json.JSONDecodeError as e:
        print(f"[Analyzer] JSON 파싱 오류: {e}")
        print(f"[Analyzer] 원본 응답: {response_text[:500]}")
        raise ValueError(f"Claude 응답에서 JSON 추출 실패: {e}")

    return analysis


# ============================================
# 패턴 업데이트
# ============================================

def update_patterns(conn, analysis: Dict, test_id: str) -> int:
    """
    분석 결과에서 추출된 패턴을 DB에 저장/업데이트

    Returns:
        int: 업데이트된 패턴 수
    """
    cursor = conn.cursor()
    updated_count = 0

    for pattern in analysis.get("patterns", []):
        name = pattern.get("name", "").strip()
        category = pattern.get("category", "other").lower()

        if not name:
            continue

        # 카테고리 유효성 검사
        valid_categories = ["intro", "title", "structure", "faq", "visual", "meta", "other"]
        if category not in valid_categories:
            category = "other"

        # 기존 패턴 확인
        cursor.execute("""
            SELECT id, test_count, win_count, avg_lift
            FROM patterns
            WHERE name = %s AND category = %s
        """, (name, category))

        existing = cursor.fetchone()

        if existing:
            # 기존 패턴 업데이트
            pattern_id = str(existing[0])
            test_count = int(existing[1]) + 1
            win_count = int(existing[2]) + 1
            old_avg_lift = float(existing[3]) if existing[3] else 0
            new_avg_lift = (old_avg_lift * (test_count - 1) + analysis.get("lift", 0)) / test_count

            win_rate = (win_count / test_count) * 100
            confidence = determine_confidence_level(test_count, win_rate)

            cursor.execute("""
                UPDATE patterns
                SET
                    test_count = %s,
                    win_count = %s,
                    win_rate = %s,
                    avg_lift = %s,
                    confidence_level = %s,
                    source_tests = array_append(source_tests, %s::UUID),
                    updated_at = NOW()
                WHERE id = %s
            """, (test_count, win_count, win_rate, new_avg_lift, confidence, test_id, pattern_id))

            print(f"[Analyzer] 패턴 업데이트: {name} (test_count={test_count}, confidence={confidence})")
        else:
            # 새 패턴 생성
            cursor.execute("""
                INSERT INTO patterns (
                    name, category, description, prompt_instruction,
                    confidence_level, test_count, win_count, win_rate, avg_lift,
                    source_tests
                ) VALUES (
                    %s, %s, %s, %s,
                    'EXPERIMENTAL', 1, 1, 100.0, %s,
                    ARRAY[%s]::UUID[]
                )
            """, (
                name,
                category,
                pattern.get("description", ""),
                pattern.get("prompt_instruction", ""),
                analysis.get("lift", 0),
                test_id
            ))

            print(f"[Analyzer] 새 패턴 생성: {name} ({category})")

        updated_count += 1

    conn.commit()
    return updated_count


def determine_confidence_level(test_count: int, win_rate: float) -> str:
    """
    패턴 신뢰도 레벨 결정 (PLANNING_v2.md 기준)

    - EXPERIMENTAL: 1-2회 테스트
    - LOW: 3-5회, 승률 55%+
    - MEDIUM: 6-10회, 승률 60%+
    - HIGH: 11회+, 승률 65%+
    """
    if test_count >= 11 and win_rate >= 65:
        return "HIGH"
    elif test_count >= 6 and win_rate >= 60:
        return "MEDIUM"
    elif test_count >= 3 and win_rate >= 55:
        return "LOW"
    else:
        return "EXPERIMENTAL"


# ============================================
# SPEC-006: 주제 패턴 실험 분석
# ============================================

def analyze_topic_experiment_with_claude(
    experiment: Dict,
    articles_by_pattern: Dict[str, List[Dict]],
    rankings: Dict
) -> Dict:
    """
    Claude Code CLI를 사용하여 주제 패턴 실험 분석

    다른 주제/카테고리를 비교하여 어떤 패턴이 가장 효과적인지 분석

    Returns:
        Dict: 분석 결과 (winner_insights, recommendations, next_experiments)
    """
    if not CLAUDE_OAUTH_TOKEN:
        raise ValueError("CLAUDE_CODE_OAUTH_TOKEN 환경 변수가 설정되지 않았습니다.")

    # 프롬프트 구성
    user_prompt = format_topic_experiment_prompt(
        experiment_name=experiment["name"],
        description=experiment.get("description", ""),
        patterns_tested=experiment["patterns_tested"],
        articles_by_pattern=articles_by_pattern,
        rankings=rankings,
        primary_metric=experiment["primary_metric"],
    )

    full_prompt = f"""{TOPIC_EXPERIMENT_SYSTEM_PROMPT}

---

{user_prompt}"""

    print(f"[Analyzer] 주제 패턴 실험 분석 요청: {experiment['name']}")

    # Claude Code CLI 호출
    try:
        result = subprocess.run(
            [
                "claude",
                "-p", full_prompt,
                "--output-format", "json"
            ],
            capture_output=True,
            text=True,
            timeout=180,  # 3분 타임아웃 (더 복잡한 분석)
            env={**os.environ, "CLAUDE_CODE_OAUTH_TOKEN": CLAUDE_OAUTH_TOKEN}
        )

        if result.returncode != 0:
            error_msg = result.stderr or result.stdout
            raise RuntimeError(f"Claude CLI 실행 실패: {error_msg}")

        cli_response = json.loads(result.stdout)
        response_text = cli_response.get("result", "")

        print(f"[Analyzer] Claude 응답 길이: {len(response_text)}")

    except subprocess.TimeoutExpired:
        raise RuntimeError("Claude CLI 타임아웃 (180초 초과)")
    except json.JSONDecodeError as e:
        print(f"[Analyzer] CLI 응답 파싱 오류: {e}")
        raise RuntimeError(f"Claude CLI 응답 파싱 실패: {e}")

    # 분석 결과 JSON 파싱
    try:
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            analysis = json.loads(json_match.group(1))
        else:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                analysis = json.loads(json_match.group())
            else:
                raise ValueError("JSON 형식을 찾을 수 없습니다")
    except json.JSONDecodeError as e:
        print(f"[Analyzer] JSON 파싱 오류: {e}")
        raise ValueError(f"Claude 응답에서 JSON 추출 실패: {e}")

    return analysis


def complete_topic_experiment(conn, experiment_id: str, rankings: Dict, analysis: Dict):
    """
    주제 패턴 실험 완료 처리

    - 실험 상태를 'completed'로 변경
    - 결과 데이터 저장
    - 승리 패턴 기록
    """
    cursor = conn.cursor()

    winner_pattern = rankings.get("winner")
    results_json = json.dumps({
        "pattern_stats": rankings.get("pattern_stats", {}),
        "ranking": rankings.get("ranking", []),
        "primary_metric": rankings.get("primary_metric"),
        "analysis": analysis,
    })

    cursor.execute("""
        UPDATE topic_experiments
        SET
            status = 'completed',
            ended_at = NOW(),
            winner_pattern = %s,
            results = %s,
            analysis_notes = %s,
            updated_at = NOW()
        WHERE id = %s
    """, (
        winner_pattern,
        results_json,
        analysis.get("summary", ""),
        experiment_id
    ))

    conn.commit()
    print(f"[Analyzer] 실험 완료: {experiment_id}, 승리 패턴: {winner_pattern}")


def update_topic_pattern_insights(conn, analysis: Dict, experiment_id: str):
    """
    주제 패턴 분석 결과를 patterns 테이블에 반영

    승리한 패턴의 신뢰도 향상
    """
    cursor = conn.cursor()

    winner_insights = analysis.get("winner_insights", {})
    winner_pattern = winner_insights.get("pattern")

    if not winner_pattern:
        return

    # 주제 패턴을 patterns 테이블에 기록 (topic_pattern_type으로)
    pattern_name = f"주제패턴: {TOPIC_PATTERNS.get(winner_pattern, winner_pattern)}"
    description = winner_insights.get("why_successful", "")

    # 기존 패턴 확인
    cursor.execute("""
        SELECT id, test_count, win_count
        FROM patterns
        WHERE topic_pattern_type = %s
    """, (winner_pattern,))

    existing = cursor.fetchone()

    if existing:
        # 기존 패턴 업데이트
        pattern_id = str(existing[0])
        test_count = int(existing[1]) + 1
        win_count = int(existing[2]) + 1
        win_rate = (win_count / test_count) * 100
        confidence = determine_confidence_level(test_count, win_rate)

        cursor.execute("""
            UPDATE patterns
            SET
                test_count = %s,
                win_count = %s,
                win_rate = %s,
                confidence_level = %s,
                description = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (test_count, win_count, win_rate, confidence, description, pattern_id))

        print(f"[Analyzer] 주제 패턴 업데이트: {pattern_name} (confidence={confidence})")
    else:
        # 새 패턴 생성
        cursor.execute("""
            INSERT INTO patterns (
                name, category, description, topic_pattern_type,
                confidence_level, test_count, win_count, win_rate
            ) VALUES (
                %s, 'topic', %s, %s,
                'EXPERIMENTAL', 1, 1, 100.0
            )
        """, (pattern_name, description, winner_pattern))

        print(f"[Analyzer] 새 주제 패턴 생성: {pattern_name}")

    conn.commit()


# ============================================
# 분석 결과 저장
# ============================================

def save_analysis_result(
    conn,
    article_slug: str,
    article_version: str,
    test_id: str,
    metrics_snapshot: Dict,
    analysis: Dict
):
    """분석 결과를 content_analysis 테이블에 저장"""
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO content_analysis (
            article_slug, article_version, trigger_type,
            metrics_snapshot, problems, hypotheses,
            recommended_action, ai_model, analysis_prompt_version
        ) VALUES (
            %s, %s, 'ab_test_complete',
            %s, %s, %s,
            'pattern_update', %s, 'v1.0'
        )
    """, (
        article_slug,
        article_version,
        json.dumps(metrics_snapshot),
        json.dumps(analysis.get("patterns", [])),
        json.dumps(analysis.get("next_hypotheses", [])),
        CLAUDE_MODEL,
    ))

    conn.commit()
    print(f"[Analyzer] 분석 결과 저장: {article_slug} ({article_version})")


# ============================================
# Flask 앱 (Cloud Run용)
# ============================================

app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
@app.route("/analyze", methods=["GET", "POST"])
def analyze_completed_tests():
    """
    완료된 A/B 테스트를 분석하는 Cloud Run 엔드포인트

    SPEC-002 완료 후 호출되거나, Cloud Scheduler로 호출
    """
    try:
        print("[Analyzer] 시작...")

        conn = get_db_connection()

        # 1. 미분석 완료 테스트 조회
        completed_tests = get_unanalyzed_completed_tests(conn)
        print(f"[Analyzer] {len(completed_tests)}개 테스트 분석 대기")

        if len(completed_tests) == 0:
            # 테스트가 없어도 프롬프트 업데이트 체크
            try:
                prompt_result = update_prompt_if_needed(conn)
                print(f"[Analyzer] 프롬프트 업데이트: {prompt_result}")
            except Exception as e:
                print(f"[Analyzer] 프롬프트 업데이트 실패: {e}")
            conn.close()
            return json.dumps({
                "status": "success",
                "message": "분석할 테스트 없음",
                "analyzed": []
            }), 200

        results = []

        for test in completed_tests:
            try:
                # 2. 글 내용 조회
                article_a = get_article_by_slug_version(conn, test["article_slug"], test["control_version"])
                article_b = get_article_by_slug_version(conn, test["article_slug"], test["variant_version"])

                if not article_a or not article_b:
                    print(f"[Analyzer] 글 없음: {test['article_slug']} (A={bool(article_a)}, B={bool(article_b)})")
                    continue

                # 3. 메트릭 조회
                metrics_a = get_version_metrics(conn, test["article_slug"], test["control_version"])
                metrics_b = get_version_metrics(conn, test["article_slug"], test["variant_version"])

                # 4. Claude 분석
                analysis = analyze_with_claude(test, article_a, article_b, metrics_a, metrics_b)

                # 5. 패턴 업데이트
                pattern_count = update_patterns(conn, analysis, test["id"])

                # 6. 분석 결과 저장
                save_analysis_result(
                    conn, test["article_slug"], test["winner_version"],
                    test["id"], metrics_a, analysis
                )

                results.append({
                    "test_id": test["id"],
                    "test_name": test["name"],
                    "winner": test["winner_version"],
                    "patterns_found": pattern_count,
                    "summary": analysis.get("summary", ""),
                })

            except Exception as e:
                print(f"[Analyzer] 테스트 분석 실패 ({test['name']}): {e}")
                results.append({
                    "test_id": test["id"],
                    "test_name": test["name"],
                    "error": str(e),
                })

        # 7. SPEC-004: 프롬프트 자동 업데이트
        try:
            prompt_result = update_prompt_if_needed(conn)
            print(f"[Analyzer] 프롬프트 업데이트: {prompt_result}")
        except Exception as e:
            print(f"[Analyzer] 프롬프트 업데이트 실패: {e}")

        conn.close()

        return json.dumps({
            "status": "success",
            "analyzed_count": len([r for r in results if "error" not in r]),
            "error_count": len([r for r in results if "error" in r]),
            "results": results
        }), 200

    except Exception as e:
        import traceback
        error_msg = f"[Analyzer] 오류: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        return json.dumps({"status": "error", "message": str(e)}), 500


# ============================================
# 헬스체크 엔드포인트
# ============================================

@app.route("/health", methods=["GET"])
def health_check():
    """Cloud Run 헬스체크"""
    return jsonify({"status": "healthy", "service": "content-analyzer"}), 200


# ============================================
# SPEC-006: 주제 패턴 실험 엔드포인트
# ============================================

@app.route("/analyze-experiments", methods=["GET", "POST"])
def analyze_topic_experiments():
    """
    완료된 주제 패턴 실험을 분석하는 엔드포인트

    SPEC-006: 다른 주제/카테고리를 비교하여 어떤 패턴이 가장 효과적인지 평가

    기존 /analyze와 병행 실행됨 (Cloud Scheduler에서 둘 다 호출 가능)
    """
    try:
        print("[Analyzer] 주제 패턴 실험 분석 시작...")

        conn = get_db_connection()

        # 1. 완료 대기 중인 실험 조회
        experiments = get_running_topic_experiments(conn)
        print(f"[Analyzer] {len(experiments)}개 실험 분석 대기")

        if len(experiments) == 0:
            conn.close()
            return json.dumps({
                "status": "success",
                "message": "분석할 주제 패턴 실험 없음",
                "analyzed": []
            }), 200

        results = []

        for experiment in experiments:
            try:
                # 2. 실험 글들의 메트릭 업데이트
                update_experiment_article_metrics(conn, experiment["id"])

                # 3. 패턴별 글 조회
                articles_by_pattern = get_experiment_articles_by_pattern(conn, experiment["id"])

                if not articles_by_pattern:
                    print(f"[Analyzer] 실험 {experiment['name']}: 글 없음")
                    continue

                # 4. 패턴별 순위 계산
                rankings = calculate_pattern_rankings(
                    articles_by_pattern,
                    experiment["primary_metric"]
                )

                # 5. Claude 분석
                analysis = analyze_topic_experiment_with_claude(
                    experiment,
                    articles_by_pattern,
                    rankings
                )

                # 6. 실험 완료 처리
                complete_topic_experiment(conn, experiment["id"], rankings, analysis)

                # 7. 주제 패턴 인사이트 저장
                update_topic_pattern_insights(conn, analysis, experiment["id"])

                results.append({
                    "experiment_id": experiment["id"],
                    "experiment_name": experiment["name"],
                    "winner_pattern": rankings.get("winner"),
                    "winner_name_ko": TOPIC_PATTERNS.get(rankings.get("winner"), ""),
                    "ranking": rankings.get("ranking", []),
                    "summary": analysis.get("summary", ""),
                })

            except Exception as e:
                print(f"[Analyzer] 실험 분석 실패 ({experiment['name']}): {e}")
                import traceback
                print(traceback.format_exc())
                results.append({
                    "experiment_id": experiment["id"],
                    "experiment_name": experiment["name"],
                    "error": str(e),
                })

        # 8. 프롬프트 자동 업데이트
        try:
            prompt_result = update_prompt_if_needed(conn)
            print(f"[Analyzer] 프롬프트 업데이트: {prompt_result}")
        except Exception as e:
            print(f"[Analyzer] 프롬프트 업데이트 실패: {e}")

        conn.close()

        return json.dumps({
            "status": "success",
            "analyzed_count": len([r for r in results if "error" not in r]),
            "error_count": len([r for r in results if "error" in r]),
            "results": results
        }), 200

    except Exception as e:
        import traceback
        error_msg = f"[Analyzer] 주제 패턴 실험 분석 오류: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        return json.dumps({"status": "error", "message": str(e)}), 500


@app.route("/create-experiment", methods=["POST"])
def create_topic_experiment():
    """
    새 주제 패턴 실험 생성

    Request Body:
    {
        "name": "2024-12 주제 패턴 비교 #1",
        "description": "상식 뒤집기 vs SNS 트렌드 비교",
        "patterns": ["pattern_a", "pattern_c"],
        "prompt_version": "v1.0",
        "articles_per_pattern": 2,
        "test_duration_days": 6,
        "article_ids": {
            "pattern_a": ["uuid1", "uuid2"],
            "pattern_c": ["uuid3", "uuid4"]
        }
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"status": "error", "message": "요청 데이터 없음"}), 400

        name = data.get("name")
        patterns = data.get("patterns", [])
        article_ids_map = data.get("article_ids", {})

        if not name or not patterns:
            return jsonify({"status": "error", "message": "name과 patterns 필수"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # 실험 생성
        cursor.execute("""
            INSERT INTO topic_experiments (
                name, description, prompt_version, patterns_tested,
                articles_per_pattern, test_duration_days, status, started_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, 'running', NOW()
            )
            RETURNING id
        """, (
            name,
            data.get("description", ""),
            data.get("prompt_version", "v1.0"),
            patterns,
            data.get("articles_per_pattern", 2),
            data.get("test_duration_days", 6),
        ))

        experiment_id = str(cursor.fetchone()[0])

        # 글 매핑
        article_count = 0
        for pattern, article_ids in article_ids_map.items():
            for article_id in article_ids:
                cursor.execute("""
                    INSERT INTO experiment_articles (experiment_id, article_id, pattern_group)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (experiment_id, article_id) DO NOTHING
                """, (experiment_id, article_id, pattern))
                article_count += 1

        conn.commit()
        conn.close()

        return jsonify({
            "status": "success",
            "experiment_id": experiment_id,
            "name": name,
            "patterns": patterns,
            "article_count": article_count,
        }), 201

    except Exception as e:
        import traceback
        print(f"[Analyzer] 실험 생성 오류: {e}")
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================
# 메인 (Cloud Run / 로컬 실행)
# ============================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8081))
    debug = os.environ.get("DEBUG", "false").lower() == "true"

    print(f"Content Analyzer 서버 시작: http://localhost:{port}")
    print(f"  - OAuth Token 설정: {'✅' if CLAUDE_OAUTH_TOKEN else '❌ (CLAUDE_CODE_OAUTH_TOKEN 필요)'}")

    app.run(host="0.0.0.0", port=port, debug=debug)
