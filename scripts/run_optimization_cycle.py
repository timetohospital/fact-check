#!/usr/bin/env python3
"""
콘텐츠 최적화 사이클 - 전체 파이프라인 실행

1. GA4 데이터 수집
2. 성과 분석 + A/B 가설 생성
3. B 버전 자동 생성 + 테스트 시작

실행: python scripts/run_optimization_cycle.py
스케줄: Cloud Scheduler에서 3일마다 실행
"""

import subprocess
import sys
from datetime import datetime
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent


def run_script(script_name: str) -> bool:
    """스크립트 실행"""
    script_path = SCRIPTS_DIR / script_name
    print(f"\n{'=' * 60}")
    print(f"🚀 실행: {script_name}")
    print(f"{'=' * 60}")

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=False,
            text=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 실패: {script_name}")
        print(f"   에러: {e}")
        return False


def main():
    """메인 실행"""
    print("=" * 60)
    print("🔄 콘텐츠 최적화 사이클 시작")
    print(f"📅 실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    steps = [
        ("fetch_ga_metrics.py", "GA4 성과 데이터 수집"),
        ("analyze_and_create_ab.py", "AI 분석 + A/B 테스트 생성"),
    ]

    results = []

    for script, description in steps:
        print(f"\n📌 Step: {description}")
        success = run_script(script)
        results.append((description, success))

    # 결과 요약
    print("\n" + "=" * 60)
    print("📊 실행 결과 요약")
    print("=" * 60)

    for desc, success in results:
        status = "✅ 성공" if success else "❌ 실패"
        print(f"  {status}: {desc}")

    all_success = all(r[1] for r in results)

    if all_success:
        print("\n🎉 모든 단계가 성공적으로 완료되었습니다!")
    else:
        print("\n⚠️  일부 단계가 실패했습니다. 로그를 확인하세요.")
        sys.exit(1)


if __name__ == "__main__":
    main()
