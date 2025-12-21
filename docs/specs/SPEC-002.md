# SPEC-002: GA4 데이터 자동 수집

> **상태**: Draft
> **우선순위**: P0
> **예상 기간**: 1일
> **작성일**: 2024-12-21
> **선행조건**: SPEC-001 완료

---

## 1. 목표

GA4 (Google Analytics 4)에서 글별 메트릭을 자동으로 수집하여 DB에 저장하고, A/B 테스트 결과를 평가할 수 있는 기반을 구축한다.

### 1.1 현재 상태

- GA4 Property ID: `517111075`
- GA4 Measurement ID: `G-YMWX4H2JFM`
- 데이터 수집: ScrollDepthTracker 컴포넌트로 스크롤 이벤트 전송 중
- 데이터 조회: 없음 (수동으로 GA4 콘솔에서 확인)

### 1.2 목표 상태

- Cloud Scheduler: 3일마다 자동 실행
- GA4 Data API: 글별 메트릭 조회
- DB 저장: `article_metrics` 테이블에 저장
- A/B 평가: 통계적 유의성 자동 판단

---

## 2. 수집 대상 메트릭

### 2.1 핵심 메트릭 (PLANNING_v2.md 기준)

| 메트릭 | GA4 Metric Name | 설명 | 가중치 |
|--------|-----------------|------|--------|
| 평균 체류시간 | `averageSessionDuration` | 글 페이지 체류 시간 | 25% |
| 스크롤 75% 도달률 | `eventCount` (scroll_depth event) | 본문 끝까지 읽은 비율 | 35% |
| 3초 이탈률 | `bounceRate` | 3초 내 이탈 비율 | 25% |
| 페이지뷰 | `screenPageViews` | 총 조회수 | 15% |

### 2.2 GA4 이벤트 구조

현재 `ScrollDepthTracker`에서 전송하는 이벤트:

```javascript
gtag('event', 'scroll_depth', {
  article_slug: slug,
  depth: percentage,  // 25, 50, 75, 100
  reading_time_seconds: timeSpent,
  expected_reading_time: expectedReadingTime,
});
```

---

## 3. 시스템 아키텍처

### 3.1 데이터 흐름

```
Cloud Scheduler (3일마다)
    ↓
Cloud Function (Python)
    ↓
GA4 Data API (메트릭 조회)
    ↓
article_metrics 테이블 저장
    ↓
A/B 테스트 평가 (p-value 계산)
    ↓
ab_tests 상태 업데이트
```

### 3.2 Cloud Function 구조

```python
# functions/ga4_collector/main.py

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    DateRange,
    Dimension,
    Metric,
)
import pg8000
import os

GA4_PROPERTY_ID = "517111075"

def collect_ga4_metrics(event, context):
    """3일마다 실행되는 GA4 데이터 수집 함수"""

    # 1. GA4 Data API 클라이언트 초기화
    client = BetaAnalyticsDataClient()

    # 2. 최근 3일 데이터 조회
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[DateRange(start_date="3daysAgo", end_date="today")],
        dimensions=[
            Dimension(name="pagePath"),
            Dimension(name="customEvent:article_slug"),
            Dimension(name="customEvent:article_version"),
        ],
        metrics=[
            Metric(name="averageSessionDuration"),
            Metric(name="bounceRate"),
            Metric(name="screenPageViews"),
            Metric(name="eventCount"),
        ],
    )

    response = client.run_report(request)

    # 3. DB 저장
    conn = connect_to_db()
    for row in response.rows:
        save_metrics(conn, row)

    # 4. A/B 테스트 평가
    evaluate_ab_tests(conn)

    return "OK"
```

---

## 4. DB 스키마

### 4.1 article_metrics 테이블 (이미 존재)

```sql
CREATE TABLE article_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_slug VARCHAR(255) NOT NULL,
    version CHAR(1) DEFAULT 'A',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- 핵심 메트릭
    pageviews INTEGER DEFAULT 0,
    avg_session_duration DECIMAL(10,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    scroll_25_count INTEGER DEFAULT 0,
    scroll_50_count INTEGER DEFAULT 0,
    scroll_75_count INTEGER DEFAULT 0,
    scroll_100_count INTEGER DEFAULT 0,

    -- 계산된 지표
    engagement_score DECIMAL(10,4),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(article_slug, version, period_start, period_end)
);
```

### 4.2 engagement_score 계산

```sql
-- 가중 점수 계산 (0-100 스케일)
engagement_score =
    (avg_session_duration / 300) * 25 +  -- 5분 기준 정규화
    (scroll_75_rate) * 35 +               -- 75% 도달률
    (1 - bounce_rate) * 25 +              -- 비이탈률
    (pageviews / expected_views) * 15     -- 조회수 정규화
```

---

## 5. A/B 테스트 평가

### 5.1 통계 설정 (PLANNING_v2.md 기준)

- **p-value 임계값**: 0.15 (탐색적 접근)
- **최소 샘플**: 각 버전 50 pageviews
- **테스트 기간**: 3일

### 5.2 평가 로직

```python
from scipy import stats

def evaluate_ab_test(a_metrics: dict, b_metrics: dict) -> dict:
    """A/B 테스트 통계적 유의성 평가"""

    # t-test로 engagement_score 비교
    t_stat, p_value = stats.ttest_ind(
        a_metrics['engagement_scores'],
        b_metrics['engagement_scores']
    )

    # 승자 결정
    if p_value < 0.15:
        winner = 'B' if b_metrics['avg_score'] > a_metrics['avg_score'] else 'A'
        conclusion = 'significant'
    else:
        winner = None
        conclusion = 'inconclusive'

    return {
        'winner': winner,
        'p_value': p_value,
        'conclusion': conclusion,
        'a_score': a_metrics['avg_score'],
        'b_score': b_metrics['avg_score'],
    }
```

### 5.3 ab_tests 상태 업데이트

```sql
UPDATE ab_tests
SET
    status = CASE
        WHEN winner IS NOT NULL THEN 'completed'
        ELSE 'running'
    END,
    winner_version = winner,
    p_value = calculated_p_value,
    completed_at = CASE WHEN winner IS NOT NULL THEN NOW() ELSE NULL END
WHERE id = test_id;
```

---

## 6. Cloud Scheduler 설정

### 6.1 스케줄 설정

```yaml
name: ga4-metrics-collector
schedule: "0 2 */3 * *"  # 3일마다 오전 2시
timeZone: "Asia/Seoul"
httpTarget:
  uri: https://asia-northeast3-galddae-health.cloudfunctions.net/collect_ga4_metrics
  httpMethod: POST
  oidcToken:
    serviceAccountEmail: ga4-collector@galddae-health.iam.gserviceaccount.com
```

### 6.2 서비스 계정 권한

```bash
# GA4 Data API 접근 권한
gcloud projects add-iam-policy-binding galddae-health \
  --member="serviceAccount:ga4-collector@galddae-health.iam.gserviceaccount.com" \
  --role="roles/analytics.viewer"

# Cloud SQL 접근 권한
gcloud projects add-iam-policy-binding galddae-health \
  --member="serviceAccount:ga4-collector@galddae-health.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

---

## 7. 구현 단계

### 7.1 Phase 1: Cloud Function 개발

1. [ ] `functions/ga4_collector/` 디렉토리 생성
2. [ ] `main.py` - GA4 Data API 연동
3. [ ] `requirements.txt` - 의존성 정의
4. [ ] 로컬 테스트

### 7.2 Phase 2: DB 연동

1. [ ] Cloud SQL 연결 설정
2. [ ] `article_metrics` 저장 로직
3. [ ] `engagement_score` 계산 로직

### 7.3 Phase 3: A/B 평가

1. [ ] t-test 구현 (scipy)
2. [ ] `ab_tests` 상태 업데이트
3. [ ] 승자 결정 알고리즘

### 7.4 Phase 4: 배포

1. [ ] Cloud Function 배포
2. [ ] Cloud Scheduler 설정
3. [ ] 모니터링 설정

---

## 8. 테스트 계획

### 8.1 단위 테스트

- [ ] GA4 Data API 연결 테스트
- [ ] 메트릭 파싱 테스트
- [ ] engagement_score 계산 테스트
- [ ] t-test 로직 테스트

### 8.2 통합 테스트

- [ ] 전체 파이프라인 테스트 (GA4 → DB)
- [ ] A/B 평가 테스트
- [ ] Cloud Scheduler 트리거 테스트

### 8.3 수동 테스트

- [ ] GA4 콘솔에서 데이터 확인
- [ ] DB에 저장된 데이터 확인
- [ ] 평가 결과 확인

---

## 9. 완료 조건

- [ ] Cloud Function이 GA4 Data API에서 데이터 조회
- [ ] `article_metrics` 테이블에 메트릭 저장
- [ ] `engagement_score` 자동 계산
- [ ] A/B 테스트 결과 자동 평가
- [ ] Cloud Scheduler 3일마다 자동 실행
- [ ] 에러 발생 시 알림 (Cloud Monitoring)

---

## 10. 다음 단계

SPEC-002 완료 후:
- **SPEC-003**: Claude 4.5 Opus 분석 (패턴 추출)
- **SPEC-004**: 프롬프트 자동 업데이트

---

**문서 버전**: 1.0
**작성자**: R2-D2
**검토자**: -
