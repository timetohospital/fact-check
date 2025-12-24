"""
SPEC-004: 프롬프트 자동 업데이트 모듈

검증된 패턴(HIGH/MEDIUM)을 글 생성 프롬프트에 자동 반영
"""

import os
from typing import Dict, List, Optional

import pg8000


# ============================================
# 설정
# ============================================

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "34.64.111.186"),
    "port": int(os.environ.get("DB_PORT", "5432")),
    "user": os.environ.get("DB_USER", "admin"),
    "password": os.environ.get("DB_PASSWORD", "galddae-password"),
    "database": os.environ.get("DB_NAME", "factcheck_db"),
}

# 업데이트 트리거 조건
MIN_NEW_HIGH_PATTERNS = 1      # 새 HIGH 패턴 1개 이상
MIN_UNAPPLIED_MEDIUM_PATTERNS = 3  # 미적용 MEDIUM 패턴 3개 이상


# ============================================
# 기본 프롬프트 템플릿
# ============================================

BASE_SYSTEM_PROMPT = '''당신은 의학 전문가이자 건강 콘텐츠 작가입니다.
정확한 의학 정보를 바탕으로 독자가 이해하기 쉬운 건강 콘텐츠를 작성합니다.

## 작성 원칙
1. 신뢰할 수 있는 의학 논문과 가이드라인을 참조합니다.
2. 전문 용어는 쉽게 풀어서 설명합니다.
3. 독자의 건강 결정에 도움이 되는 실용적 정보를 제공합니다.
4. 의료 면책 조항을 포함합니다.

{pattern_instructions}
'''

BASE_USER_PROMPT = '''다음 주제로 건강 콘텐츠를 작성해주세요:

주제: {topic}
카테고리: {category}
타겟 독자: {target_audience}

## 요구사항
- 제목: SEO 최적화된 매력적인 제목
- 도입부: 독자의 관심을 끄는 도입
- 본문: 체계적인 구조로 정보 전달
- 결론: 핵심 요약과 실천 방안
- 출처: 신뢰할 수 있는 참고 문헌

## 출력 형식
JSON 형식으로 출력하세요:
{{
  "title": "글 제목",
  "description": "SEO 설명 (150자 내외)",
  "sections": [
    {{"type": "intro", "heading": null, "content": "도입부 내용"}},
    {{"type": "main", "heading": "섹션 제목", "content": "본문 내용"}},
    {{"type": "faq", "heading": "자주 묻는 질문", "items": [{{"q": "질문", "a": "답변"}}]}},
    {{"type": "conclusion", "heading": "결론", "content": "결론 내용"}}
  ],
  "tags": ["태그1", "태그2"],
  "sources": ["출처1", "출처2"]
}}
'''


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
# 패턴 조회
# ============================================

def get_active_patterns(conn) -> List[Dict]:
    """활성화된 모든 패턴 조회 (신뢰도 순)"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, category, description, prompt_instruction,
               confidence_level, test_count, win_rate
        FROM patterns
        WHERE is_active = true
        ORDER BY
            CASE confidence_level
                WHEN 'HIGH' THEN 1
                WHEN 'MEDIUM' THEN 2
                WHEN 'LOW' THEN 3
                ELSE 4
            END,
            win_rate DESC
    """)

    patterns = []
    for row in cursor.fetchall():
        patterns.append({
            "id": str(row[0]),
            "name": row[1],
            "category": row[2],
            "description": row[3],
            "prompt_instruction": row[4],
            "confidence_level": row[5],
            "test_count": int(row[6]) if row[6] else 0,
            "win_rate": float(row[7]) if row[7] else 0,
        })

    return patterns


def get_current_prompt_version(conn) -> Optional[Dict]:
    """현재 활성화된 프롬프트 버전 조회"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, version, name, system_prompt, user_prompt_template,
               applied_patterns, articles_generated
        FROM prompt_versions
        WHERE status = 'active'
        ORDER BY activated_at DESC
        LIMIT 1
    """)

    row = cursor.fetchone()
    if row:
        return {
            "id": str(row[0]),
            "version": row[1],
            "name": row[2],
            "system_prompt": row[3],
            "user_prompt_template": row[4],
            "applied_patterns": row[5] if row[5] else [],
            "articles_generated": int(row[6]) if row[6] else 0,
        }
    return None


def get_unapplied_patterns(conn, applied_pattern_ids: List[str]) -> List[Dict]:
    """아직 프롬프트에 적용되지 않은 HIGH/MEDIUM 패턴 조회"""
    cursor = conn.cursor()

    if applied_pattern_ids:
        # UUID 배열 변환
        placeholders = ", ".join(["%s"] * len(applied_pattern_ids))
        cursor.execute(f"""
            SELECT id, name, category, prompt_instruction, confidence_level
            FROM patterns
            WHERE is_active = true
              AND confidence_level IN ('HIGH', 'MEDIUM')
              AND id NOT IN ({placeholders})
            ORDER BY confidence_level, win_rate DESC
        """, applied_pattern_ids)
    else:
        cursor.execute("""
            SELECT id, name, category, prompt_instruction, confidence_level
            FROM patterns
            WHERE is_active = true
              AND confidence_level IN ('HIGH', 'MEDIUM')
            ORDER BY confidence_level, win_rate DESC
        """)

    patterns = []
    for row in cursor.fetchall():
        patterns.append({
            "id": str(row[0]),
            "name": row[1],
            "category": row[2],
            "prompt_instruction": row[3],
            "confidence_level": row[4],
        })

    return patterns


# ============================================
# 프롬프트 업데이트
# ============================================

def should_update_prompt(unapplied_patterns: List[Dict]) -> bool:
    """프롬프트 업데이트 필요 여부 판단"""
    high_patterns = [p for p in unapplied_patterns if p["confidence_level"] == "HIGH"]
    medium_patterns = [p for p in unapplied_patterns if p["confidence_level"] == "MEDIUM"]

    # 조건 1: 새 HIGH 패턴
    if len(high_patterns) >= MIN_NEW_HIGH_PATTERNS:
        print(f"[Prompt Updater] 업데이트 트리거: {len(high_patterns)}개 HIGH 패턴")
        return True

    # 조건 2: MEDIUM 패턴 누적
    if len(medium_patterns) >= MIN_UNAPPLIED_MEDIUM_PATTERNS:
        print(f"[Prompt Updater] 업데이트 트리거: {len(medium_patterns)}개 MEDIUM 패턴")
        return True

    return False


def generate_pattern_instructions(patterns: List[Dict]) -> str:
    """패턴 목록에서 프롬프트 지침 생성"""
    if not patterns:
        return ""

    lines = ["\n## 검증된 콘텐츠 패턴 (A/B 테스트 검증)"]

    # HIGH 패턴 (필수)
    high_patterns = [p for p in patterns if p["confidence_level"] == "HIGH"]
    if high_patterns:
        lines.append("\n### [필수] 검증 완료 패턴 (반드시 적용)")
        for p in high_patterns:
            lines.append(f"- **{p['name']}** ({p['category']}): {p['prompt_instruction']}")

    # MEDIUM 패턴 (권장)
    medium_patterns = [p for p in patterns if p["confidence_level"] == "MEDIUM"]
    if medium_patterns:
        lines.append("\n### [권장] 높은 승률 패턴 (가능하면 적용)")
        for p in medium_patterns:
            lines.append(f"- **{p['name']}** ({p['category']}): {p['prompt_instruction']}")

    # LOW 패턴 (선택) - 최대 3개만
    low_patterns = [p for p in patterns if p["confidence_level"] == "LOW"]
    if low_patterns:
        lines.append("\n### [선택] 실험 중 패턴")
        for p in low_patterns[:3]:
            lines.append(f"- {p['name']}: {p['prompt_instruction']}")

    return "\n".join(lines)


def create_new_prompt_version(
    conn,
    patterns: List[Dict],
    current_version: Optional[Dict]
) -> str:
    """새 프롬프트 버전 생성"""
    cursor = conn.cursor()

    # 버전 번호 결정
    if current_version:
        old_version = current_version["version"]
        try:
            parts = old_version.replace("v", "").split(".")
            major = int(parts[0])
            minor = int(parts[1]) if len(parts) > 1 else 0
            new_version = f"v{major}.{minor + 1}"
        except (ValueError, IndexError):
            new_version = "v1.1"
    else:
        new_version = "v1.0"

    # 패턴 지침 생성
    pattern_instructions = generate_pattern_instructions(patterns)

    # 프롬프트 생성
    system_prompt = BASE_SYSTEM_PROMPT.format(pattern_instructions=pattern_instructions)
    user_prompt = BASE_USER_PROMPT

    # 적용된 패턴 ID 목록 (HIGH, MEDIUM만)
    applied_pattern_ids = [
        p["id"] for p in patterns
        if p["confidence_level"] in ("HIGH", "MEDIUM")
    ]

    # 변경 사유 생성
    high_count = len([p for p in patterns if p["confidence_level"] == "HIGH"])
    medium_count = len([p for p in patterns if p["confidence_level"] == "MEDIUM"])
    low_count = len([p for p in patterns if p["confidence_level"] == "LOW"])
    description = f"패턴 적용: HIGH {high_count}개, MEDIUM {medium_count}개, LOW {low_count}개"

    # 기존 버전 deprecated 처리
    if current_version:
        cursor.execute("""
            UPDATE prompt_versions
            SET status = 'deprecated', deprecated_at = NOW()
            WHERE id = %s
        """, (current_version["id"],))

    # 새 버전 삽입
    cursor.execute("""
        INSERT INTO prompt_versions (
            version, name, description,
            system_prompt, user_prompt_template,
            applied_patterns, status, activated_at
        ) VALUES (
            %s, %s, %s,
            %s, %s,
            %s::UUID[], 'active', NOW()
        )
        RETURNING id
    """, (
        new_version,
        f"자동 업데이트 {new_version}",
        description,
        system_prompt,
        user_prompt,
        applied_pattern_ids if applied_pattern_ids else None,
    ))

    new_id = str(cursor.fetchone()[0])
    conn.commit()

    print(f"[Prompt Updater] 새 버전 생성: {new_version} (ID: {new_id})")
    print(f"[Prompt Updater] {description}")

    return new_version


# ============================================
# 메인 함수
# ============================================

def update_prompt_if_needed(conn) -> Dict:
    """
    조건 충족 시 프롬프트 업데이트

    Args:
        conn: 데이터베이스 연결

    Returns:
        Dict: 업데이트 결과
            - updated: bool - 업데이트 여부
            - new_version: str - 새 버전 (업데이트 시)
            - patterns_applied: int - 적용된 패턴 수
    """
    print("[Prompt Updater] 프롬프트 업데이트 체크 시작...")

    # 1. 현재 프롬프트 버전 조회
    current = get_current_prompt_version(conn)
    current_applied = current["applied_patterns"] if current else []
    print(f"[Prompt Updater] 현재 버전: {current['version'] if current else 'None'}")
    print(f"[Prompt Updater] 현재 적용된 패턴: {len(current_applied)}개")

    # 2. 미적용 패턴 조회
    unapplied = get_unapplied_patterns(conn, current_applied)
    print(f"[Prompt Updater] 미적용 HIGH/MEDIUM 패턴: {len(unapplied)}개")

    # 3. 업데이트 필요 여부 판단
    if not should_update_prompt(unapplied):
        return {
            "updated": False,
            "reason": "업데이트 조건 미충족",
            "current_version": current["version"] if current else None,
            "unapplied_count": len(unapplied),
        }

    # 4. 모든 활성 패턴 조회 (새 프롬프트에 모두 포함)
    all_patterns = get_active_patterns(conn)
    print(f"[Prompt Updater] 전체 활성 패턴: {len(all_patterns)}개")

    # 5. 새 프롬프트 버전 생성
    new_version = create_new_prompt_version(conn, all_patterns, current)

    return {
        "updated": True,
        "new_version": new_version,
        "patterns_applied": len([p for p in all_patterns if p["confidence_level"] in ("HIGH", "MEDIUM")]),
        "previous_version": current["version"] if current else None,
    }


# ============================================
# 프롬프트 조회 (글 생성용)
# ============================================

def get_active_prompt() -> Dict:
    """
    현재 활성화된 프롬프트 조회 (글 생성 시 사용)

    Returns:
        Dict: system_prompt, user_prompt_template, version
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT system_prompt, user_prompt_template, version
        FROM prompt_versions
        WHERE status = 'active'
        ORDER BY activated_at DESC
        LIMIT 1
    """)

    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "system_prompt": row[0],
            "user_prompt_template": row[1],
            "version": row[2],
        }

    # 기본 프롬프트 반환
    return {
        "system_prompt": BASE_SYSTEM_PROMPT.format(pattern_instructions=""),
        "user_prompt_template": BASE_USER_PROMPT,
        "version": "default",
    }


# ============================================
# 테스트
# ============================================

if __name__ == "__main__":
    # 로컬 테스트
    conn = get_db_connection()

    print("=== 프롬프트 업데이트 테스트 ===\n")

    result = update_prompt_if_needed(conn)
    print(f"\n결과: {result}")

    conn.close()
