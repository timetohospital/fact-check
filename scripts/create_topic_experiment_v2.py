#!/usr/bin/env python3
"""
SPEC-006: 주제 패턴 실험 v2.0 - 50개 글 확장판

5개 패턴 × 10개 주제 = 50개 글 생성 및 실험 등록
"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, List
import psycopg2

DB_CONFIG = {
    "host": "34.64.111.186",
    "port": 5432,
    "user": "admin",
    "password": "galddae-password",
    "database": "factcheck_db"
}

# 5개 패턴별 10개 주제 (총 50개)
EXPERIMENT_TOPICS = {
    "pattern_a": {
        "name_ko": "기존 상식 뒤집기",
        "topics": [
            # 기존 2개
            {"title": "올리브유가 암을 퍼뜨린다? 하버드 연구의 충격적 발견", "slug": "olive-oil-cancer-myth", "description": "건강식품의 대명사 올리브유가 암세포를 활성화시킨다는 연구 결과가 나왔다. 과연 사실일까?", "category": "food_nutrition"},
            {"title": "세척 샐러드가 햄버거보다 위험하다? 식품 전문가의 경고", "slug": "pre-washed-salad-danger", "description": "건강을 위해 먹는 세척 샐러드가 오히려 식중독 위험이 더 높다는 연구 결과. 그 이유는?", "category": "food_nutrition"},
            # Round 1 추가
            {"title": "녹차가 간을 망친다? 건강 음료의 숨겨진 위험", "slug": "green-tea-liver-damage", "description": "건강을 위해 마시는 녹차가 오히려 간 손상을 유발할 수 있다는 연구 결과", "category": "food_nutrition"},
            {"title": "꿀이 설탕보다 해롭다? 천연 감미료의 불편한 진실", "slug": "honey-sugar-worse", "description": "건강하다고 알려진 꿀이 실제로는 설탕보다 더 해로울 수 있다는 연구", "category": "food_nutrition"},
            # Round 2 추가
            {"title": "현미밥이 백미보다 위험하다? 비소 함량의 충격적 진실", "slug": "brown-rice-arsenic", "description": "건강식의 대명사 현미에 비소가 백미보다 더 많다는 연구 결과", "category": "food_nutrition"},
            {"title": "코코넛 오일이 심장을 망친다? 슈퍼푸드의 어두운 면", "slug": "coconut-oil-heart-risk", "description": "건강 오일로 각광받던 코코넛 오일이 심장 건강에 해롭다는 연구", "category": "food_nutrition"},
            # Round 3 추가
            {"title": "알로에 베라가 발암물질? FDA 경고의 진실", "slug": "aloe-vera-carcinogen", "description": "피부에 좋다던 알로에 베라에 발암물질이 포함되어 있다는 FDA 연구", "category": "food_nutrition"},
            {"title": "녹즙이 신장결석을 유발한다? 건강 음료의 역습", "slug": "green-juice-kidney-stone", "description": "건강을 위해 마시는 녹즙이 신장결석 위험을 높인다는 연구 결과", "category": "food_nutrition"},
            # Round 4 추가
            {"title": "아보카도가 환경을 파괴한다? 슈퍼푸드의 환경 비용", "slug": "avocado-environmental-disaster", "description": "건강식품으로 사랑받는 아보카도가 환경에 미치는 충격적인 영향", "category": "food_nutrition"},
            {"title": "프로바이오틱스가 감염을 일으킨다? 유산균의 숨겨진 위험", "slug": "probiotic-infection-risk", "description": "건강을 위해 먹는 프로바이오틱스가 오히려 감염 위험을 높일 수 있다는 연구", "category": "food_nutrition"},
        ]
    },
    "pattern_b": {
        "name_ko": "좋아하는 것 + 두려움",
        "topics": [
            # 기존 2개
            {"title": "매운 음식 좋아하면 치매 걸린다? 15년간의 추적 연구", "slug": "spicy-food-dementia", "description": "캡사이신과 뇌 건강의 관계를 15년간 추적한 연구 결과가 충격적이다.", "category": "food_nutrition"},
            {"title": "아침 커피, 심장마비 위험 2배? 공복에 마시면 안 되는 이유", "slug": "morning-coffee-heart-attack", "description": "매일 아침 공복에 마시는 커피가 심장에 미치는 영향. 전문가들이 경고하는 이유.", "category": "lifestyle"},
            # Round 1 추가
            {"title": "초콜릿이 여드름을 유발한다? 달콤한 유혹의 피부 영향", "slug": "chocolate-acne-myth", "description": "초콜릿을 좋아하는 사람들이 두려워하는 여드름 유발설의 진실", "category": "food_nutrition"},
            {"title": "치즈가 뇌를 마약처럼 중독시킨다? 카소모르핀의 진실", "slug": "cheese-addiction-brain", "description": "치즈에 포함된 카소모르핀이 마약과 같은 중독 효과를 일으킨다는 연구", "category": "food_nutrition"},
            # Round 2 추가
            {"title": "붉은 고기가 암을 유발한다? WHO 발암물질 경고의 진실", "slug": "red-meat-cancer-link", "description": "붉은 고기를 좋아하는 사람들이 두려워하는 암 유발설의 과학적 진실", "category": "food_nutrition"},
            {"title": "탄산음료가 뼈를 녹인다? 콜라 마니아의 공포", "slug": "soda-bone-loss", "description": "탄산음료가 뼈를 약하게 만든다는 연구 결과, 과연 진실일까?", "category": "food_nutrition"},
            # Round 3 추가
            {"title": "튀긴 음식이 우울증을 유발한다? 치킨 러버의 공포", "slug": "fried-food-depression", "description": "튀긴 음식을 자주 먹으면 우울증 위험이 높아진다는 연구 결과", "category": "food_nutrition"},
            {"title": "아이스크림 두통이 뇌 손상 신호? 브레인 프리즈의 진실", "slug": "ice-cream-headache-damage", "description": "아이스크림을 먹을 때 느끼는 두통이 뇌 건강에 미치는 영향", "category": "food_nutrition"},
            # Round 4 추가
            {"title": "맥주가 내장지방을 만든다? 맥주배의 과학적 진실", "slug": "beer-belly-visceral-fat", "description": "맥주를 좋아하는 사람들이 두려워하는 맥주배, 정말 맥주 때문일까?", "category": "food_nutrition"},
            {"title": "에너지 드링크가 청소년 심장을 망친다? 카페인의 위험", "slug": "energy-drink-heart-teen", "description": "청소년들이 즐겨 마시는 에너지 드링크가 심장에 미치는 위험", "category": "lifestyle"},
        ]
    },
    "pattern_c": {
        "name_ko": "SNS 트렌드 팩트체크",
        "topics": [
            # 기존 2개
            {"title": "입 테이프 붙이고 자면 건강해진다? 틱톡 트렌드의 진실", "slug": "mouth-taping-tiktok-trend", "description": "틱톡에서 유행하는 입 테이프 수면법. 과연 효과가 있을까, 위험할까?", "category": "sns_trend"},
            {"title": "본스매싱으로 얼굴형 바꾸기? 의사들이 말하는 진짜 위험", "slug": "bone-smashing-dangerous", "description": "인스타에서 퍼진 본스매싱 트렌드. 뼈를 두드려 얼굴형을 바꿀 수 있을까?", "category": "sns_trend"},
            # Round 1 추가
            {"title": "드라이 스쿠핑이 심장을 멈출 수 있다? 틱톡 운동 트렌드의 위험", "slug": "dry-scooping-danger", "description": "틱톡에서 유행하는 드라이 스쿠핑이 심장마비를 일으킬 수 있다는 의사들의 경고", "category": "sns_trend"},
            {"title": "선크림 컨투어링이 피부암을 유발한다? 위험한 뷰티 트렌드", "slug": "sunscreen-contouring-skin-cancer", "description": "인스타에서 유행하는 선크림 컨투어링이 피부암 위험을 높인다는 피부과 전문의 경고", "category": "sns_trend"},
            # Round 2 추가
            {"title": "엽록소 물이 해독 효과가 있다? 틱톡 디톡스 트렌드의 진실", "slug": "chlorophyll-water-detox", "description": "틱톡에서 유행하는 엽록소 물 디톡스, 과연 과학적 근거가 있을까?", "category": "sns_trend"},
            {"title": "피마자유를 배꼽에 바르면 건강해진다? 틱톡 웰니스 트렌드", "slug": "castor-oil-belly-button", "description": "틱톡에서 화제인 피마자유 배꼽 테라피, 정말 효과가 있을까?", "category": "sns_trend"},
            # Round 3 추가
            {"title": "쌀뜨물로 머리 감으면 머릿결이 좋아진다? 틱톡 헤어케어 트렌드", "slug": "rice-water-hair-growth", "description": "틱톡에서 유행하는 쌀뜨물 헤어 린스, 과학적 근거가 있을까?", "category": "sns_trend"},
            {"title": "냉탕-온탕 반복이 회복에 도움 된다? 운동 트렌드의 진실", "slug": "ice-bath-recovery-myth", "description": "운동 후 냉탕 목욕이 근육 회복에 도움이 된다는 트렌드의 과학적 검증", "category": "sns_trend"},
            # Round 4 추가
            {"title": "슬러깅 스킨케어가 모공을 막는다? 뷰티 트렌드의 진실", "slug": "slugging-skincare-clog", "description": "틱톡에서 유행하는 바셀린 슬러깅 스킨케어, 정말 효과적일까?", "category": "sns_trend"},
            {"title": "레몬 커피가 다이어트에 효과적이다? 틱톡 다이어트 트렌드", "slug": "lemon-coffee-weight-loss", "description": "틱톡에서 화제인 레몬 커피 다이어트, 과학적 근거가 있을까?", "category": "sns_trend"},
        ]
    },
    "pattern_d": {
        "name_ko": "오래된 상식 파괴",
        "topics": [
            # 기존 2개
            {"title": "하루 8잔 물 마셔야 한다? 70년 된 오해의 진실", "slug": "8-glasses-water-myth", "description": "누구나 알고 있는 '하루 8잔 물' 상식. 그런데 이게 70년 전 오해에서 시작됐다면?", "category": "medical_myth"},
            {"title": "계란 노른자 매일 먹어도 괜찮다? 콜레스테롤 상식의 반전", "slug": "egg-yolk-cholesterol-myth", "description": "계란 노른자가 콜레스테롤을 높인다는 상식. 최신 연구는 완전히 다른 이야기를 한다.", "category": "food_nutrition"},
            # Round 1 추가
            {"title": "아침식사가 하루 중 가장 중요하다? 100년 된 마케팅의 진실", "slug": "breakfast-most-important-myth", "description": "아침이 가장 중요한 식사라는 상식은 사실 시리얼 회사의 마케팅에서 시작됐다", "category": "lifestyle"},
            {"title": "당근이 시력을 좋게 한다? 2차대전 프로파간다의 유산", "slug": "carrots-eyesight-myth", "description": "당근이 눈에 좋다는 상식은 사실 영국군의 프로파간다였다", "category": "food_nutrition"},
            # Round 2 추가
            {"title": "설탕이 아이들을 과잉행동하게 만든다? 부모들의 오해", "slug": "sugar-hyperactive-kids", "description": "50년간 믿어온 '설탕=과잉행동' 공식, 연구는 전혀 다른 결과를 보여준다", "category": "lifestyle"},
            {"title": "손가락 관절 꺾으면 관절염 생긴다? 60년 된 할머니 상식", "slug": "cracking-knuckles-arthritis", "description": "손가락 관절을 꺾으면 관절염이 생긴다는 상식, 한 의사가 60년간 직접 실험했다", "category": "medical_myth"},
            # Round 3 추가
            {"title": "식사 후 바로 수영하면 경련 온다? 30분 대기 신화", "slug": "swimming-after-eating", "description": "식사 후 30분은 수영하면 안 된다는 상식, 과학적 근거가 있을까?", "category": "lifestyle"},
            {"title": "어두운 곳에서 책 읽으면 눈 나빠진다? 부모님 세대 상식", "slug": "reading-dim-light-eyes", "description": "어두운 곳에서 책을 읽으면 시력이 나빠진다는 상식의 과학적 진실", "category": "medical_myth"},
            # Round 4 추가
            {"title": "면도하면 털이 더 굵어진다? 100년 된 오해의 진실", "slug": "shaving-thicker-hair", "description": "면도하면 털이 더 굵어진다는 상식, 과학적 근거가 있을까?", "category": "medical_myth"},
            {"title": "추우면 감기 걸린다? 오래된 할머니 상식의 진실", "slug": "cold-weather-catch-cold", "description": "추운 날씨에 나가면 감기에 걸린다는 상식, 바이러스와 온도의 관계", "category": "medical_myth"},
        ]
    },
    "pattern_e": {
        "name_ko": "수치 + 반전",
        "topics": [
            # 기존 2개
            {"title": "간헐적 단식, 심혈관 사망률 91% 증가? 20만명 연구 결과", "slug": "intermittent-fasting-death-risk", "description": "다이어트의 대세 간헐적 단식이 오히려 심혈관 사망 위험을 91% 높인다는 대규모 연구 결과.", "category": "lifestyle"},
            {"title": "연어 발암물질 16배, 진실은? 양식 vs 자연산 충격 비교", "slug": "farmed-salmon-carcinogen", "description": "건강식품 연어에 발암물질이 16배나 더 많다? 양식 연어의 불편한 진실을 파헤친다.", "category": "food_nutrition"},
            # Round 1 추가
            {"title": "앉아있는 것이 흡연만큼 위험하다? 의자가 당신을 죽인다", "slug": "sitting-smoking-comparison", "description": "하루 8시간 앉아있으면 흡연과 같은 사망 위험이 있다는 충격적인 연구", "category": "lifestyle"},
            {"title": "수면 부채가 사망률 13% 증가시킨다? 잠을 보충할 수 없다", "slug": "sleep-debt-death-risk", "description": "주말에 몰아 자도 평일 수면 부족은 회복되지 않는다는 연구 결과", "category": "lifestyle"},
            # Round 2 추가
            {"title": "가공육이 담배와 같은 1군 발암물질? WHO 분류의 진실", "slug": "processed-meat-who-cancer", "description": "WHO가 가공육을 담배와 같은 1군 발암물질로 분류한 진짜 의미", "category": "food_nutrition"},
            {"title": "청소년 스크린 타임, 우울증 위험 2배? 스마트폰 세대의 위기", "slug": "screen-time-depression-teen", "description": "하루 5시간 이상 스마트폰 사용 청소년의 우울증 위험이 2배라는 연구", "category": "lifestyle"},
            # Round 3 추가
            {"title": "설탕이 심장병 위험 38% 증가시킨다? 달콤한 독의 진실", "slug": "sugar-intake-heart-disease", "description": "첨가당 섭취가 심장병 사망 위험을 38% 높인다는 15년 추적 연구", "category": "food_nutrition"},
            {"title": "대기오염이 IQ를 낮춘다? 인지능력 4년 노화 효과", "slug": "air-pollution-iq-drop", "description": "대기오염 노출이 인지능력을 4년치 노화시킨다는 중국 대규모 연구", "category": "lifestyle"},
            # Round 4 추가
            {"title": "외로움이 흡연보다 위험하다? 사회적 고립의 치명적 영향", "slug": "loneliness-mortality-smoking", "description": "외로움이 하루 15개비 흡연과 같은 사망 위험을 가진다는 메타분석", "category": "lifestyle"},
            {"title": "초가공식품이 수명을 단축시킨다? 10% 증가당 사망률 14% 상승", "slug": "ultra-processed-food-death", "description": "초가공식품 섭취 10% 증가할 때마다 사망률 14% 증가하는 연구 결과", "category": "food_nutrition"},
        ]
    }
}


def create_experiment_v2():
    """실험 v2.0 생성 및 50개 글 등록"""
    print("🚀 SPEC-006 주제 패턴 실험 v2.0 - 50개 글 확장판")

    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # 0. 기존 실험 상태 확인 및 완료 처리
        cursor.execute("""
            UPDATE topic_experiments
            SET status = 'cancelled', ended_at = NOW()
            WHERE status = 'running'
        """)
        cancelled = cursor.rowcount
        if cancelled > 0:
            print(f"   ⚠️ 기존 실험 {cancelled}개 취소됨")

        # 1. 새 실험 생성
        experiment_id = str(uuid.uuid4())
        experiment_name = "2024-12 주제 패턴 비교 실험 v2.0 (50개 글)"
        patterns_tested = list(EXPERIMENT_TOPICS.keys())

        print(f"\n📊 실험 생성: {experiment_name}")
        print(f"   ID: {experiment_id[:8]}...")
        print(f"   패턴: {', '.join(patterns_tested)}")
        print(f"   패턴당 글 수: 10개")
        print(f"   총 글 수: 50개")

        cursor.execute("""
            INSERT INTO topic_experiments (
                id, name, description, prompt_version,
                patterns_tested, articles_per_pattern,
                primary_metric, test_duration_days,
                status, started_at
            ) VALUES (
                %s, %s, %s, %s,
                %s, 10,
                'engagement_score', 14,
                'running', NOW()
            )
        """, (
            experiment_id,
            experiment_name,
            "5가지 주제 패턴 효과 비교 - 확장판 (패턴당 10개 글, 총 50개)",
            "v2.0",
            patterns_tested
        ))

        # 2. 패턴별 글 등록 (DB에 upsert)
        print("\n📝 패턴별 글 등록 중...")
        article_count = 0
        new_count = 0
        updated_count = 0

        for pattern, pattern_data in EXPERIMENT_TOPICS.items():
            pattern_name = pattern_data["name_ko"]
            print(f"\n   {pattern} ({pattern_name}):")

            for topic in pattern_data["topics"]:
                article_id = str(uuid.uuid4())

                # articles 테이블에 upsert
                cursor.execute("""
                    INSERT INTO articles (
                        id, slug, version, is_active,
                        title, description, author, category, tags,
                        meta_title, meta_description,
                        sections,
                        topic_pattern, topic_category,
                        status, ai_model, prompt_version
                    ) VALUES (
                        %s, %s, 'A', true,
                        %s, %s, '편집팀', %s, %s,
                        %s, %s,
                        '[]'::jsonb,
                        %s, %s,
                        'published', 'claude-opus', 'v2.0'
                    )
                    ON CONFLICT (slug, version) DO UPDATE SET
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        topic_pattern = EXCLUDED.topic_pattern,
                        topic_category = EXCLUDED.topic_category,
                        updated_at = NOW()
                    RETURNING id, (xmax = 0) AS is_new
                """, (
                    article_id,
                    topic["slug"],
                    topic["title"],
                    topic["description"],
                    topic["category"],
                    ["팩트체크", "건강", pattern_name],
                    topic["title"][:60],
                    topic["description"][:155],
                    pattern,
                    topic["category"]
                ))

                result = cursor.fetchone()
                returned_id = result[0]
                is_new = result[1]

                if is_new:
                    new_count += 1
                    status = "✅ NEW"
                else:
                    updated_count += 1
                    status = "🔄 UPD"

                # experiment_articles 매핑 테이블에 삽입
                cursor.execute("""
                    INSERT INTO experiment_articles (
                        experiment_id, article_id, pattern_group
                    ) VALUES (%s, %s, %s)
                    ON CONFLICT (experiment_id, article_id) DO NOTHING
                """, (experiment_id, returned_id, pattern))

                print(f"      {status} {topic['slug']}")
                article_count += 1

        conn.commit()

        # 3. 결과 확인
        cursor.execute("""
            SELECT
                ea.pattern_group,
                COUNT(*) as article_count,
                array_agg(a.slug ORDER BY a.slug) as slugs
            FROM experiment_articles ea
            JOIN articles a ON ea.article_id = a.id
            WHERE ea.experiment_id = %s
            GROUP BY ea.pattern_group
            ORDER BY ea.pattern_group
        """, (experiment_id,))

        print("\n" + "=" * 60)
        print("📊 실험 설정 완료!")
        print("=" * 60)

        for row in cursor.fetchall():
            print(f"\n   {row[0]} ({row[1]}개 글):")
            for slug in row[2]:
                print(f"      - {slug}")

        print(f"\n✅ 총 {article_count}개 글 등록 완료")
        print(f"   - 신규: {new_count}개")
        print(f"   - 업데이트: {updated_count}개")
        print(f"\n📅 실험 기간: 14일")
        print(f"📏 주요 지표: engagement_score")
        print(f"\n🔗 실험 ID: {experiment_id}")

        return experiment_id

    except Exception as e:
        conn.rollback()
        print(f"\n❌ 오류 발생: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


def check_articles_status():
    """글 상태 확인 (MDX 파일 존재 여부)"""
    from pathlib import Path

    MDX_DIR = Path(__file__).parent.parent / "src" / "content" / "articles"

    print("📋 글 상태 확인\n")

    total = 0
    exists = 0
    missing = 0
    missing_list = []

    for pattern, pattern_data in EXPERIMENT_TOPICS.items():
        pattern_name = pattern_data["name_ko"]
        print(f"\n{pattern} ({pattern_name}):")

        for topic in pattern_data["topics"]:
            slug = topic["slug"]
            mdx_path = MDX_DIR / f"{slug}.mdx"
            total += 1

            if mdx_path.exists():
                print(f"   ✅ {slug}")
                exists += 1
            else:
                print(f"   ❌ {slug} (MDX 없음)")
                missing += 1
                missing_list.append(slug)

    print("\n" + "=" * 50)
    print(f"📊 총 {total}개 중 {exists}개 존재, {missing}개 누락")

    if missing_list:
        print(f"\n⚠️ 누락된 파일:")
        for slug in missing_list:
            print(f"   - {slug}.mdx")

    return missing_list


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "status":
            check_articles_status()
        elif sys.argv[1] == "check":
            check_articles_status()
        else:
            print(f"Unknown command: {sys.argv[1]}")
            print("Usage: python create_topic_experiment_v2.py [status|check]")
    else:
        experiment_id = create_experiment_v2()
        print("\n\n💡 다음 단계:")
        print("   1. python sync_mdx_to_db.py 실행 (MDX → DB 동기화)")
        print("   2. npm run build (Next.js 빌드)")
        print("   3. firebase deploy (Firebase 배포)")
        print("   4. 14일 후 분석 실행")
