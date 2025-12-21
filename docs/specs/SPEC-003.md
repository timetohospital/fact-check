# SPEC-003: Claude 4.5 Opus 분석 시스템

> **상태**: Draft
> **우선순위**: P0
> **예상 기간**: 1일
> **작성일**: 2024-12-21
> **선행조건**: SPEC-001 완료, SPEC-002 완료

---

## 1. 목표

A/B 테스트 완료 후 Claude 4.5 Opus를 사용하여 승패 원인을 분석하고, 패턴을 추출하여 향후 콘텐츠 생성에 반영할 수 있는 자동화된 분석 시스템을 구축한다.

### 1.1 현재 상태

- A/B 테스트 결과: DB에 저장됨 (`ab_tests.winner_version`)
- 성과 데이터: `article_metrics` 테이블에 저장됨
- 분석: 없음 (수동으로 GA4 콘솔에서 확인)

### 1.2 목표 상태

- 자동 분석: A/B 테스트 완료 시 Claude 4.5 Opus가 분석
- 패턴 추출: 성공/실패 패턴을 DB에 저장
- 프롬프트 개선: 검증된 패턴을 글 생성 프롬프트에 자동 반영
- 리포트: 분석 결과 `content_analysis` 테이블에 저장

---

## 2. 시스템 아키텍처

### 2.1 데이터 흐름

```
SPEC-002 (GA4 수집)
    ↓
A/B 테스트 완료 감지
    ↓
Cloud Function (content_analyzer)
    ↓
Claude 4.5 Opus API
    ↓
├── content_analysis 테이블 저장
├── patterns 테이블 업데이트
└── prompt_versions 테이블 업데이트 (선택)
```

### 2.2 트리거 조건

`content_analyzer` Cloud Function은 다음 조건에서 실행:

1. **자동 트리거**: SPEC-002에서 A/B 테스트가 `completed` 상태로 변경될 때
2. **수동 트리거**: 관리자가 특정 글에 대해 분석 요청

---

## 3. DB 스키마 추가

### 3.1 patterns 테이블 (신규)

```sql
-- 002_add_patterns_table.sql

CREATE TABLE patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 패턴 식별
    name TEXT NOT NULL,           -- "질문형 도입부"
    category TEXT NOT NULL,       -- "intro", "title", "structure", "faq", "visual"
    description TEXT,             -- "도입부를 질문으로 시작하면 체류시간 증가"

    -- 검증 상태
    confidence_level TEXT DEFAULT 'EXPERIMENTAL',
    -- EXPERIMENTAL: 1-2회 테스트
    -- LOW: 3-5회, 승률 55%+
    -- MEDIUM: 6-10회, 승률 60%+
    -- HIGH: 11회+, 승률 65%+

    -- 통계
    test_count INT DEFAULT 0,     -- 테스트 횟수
    win_count INT DEFAULT 0,      -- 승리 횟수
    win_rate DECIMAL(5,2),        -- 승률 (%)
    avg_lift DECIMAL(5,2),        -- 평균 개선률 (%)

    -- 프롬프트 적용
    prompt_instruction TEXT,      -- 글 생성 시 적용할 지침
    is_active BOOLEAN DEFAULT true,

    -- 관련 테스트
    source_tests UUID[],          -- 이 패턴을 발견한 테스트 ID들

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(name, category)
);

CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_confidence ON patterns(confidence_level);
CREATE INDEX idx_patterns_active ON patterns(is_active) WHERE is_active = true;

-- updated_at 자동 갱신
CREATE TRIGGER update_patterns_updated_at
    BEFORE UPDATE ON patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 prompt_versions 테이블 (신규)

```sql
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    version TEXT NOT NULL,        -- "v1.0", "v1.1", ...
    name TEXT,                    -- "도입부 개선 버전"

    -- 프롬프트 내용
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,

    -- 적용된 패턴
    applied_patterns UUID[],      -- patterns 테이블 참조

    -- 성과 추적
    articles_generated INT DEFAULT 0,
    avg_engagement_score DECIMAL(5,2),

    -- 상태
    status TEXT DEFAULT 'draft',  -- draft, active, deprecated
    activated_at TIMESTAMPTZ,
    deprecated_at TIMESTAMPTZ,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(version)
);

CREATE INDEX idx_prompt_versions_status ON prompt_versions(status);
```

---

## 4. Claude 4.5 Opus 분석 로직

### 4.1 분석 프롬프트

```python
ANALYSIS_SYSTEM_PROMPT = """
당신은 건강 콘텐츠 A/B 테스트 분석 전문가입니다.

역할:
1. A/B 테스트 결과를 분석하여 승패 원인을 파악합니다.
2. 재사용 가능한 패턴을 추출합니다.
3. 향후 콘텐츠 생성에 적용할 구체적 지침을 제안합니다.

분석 원칙:
- 데이터 기반 판단 (추측 금지)
- 구체적이고 실행 가능한 패턴 도출
- 한국어 건강 콘텐츠 맥락 고려
"""

ANALYSIS_USER_PROMPT = """
## A/B 테스트 결과 분석

### 테스트 정보
- 테스트명: {test_name}
- 가설: {hypothesis}
- 테스트 영역: {target_section}

### A 버전 (Control)
{article_a_content}

성과:
- 평균 체류시간: {a_avg_time}초
- 스크롤 75% 도달률: {a_scroll_75}%
- 이탈률: {a_bounce_rate}%
- Engagement Score: {a_engagement_score}

### B 버전 (Variant)
{article_b_content}

성과:
- 평균 체류시간: {b_avg_time}초
- 스크롤 75% 도달률: {b_scroll_75}%
- 이탈률: {b_bounce_rate}%
- Engagement Score: {b_engagement_score}

### 통계 결과
- 승자: {winner}
- p-value: {p_value}
- Lift: {lift}%

---

다음 형식으로 분석 결과를 JSON으로 출력하세요:

{
  "summary": "분석 요약 (1-2문장)",
  "win_reason": "승리 원인 분석 (구체적)",
  "patterns": [
    {
      "name": "패턴 이름",
      "category": "intro|title|structure|faq|visual",
      "description": "패턴 설명",
      "prompt_instruction": "글 생성 시 적용할 구체적 지침"
    }
  ],
  "next_hypotheses": [
    {
      "hypothesis": "다음 테스트 가설",
      "expected_lift": 10,
      "priority": "high|medium|low"
    }
  ],
  "recommendations": [
    "즉시 적용 가능한 개선 사항"
  ]
}
"""
```

### 4.2 분석 함수

```python
import anthropic
import json

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

def analyze_ab_test(
    test: Dict,
    article_a: Dict,
    article_b: Dict,
    metrics_a: Dict,
    metrics_b: Dict,
    result: Dict
) -> Dict:
    """
    Claude 4.5 Opus를 사용하여 A/B 테스트 분석

    Returns:
        Dict: 분석 결과 (patterns, recommendations 포함)
    """
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # 프롬프트 구성
    user_prompt = ANALYSIS_USER_PROMPT.format(
        test_name=test["name"],
        hypothesis=test["hypothesis"],
        target_section=test.get("target_section", "전체"),
        article_a_content=format_article_content(article_a),
        a_avg_time=metrics_a.get("avg_time_on_page", 0),
        a_scroll_75=metrics_a.get("scroll_75_rate", 0),
        a_bounce_rate=metrics_a.get("bounce_rate", 0),
        a_engagement_score=metrics_a.get("engagement_score", 0),
        article_b_content=format_article_content(article_b),
        b_avg_time=metrics_b.get("avg_time_on_page", 0),
        b_scroll_75=metrics_b.get("scroll_75_rate", 0),
        b_bounce_rate=metrics_b.get("bounce_rate", 0),
        b_engagement_score=metrics_b.get("engagement_score", 0),
        winner=result["winner"],
        p_value=result["p_value"],
        lift=result["lift"],
    )

    # Claude API 호출
    response = client.messages.create(
        model="claude-sonnet-4-20250514",  # claude-opus-4-5-20251101 사용 가능
        max_tokens=2000,
        system=ANALYSIS_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )

    # JSON 파싱
    try:
        analysis = json.loads(response.content[0].text)
    except json.JSONDecodeError:
        # JSON 추출 시도
        import re
        json_match = re.search(r'\{[\s\S]*\}', response.content[0].text)
        if json_match:
            analysis = json.loads(json_match.group())
        else:
            raise ValueError("Claude 응답에서 JSON 추출 실패")

    return analysis
```

---

## 5. 패턴 업데이트 로직

### 5.1 패턴 저장/업데이트

```python
def update_patterns(conn, analysis: Dict, test_id: str):
    """
    분석 결과에서 추출된 패턴을 DB에 저장/업데이트
    """
    cursor = conn.cursor()

    for pattern in analysis.get("patterns", []):
        # 기존 패턴 확인
        cursor.execute("""
            SELECT id, test_count, win_count
            FROM patterns
            WHERE name = %s AND category = %s
        """, (pattern["name"], pattern["category"]))

        existing = cursor.fetchone()

        if existing:
            # 기존 패턴 업데이트
            pattern_id, test_count, win_count = existing
            new_test_count = test_count + 1
            new_win_count = win_count + 1  # 이 패턴으로 승리했으므로
            new_win_rate = (new_win_count / new_test_count) * 100

            # 신뢰도 레벨 결정
            confidence = determine_confidence_level(new_test_count, new_win_rate)

            cursor.execute("""
                UPDATE patterns
                SET
                    test_count = %s,
                    win_count = %s,
                    win_rate = %s,
                    confidence_level = %s,
                    source_tests = array_append(source_tests, %s),
                    updated_at = NOW()
                WHERE id = %s
            """, (new_test_count, new_win_count, new_win_rate, confidence, test_id, pattern_id))
        else:
            # 새 패턴 생성
            cursor.execute("""
                INSERT INTO patterns (
                    name, category, description, prompt_instruction,
                    confidence_level, test_count, win_count, win_rate,
                    source_tests
                ) VALUES (
                    %s, %s, %s, %s,
                    'EXPERIMENTAL', 1, 1, 100.0,
                    ARRAY[%s]::UUID[]
                )
            """, (
                pattern["name"],
                pattern["category"],
                pattern["description"],
                pattern["prompt_instruction"],
                test_id
            ))

    conn.commit()


def determine_confidence_level(test_count: int, win_rate: float) -> str:
    """패턴 신뢰도 레벨 결정 (PLANNING_v2.md 기준)"""
    if test_count >= 11 and win_rate >= 65:
        return "HIGH"
    elif test_count >= 6 and win_rate >= 60:
        return "MEDIUM"
    elif test_count >= 3 and win_rate >= 55:
        return "LOW"
    else:
        return "EXPERIMENTAL"
```

---

## 6. content_analysis 저장

```python
def save_analysis_result(
    conn,
    article_slug: str,
    article_version: str,
    test_id: str,
    metrics_snapshot: Dict,
    analysis: Dict
):
    """
    분석 결과를 content_analysis 테이블에 저장
    """
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO content_analysis (
            article_slug, article_version, trigger_type,
            metrics_snapshot, problems, hypotheses,
            recommended_action, ai_model, analysis_prompt_version
        ) VALUES (
            %s, %s, 'scheduled',
            %s, %s, %s,
            %s, 'claude-opus-4-5', 'v1.0'
        )
    """, (
        article_slug,
        article_version,
        json.dumps(metrics_snapshot),
        json.dumps(analysis.get("patterns", [])),
        json.dumps(analysis.get("next_hypotheses", [])),
        "pattern_update",
    ))

    conn.commit()
```

---

## 7. Cloud Function 구현

### 7.1 디렉토리 구조

```
functions/content_analyzer/
├── main.py           # Cloud Function 메인
├── requirements.txt  # 의존성
├── prompts.py        # 분석 프롬프트
└── deploy.sh         # 배포 스크립트
```

### 7.2 메인 함수

```python
@functions_framework.http
def analyze_completed_tests(request):
    """
    완료된 A/B 테스트를 분석하는 Cloud Function

    SPEC-002 완료 후 호출되거나, 수동으로 호출 가능
    """
    try:
        conn = get_db_connection()

        # 1. 미분석 완료 테스트 조회
        completed_tests = get_unanalyzed_completed_tests(conn)
        print(f"[Analyzer] {len(completed_tests)}개 테스트 분석 대기")

        results = []
        for test in completed_tests:
            # 2. 글 내용 조회
            article_a = get_article_by_slug_version(conn, test["article_slug"], "A")
            article_b = get_article_by_slug_version(conn, test["article_slug"], "B")

            # 3. 메트릭 조회
            metrics_a = get_version_metrics(conn, test["article_slug"], "A")
            metrics_b = get_version_metrics(conn, test["article_slug"], "B")

            # 4. Claude 분석
            analysis = analyze_ab_test(
                test, article_a, article_b,
                metrics_a, metrics_b,
                {"winner": test["winner_version"], "p_value": 0.1, "lift": test["actual_lift"]}
            )

            # 5. 패턴 업데이트
            update_patterns(conn, analysis, test["id"])

            # 6. 분석 결과 저장
            save_analysis_result(
                conn, test["article_slug"], test["winner_version"],
                test["id"], metrics_a, analysis
            )

            results.append({
                "test_id": str(test["id"]),
                "patterns_found": len(analysis.get("patterns", [])),
            })

        conn.close()
        return json.dumps({"status": "success", "analyzed": results}), 200

    except Exception as e:
        import traceback
        print(f"[Analyzer] 오류: {e}")
        print(traceback.format_exc())
        return json.dumps({"status": "error", "message": str(e)}), 500
```

---

## 8. 트리거 설정

### 8.1 SPEC-002에서 자동 호출

SPEC-002의 `evaluate_all_ab_tests` 함수에서 테스트가 완료되면 `content_analyzer`를 호출:

```python
# ga4_collector/main.py에 추가

def trigger_content_analyzer():
    """content_analyzer Cloud Function 호출"""
    import requests

    url = "https://asia-northeast3-galddae-health.cloudfunctions.net/content-analyzer"
    try:
        response = requests.post(url, timeout=30)
        print(f"[GA4 Collector] Content Analyzer 호출: {response.status_code}")
    except Exception as e:
        print(f"[GA4 Collector] Content Analyzer 호출 실패: {e}")
```

---

## 9. 비용 추정

### 9.1 Claude API 비용

| 항목 | 값 | 비용 |
|------|-----|------|
| 분석당 입력 토큰 | ~3,000 | - |
| 분석당 출력 토큰 | ~500 | - |
| 분석당 비용 (Opus) | - | ~$0.10 |
| 월간 분석 횟수 | ~50회 | ~$5 |

> Sonnet 사용 시 비용 1/3로 감소

---

## 10. 구현 단계

### Phase 1: DB 스키마

- [ ] `002_add_patterns_table.sql` 마이그레이션 실행
- [ ] `patterns` 테이블 생성
- [ ] `prompt_versions` 테이블 생성

### Phase 2: Cloud Function

- [ ] `functions/content_analyzer/` 디렉토리 생성
- [ ] `main.py` 작성
- [ ] `prompts.py` 작성
- [ ] `requirements.txt` 작성

### Phase 3: 연동

- [ ] SPEC-002 → SPEC-003 자동 호출 추가
- [ ] 로컬 테스트
- [ ] Cloud Function 배포

### Phase 4: 테스트

- [ ] 더미 A/B 테스트 데이터로 분석 테스트
- [ ] 패턴 저장 확인
- [ ] content_analysis 저장 확인

---

## 11. 완료 조건

- [ ] `patterns` 테이블 생성 및 인덱스 설정
- [ ] `content_analyzer` Cloud Function 배포
- [ ] A/B 테스트 완료 시 자동 분석 실행
- [ ] 분석 결과가 `content_analysis` 테이블에 저장
- [ ] 패턴이 `patterns` 테이블에 저장
- [ ] 패턴 신뢰도 레벨 자동 업데이트

---

## 12. 다음 단계

SPEC-003 완료 후:
- **SPEC-004**: 프롬프트 자동 업데이트 (검증된 패턴 → 글 생성 프롬프트 반영)
- **SPEC-005**: Notion 리포트 (분석 결과 자동 전송)

---

**문서 버전**: 1.0
**작성자**: R2-D2
**검토자**: -
