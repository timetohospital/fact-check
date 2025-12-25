#!/usr/bin/env python3
"""
GA4 Data API에서 글별 성과 데이터를 수집하여 DB에 저장

실행: python scripts/fetch_ga_metrics.py
스케줄: 3일마다 실행

필요한 설정:
1. GCP에서 "Google Analytics Data API" 활성화
2. 서비스 계정에 GA4 Property 읽기 권한 부여
"""

import os
import json
from datetime import datetime, timedelta
from pathlib import Path
import psycopg2

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    Dimension,
    Metric,
    DateRange,
)

# ============================================
# 설정
# ============================================

# GA4 Property ID (숫자만)
GA4_PROPERTY_ID = os.getenv("GA4_PROPERTY_ID", "517111075")

# DB 연결 정보
DB_CONFIG = {
    "host": "34.64.111.186",
    "port": 5432,
    "user": "admin",
    "password": "galddae-password",
    "database": "factcheck_db"
}

# 데이터 수집 기간 (3일)
DAYS_TO_FETCH = 3


def get_ga4_client():
    """GA4 Data API 클라이언트 생성"""
    # 환경변수 또는 기본 인증 사용
    # GOOGLE_APPLICATION_CREDENTIALS 환경변수가 설정되어 있어야 함
    return BetaAnalyticsDataClient()


def fetch_article_metrics(client, start_date: str, end_date: str) -> list:
    """
    GA4에서 글별 성과 데이터 조회

    Returns:
        list of dict: [
            {
                "page_path": "/articles/empty-stomach-coffee",
                "date": "2024-12-20",
                "pageviews": 150,
                "unique_visitors": 120,
                "avg_time_on_page": 45.5,
                "bounce_rate": 35.2,
                ...
            }
        ]
    """
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        dimensions=[
            Dimension(name="pagePath"),
            Dimension(name="date"),
        ],
        metrics=[
            Metric(name="screenPageViews"),           # 페이지뷰
            Metric(name="totalUsers"),                 # 순 방문자
            Metric(name="averageSessionDuration"),     # 평균 세션 시간
            Metric(name="bounceRate"),                 # 이탈률
            Metric(name="engagementRate"),             # 참여율
            Metric(name="userEngagementDuration"),     # 참여 시간
        ],
        date_ranges=[
            DateRange(start_date=start_date, end_date=end_date)
        ],
        dimension_filter={
            "filter": {
                "field_name": "pagePath",
                "string_filter": {
                    "match_type": "BEGINS_WITH",
                    "value": "/articles/"
                }
            }
        }
    )

    response = client.run_report(request)

    results = []
    for row in response.rows:
        page_path = row.dimension_values[0].value
        date_str = row.dimension_values[1].value

        # /articles/slug 형태에서 slug 추출
        slug = page_path.replace("/articles/", "").split("?")[0].strip("/")

        if not slug:
            continue

        results.append({
            "article_slug": slug,
            "date": datetime.strptime(date_str, "%Y%m%d").strftime("%Y-%m-%d"),
            "pageviews": int(row.metric_values[0].value or 0),
            "unique_visitors": int(row.metric_values[1].value or 0),
            "avg_time_on_page": float(row.metric_values[2].value or 0),
            "bounce_rate": float(row.metric_values[3].value or 0) * 100,  # 비율 → 퍼센트
            "engagement_rate": float(row.metric_values[4].value or 0) * 100,
            "engagement_duration": float(row.metric_values[5].value or 0),
        })

    return results


def fetch_scroll_depth_metrics(client, start_date: str, end_date: str) -> dict:
    """
    스크롤 깊이 이벤트 데이터 조회 (커스텀 이벤트)

    Returns:
        dict: {
            "slug": {"scroll_25": 100, "scroll_50": 80, "scroll_75": 50, "scroll_100": 20}
        }
    """
    # 스크롤 깊이는 커스텀 이벤트로 추적해야 함
    # 현재는 기본 지표만 사용하고, 추후 커스텀 이벤트 추가 가능
    return {}


def calculate_engagement_score(metrics: dict) -> float:
    """
    종합 참여 점수 계산 (0-100)

    가중치:
    - 체류시간: 40%
    - 이탈률 (역): 30%
    - 참여율: 30%
    """
    # 체류시간 점수 (0-60초 → 0-100점, 60초 이상 → 100점)
    time_score = min(100, (metrics.get("avg_time_on_page", 0) / 60) * 100)

    # 이탈률 점수 (낮을수록 좋음, 역산)
    bounce_score = max(0, 100 - metrics.get("bounce_rate", 100))

    # 참여율 점수
    engagement_score = metrics.get("engagement_rate", 0)

    # 가중 평균
    total_score = (time_score * 0.4) + (bounce_score * 0.3) + (engagement_score * 0.3)

    return round(total_score, 2)


def save_to_db(metrics_list: list):
    """DB에 저장 (upsert)"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    inserted = 0
    updated = 0

    for m in metrics_list:
        engagement_score = calculate_engagement_score(m)

        # UPSERT (ON CONFLICT)
        cursor.execute("""
            INSERT INTO article_metrics (
                article_slug, article_version, date,
                pageviews, unique_visitors,
                avg_time_on_page, bounce_rate,
                engagement_score
            ) VALUES (
                %s, %s, %s,
                %s, %s,
                %s, %s,
                %s
            )
            ON CONFLICT (article_slug, article_version, date)
            DO UPDATE SET
                pageviews = EXCLUDED.pageviews,
                unique_visitors = EXCLUDED.unique_visitors,
                avg_time_on_page = EXCLUDED.avg_time_on_page,
                bounce_rate = EXCLUDED.bounce_rate,
                engagement_score = EXCLUDED.engagement_score,
                created_at = NOW()
            RETURNING (xmax = 0) as inserted
        """, (
            m["article_slug"],
            "A",  # 기본 버전
            m["date"],
            m["pageviews"],
            m["unique_visitors"],
            m["avg_time_on_page"],
            m["bounce_rate"],
            engagement_score
        ))

        result = cursor.fetchone()
        if result and result[0]:
            inserted += 1
        else:
            updated += 1

    conn.commit()
    cursor.close()
    conn.close()

    return inserted, updated


def main():
    """메인 실행"""
    print("🚀 GA4 성과 데이터 수집 시작")
    print(f"📊 Property ID: {GA4_PROPERTY_ID}")
    print(f"📅 수집 기간: 최근 {DAYS_TO_FETCH}일")

    # 날짜 계산
    end_date = datetime.now()
    start_date = end_date - timedelta(days=DAYS_TO_FETCH)

    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")

    print(f"   {start_str} ~ {end_str}")

    try:
        # GA4 클라이언트 생성
        client = get_ga4_client()
        print("✅ GA4 API 연결 성공")

        # 데이터 수집
        print("📥 글별 성과 데이터 수집 중...")
        metrics = fetch_article_metrics(client, start_str, end_str)
        print(f"   {len(metrics)}개 레코드 수집")

        if not metrics:
            print("⚠️  수집된 데이터가 없습니다. GA4 설정을 확인하세요.")
            return

        # DB 저장
        print("💾 DB 저장 중...")
        inserted, updated = save_to_db(metrics)
        print(f"   ✅ 신규: {inserted}개, 업데이트: {updated}개")

        # 요약 출력
        print("\n📋 수집된 데이터 요약:")
        print("-" * 60)

        # 상위 5개 글
        sorted_metrics = sorted(metrics, key=lambda x: x["pageviews"], reverse=True)
        for m in sorted_metrics[:5]:
            print(f"  {m['article_slug'][:40]}")
            print(f"    PV: {m['pageviews']} | 체류: {m['avg_time_on_page']:.1f}초 | 이탈: {m['bounce_rate']:.1f}%")

        print("\n🎉 GA4 데이터 수집 완료!")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        print("\n📋 체크리스트:")
        print("  1. GOOGLE_APPLICATION_CREDENTIALS 환경변수 설정")
        print("  2. 서비스 계정에 GA4 Property 읽기 권한 부여")
        print("  3. Google Analytics Data API 활성화")
        raise


if __name__ == "__main__":
    main()
