#!/usr/bin/env python3
"""
SPEC-006: 첫 번째 주제 패턴 실험 생성

5개 패턴 × 2개 주제 = 10개 글 생성 및 실험 등록
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

# 5개 패턴별 2개 주제
EXPERIMENT_TOPICS = {
    "pattern_a": {
        "name_ko": "기존 상식 뒤집기",
        "topics": [
            {
                "title": "올리브유가 암을 퍼뜨린다? 하버드 연구의 충격적 발견",
                "slug": "olive-oil-cancer-myth",
                "description": "건강식품의 대명사 올리브유가 암세포를 활성화시킨다는 연구 결과가 나왔다. 과연 사실일까?",
                "category": "food_nutrition",
            },
            {
                "title": "세척 샐러드가 햄버거보다 위험하다? 식품 전문가의 경고",
                "slug": "pre-washed-salad-danger",
                "description": "건강을 위해 먹는 세척 샐러드가 오히려 식중독 위험이 더 높다는 연구 결과. 그 이유는?",
                "category": "food_nutrition",
            }
        ]
    },
    "pattern_b": {
        "name_ko": "좋아하는 것 + 두려움",
        "topics": [
            {
                "title": "매운 음식 좋아하면 치매 걸린다? 15년간의 추적 연구",
                "slug": "spicy-food-dementia",
                "description": "캡사이신과 뇌 건강의 관계를 15년간 추적한 연구 결과가 충격적이다.",
                "category": "food_nutrition",
            },
            {
                "title": "아침 커피, 심장마비 위험 2배? 공복에 마시면 안 되는 이유",
                "slug": "morning-coffee-heart-attack",
                "description": "매일 아침 공복에 마시는 커피가 심장에 미치는 영향. 전문가들이 경고하는 이유.",
                "category": "lifestyle",
            }
        ]
    },
    "pattern_c": {
        "name_ko": "SNS 트렌드 팩트체크",
        "topics": [
            {
                "title": "입 테이프 붙이고 자면 건강해진다? 틱톡 트렌드의 진실",
                "slug": "mouth-taping-tiktok-trend",
                "description": "틱톡에서 유행하는 입 테이프 수면법. 과연 효과가 있을까, 위험할까?",
                "category": "sns_trend",
            },
            {
                "title": "본스매싱으로 얼굴형 바꾸기? 의사들이 말하는 진짜 위험",
                "slug": "bone-smashing-dangerous",
                "description": "인스타에서 퍼진 본스매싱 트렌드. 뼈를 두드려 얼굴형을 바꿀 수 있을까?",
                "category": "sns_trend",
            }
        ]
    },
    "pattern_d": {
        "name_ko": "오래된 상식 파괴",
        "topics": [
            {
                "title": "하루 8잔 물 마셔야 한다? 70년 된 오해의 진실",
                "slug": "8-glasses-water-myth",
                "description": "누구나 알고 있는 '하루 8잔 물' 상식. 그런데 이게 70년 전 오해에서 시작됐다면?",
                "category": "medical_myth",
            },
            {
                "title": "계란 노른자 매일 먹어도 괜찮다? 콜레스테롤 상식의 반전",
                "slug": "egg-yolk-cholesterol-myth",
                "description": "계란 노른자가 콜레스테롤을 높인다는 상식. 최신 연구는 완전히 다른 이야기를 한다.",
                "category": "food_nutrition",
            }
        ]
    },
    "pattern_e": {
        "name_ko": "수치 + 반전",
        "topics": [
            {
                "title": "간헐적 단식, 심혈관 사망률 91% 증가? 20만명 연구 결과",
                "slug": "intermittent-fasting-death-risk",
                "description": "다이어트의 대세 간헐적 단식이 오히려 심혈관 사망 위험을 91% 높인다는 대규모 연구 결과.",
                "category": "lifestyle",
            },
            {
                "title": "연어 발암물질 16배, 진실은? 양식 vs 자연산 충격 비교",
                "slug": "farmed-salmon-carcinogen",
                "description": "건강식품 연어에 발암물질이 16배나 더 많다? 양식 연어의 불편한 진실을 파헤친다.",
                "category": "food_nutrition",
            }
        ]
    }
}

# 기본 글 구조 템플릿
def create_article_sections(title: str, description: str) -> List[Dict]:
    """기본 글 구조 생성 (실제 콘텐츠는 추후 content-factcheck agent로 생성)"""
    return [
        {
            "type": "intro",
            "heading": None,
            "content": f"[이 섹션은 content-factcheck agent로 생성 예정]\n\n{description}\n\n이 글에서 그 진실을 파헤쳐 보겠습니다."
        },
        {
            "type": "body",
            "heading": "핵심 팩트체크",
            "content": "[이 섹션은 content-factcheck agent로 생성 예정]\n\n관련 연구와 전문가 의견을 바탕으로 팩트체크합니다."
        },
        {
            "type": "evidence",
            "heading": "근거가 되는 연구",
            "content": "[이 섹션은 content-factcheck agent로 생성 예정]\n\n신뢰할 수 있는 연구 결과를 정리합니다."
        },
        {
            "type": "conclusion",
            "heading": "결론 및 실천 방안",
            "content": "[이 섹션은 content-factcheck agent로 생성 예정]\n\n이 정보를 바탕으로 어떻게 행동해야 할지 정리합니다."
        },
        {
            "type": "faq",
            "heading": "자주 묻는 질문",
            "content": "[이 섹션은 content-factcheck agent로 생성 예정]\n\nQ1: ?\nA1: \n\nQ2: ?\nA2: "
        }
    ]


def create_experiment_and_articles():
    """실험 생성 및 글 등록"""
    print("🚀 SPEC-006 첫 번째 주제 패턴 실험 생성")

    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # 1. 실험 생성
        experiment_id = str(uuid.uuid4())
        experiment_name = f"2024-12 주제 패턴 비교 실험 #1"
        patterns_tested = list(EXPERIMENT_TOPICS.keys())

        print(f"\n📊 실험 생성: {experiment_name}")
        print(f"   ID: {experiment_id[:8]}...")
        print(f"   패턴: {', '.join(patterns_tested)}")

        cursor.execute("""
            INSERT INTO topic_experiments (
                id, name, description, prompt_version,
                patterns_tested, articles_per_pattern,
                primary_metric, test_duration_days,
                status, started_at
            ) VALUES (
                %s, %s, %s, %s,
                %s, 2,
                'engagement_score', 6,
                'running', NOW()
            )
        """, (
            experiment_id,
            experiment_name,
            "5가지 주제 패턴(상식뒤집기, 두려움연결, SNS트렌드, 오래된상식, 수치반전) 효과 비교",
            "v1.0",
            patterns_tested
        ))

        # 2. 패턴별 글 생성
        print("\n📝 패턴별 글 생성 중...")
        article_count = 0

        for pattern, pattern_data in EXPERIMENT_TOPICS.items():
            pattern_name = pattern_data["name_ko"]
            print(f"\n   {pattern} ({pattern_name}):")

            for topic in pattern_data["topics"]:
                article_id = str(uuid.uuid4())

                # articles 테이블에 삽입
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
                        %s,
                        %s, %s,
                        'published', 'claude-opus', 'v1.0'
                    )
                    ON CONFLICT (slug, version) DO UPDATE SET
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        topic_pattern = EXCLUDED.topic_pattern,
                        updated_at = NOW()
                    RETURNING id
                """, (
                    article_id,
                    topic["slug"],
                    topic["title"],
                    topic["description"],
                    topic["category"],
                    ["팩트체크", "건강", pattern_name],
                    topic["title"][:60],
                    topic["description"][:155],
                    json.dumps(create_article_sections(topic["title"], topic["description"]), ensure_ascii=False),
                    pattern,
                    topic["category"]
                ))

                returned_id = cursor.fetchone()[0]

                # experiment_articles 매핑 테이블에 삽입
                cursor.execute("""
                    INSERT INTO experiment_articles (
                        experiment_id, article_id, pattern_group
                    ) VALUES (%s, %s, %s)
                    ON CONFLICT (experiment_id, article_id) DO NOTHING
                """, (experiment_id, returned_id, pattern))

                print(f"      ✅ {topic['slug']}")
                article_count += 1

        conn.commit()

        # 3. 결과 확인
        cursor.execute("""
            SELECT
                ea.pattern_group,
                COUNT(*) as article_count,
                array_agg(a.slug) as slugs
            FROM experiment_articles ea
            JOIN articles a ON ea.article_id = a.id
            WHERE ea.experiment_id = %s
            GROUP BY ea.pattern_group
            ORDER BY ea.pattern_group
        """, (experiment_id,))

        print("\n" + "=" * 50)
        print("📊 실험 설정 완료!")
        print("=" * 50)

        for row in cursor.fetchall():
            print(f"\n   {row[0]}: {row[1]}개 글")
            for slug in row[2]:
                print(f"      - {slug}")

        print(f"\n✅ 총 {article_count}개 글 생성 완료")
        print(f"📅 실험 기간: 6일")
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


def check_experiment_status(experiment_id: str = None):
    """실험 상태 확인"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        if experiment_id:
            cursor.execute("""
                SELECT name, status, started_at, patterns_tested
                FROM topic_experiments
                WHERE id = %s
            """, (experiment_id,))
        else:
            cursor.execute("""
                SELECT name, status, started_at, patterns_tested
                FROM topic_experiments
                WHERE status = 'running'
                ORDER BY started_at DESC
                LIMIT 1
            """)

        result = cursor.fetchone()
        if result:
            print(f"\n📊 현재 진행 중인 실험:")
            print(f"   이름: {result[0]}")
            print(f"   상태: {result[1]}")
            print(f"   시작: {result[2]}")
            print(f"   패턴: {result[3]}")
        else:
            print("\n⚠️ 진행 중인 실험이 없습니다.")

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "status":
        check_experiment_status()
    else:
        experiment_id = create_experiment_and_articles()
        print("\n\n💡 다음 단계:")
        print("   1. content-factcheck agent로 각 글의 실제 콘텐츠 작성")
        print("   2. Firebase Hosting에 배포")
        print("   3. 6일 후 /analyze-experiments 엔드포인트로 분석 실행")
