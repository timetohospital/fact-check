"""
Cloud Functions 진입점 - 콘텐츠 최적화 사이클

Cloud Scheduler에서 3일마다 호출
"""

import functions_framework
import subprocess
import sys
from pathlib import Path


@functions_framework.http
def run_optimization_cycle(request):
    """
    HTTP 트리거 Cloud Function

    Cloud Scheduler에서 호출:
    - 3일마다 실행
    - GA4 데이터 수집 → AI 분석 → A/B 테스트 생성
    """
    import os

    # 스크립트 경로 설정
    scripts_dir = Path(__file__).parent.parent

    results = []

    # 1. GA4 데이터 수집
    try:
        exec(open(scripts_dir / "fetch_ga_metrics.py").read())
        results.append({"step": "GA4 수집", "status": "success"})
    except Exception as e:
        results.append({"step": "GA4 수집", "status": "failed", "error": str(e)})

    # 2. AI 분석 + A/B 생성
    try:
        exec(open(scripts_dir / "analyze_and_create_ab.py").read())
        results.append({"step": "AI 분석", "status": "success"})
    except Exception as e:
        results.append({"step": "AI 분석", "status": "failed", "error": str(e)})

    # 결과 반환
    all_success = all(r["status"] == "success" for r in results)

    return {
        "status": "success" if all_success else "partial_failure",
        "results": results
    }, 200 if all_success else 500


@functions_framework.cloud_event
def run_optimization_scheduled(cloud_event):
    """
    Cloud Event 트리거 (Pub/Sub 연동용)

    Cloud Scheduler → Pub/Sub → Cloud Function
    """
    import json

    print(f"Received event: {cloud_event.data}")

    # HTTP 함수 재사용
    class FakeRequest:
        pass

    result, status = run_optimization_cycle(FakeRequest())
    print(f"Result: {json.dumps(result)}")

    if status != 200:
        raise Exception(f"Optimization cycle failed: {result}")
