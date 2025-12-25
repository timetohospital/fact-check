#!/usr/bin/env python3
"""
SPEC-006 마이그레이션 실행 스크립트
topic_experiments, experiment_articles 테이블 생성
"""

import psycopg2

DB_CONFIG = {
    "host": "34.64.111.186",
    "port": 5432,
    "user": "admin",
    "password": "galddae-password",
    "database": "factcheck_db"
}

# 개별 SQL 문 (트리거 제외 - 이미 존재할 수 있음)
MIGRATION_STATEMENTS = [
    # 1. articles 테이블에 컬럼 추가
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS topic_pattern TEXT;",
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS topic_category TEXT;",
    "ALTER TABLE articles DROP CONSTRAINT IF EXISTS valid_topic_pattern;",
    """ALTER TABLE articles ADD CONSTRAINT valid_topic_pattern CHECK (
        topic_pattern IS NULL OR topic_pattern IN (
            'pattern_a', 'pattern_b', 'pattern_c', 'pattern_d', 'pattern_e'
        )
    );""",
    "ALTER TABLE articles DROP CONSTRAINT IF EXISTS valid_topic_category;",
    """ALTER TABLE articles ADD CONSTRAINT valid_topic_category CHECK (
        topic_category IS NULL OR topic_category IN (
            'food_nutrition', 'sns_trend', 'lifestyle',
            'skincare_beauty', 'medical_myth', 'alternative_med'
        )
    );""",
    "CREATE INDEX IF NOT EXISTS idx_articles_topic_pattern ON articles(topic_pattern);",
    "CREATE INDEX IF NOT EXISTS idx_articles_topic_category ON articles(topic_category);",

    # 2. topic_experiments 테이블
    """CREATE TABLE IF NOT EXISTS topic_experiments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        prompt_version TEXT NOT NULL,
        patterns_tested TEXT[] NOT NULL,
        articles_per_pattern INT DEFAULT 2,
        primary_metric TEXT DEFAULT 'engagement_score',
        secondary_metrics TEXT[] DEFAULT '{"avg_time_on_page", "scroll_depth_avg", "bounce_rate"}',
        minimum_sample_size INT DEFAULT 100,
        test_duration_days INT DEFAULT 6,
        status TEXT DEFAULT 'draft',
        started_at TIMESTAMPTZ,
        ended_at TIMESTAMPTZ,
        winner_pattern TEXT,
        results JSONB,
        analysis_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT valid_experiment_status CHECK (
            status IN ('draft', 'running', 'completed', 'cancelled')
        )
    );""",
    "CREATE INDEX IF NOT EXISTS idx_topic_experiments_status ON topic_experiments(status);",
    "CREATE INDEX IF NOT EXISTS idx_topic_experiments_started ON topic_experiments(started_at DESC);",

    # 3. experiment_articles 테이블
    """CREATE TABLE IF NOT EXISTS experiment_articles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        experiment_id UUID NOT NULL REFERENCES topic_experiments(id) ON DELETE CASCADE,
        article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        pattern_group TEXT NOT NULL,
        total_pageviews INT DEFAULT 0,
        avg_time_on_page DECIMAL(10,2),
        avg_bounce_rate DECIMAL(5,2),
        avg_scroll_depth DECIMAL(5,2),
        engagement_score DECIMAL(5,2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        metrics_updated_at TIMESTAMPTZ,
        UNIQUE(experiment_id, article_id)
    );""",
    "CREATE INDEX IF NOT EXISTS idx_experiment_articles_experiment ON experiment_articles(experiment_id);",
    "CREATE INDEX IF NOT EXISTS idx_experiment_articles_pattern ON experiment_articles(pattern_group);",

    # 4. patterns 테이블에 topic_pattern_type 추가
    "ALTER TABLE patterns ADD COLUMN IF NOT EXISTS topic_pattern_type TEXT;",
    "ALTER TABLE patterns DROP CONSTRAINT IF EXISTS valid_topic_pattern_type;",
    """ALTER TABLE patterns ADD CONSTRAINT valid_topic_pattern_type CHECK (
        topic_pattern_type IS NULL OR topic_pattern_type IN (
            'pattern_a', 'pattern_b', 'pattern_c', 'pattern_d', 'pattern_e'
        )
    );""",
]

VIEW_STATEMENTS = [
    # 5. 뷰: 실험 대시보드
    """CREATE OR REPLACE VIEW v_topic_experiment_dashboard AS
    SELECT
        te.id as experiment_id,
        te.name as experiment_name,
        te.status,
        te.prompt_version,
        te.patterns_tested,
        te.started_at,
        te.test_duration_days,
        te.primary_metric,
        ea.pattern_group,
        COUNT(ea.article_id) as article_count,
        SUM(ea.total_pageviews) as total_pv,
        ROUND(AVG(ea.avg_time_on_page)::numeric, 2) as avg_time,
        ROUND(AVG(ea.avg_bounce_rate)::numeric, 2) as avg_bounce,
        ROUND(AVG(ea.avg_scroll_depth)::numeric, 2) as avg_scroll,
        ROUND(AVG(ea.engagement_score)::numeric, 2) as avg_engagement,
        CASE
            WHEN te.started_at IS NULL THEN 0
            ELSE LEAST(100, ROUND(
                EXTRACT(EPOCH FROM (NOW() - te.started_at)) /
                (te.test_duration_days * 86400) * 100
            )::numeric, 0)
        END as progress_pct
    FROM topic_experiments te
    LEFT JOIN experiment_articles ea ON te.id = ea.experiment_id
    WHERE te.status IN ('running', 'completed')
    GROUP BY te.id, te.name, te.status, te.prompt_version, te.patterns_tested,
             te.started_at, te.test_duration_days, te.primary_metric, ea.pattern_group
    ORDER BY te.started_at DESC, avg_engagement DESC NULLS LAST;""",

    # 6. 뷰: 패턴별 성과 순위
    """CREATE OR REPLACE VIEW v_pattern_performance AS
    WITH pattern_stats AS (
        SELECT
            ea.pattern_group,
            te.prompt_version,
            COUNT(DISTINCT ea.article_id) as article_count,
            SUM(ea.total_pageviews) as total_pv,
            ROUND(AVG(ea.avg_time_on_page)::numeric, 2) as avg_time,
            ROUND(AVG(ea.avg_bounce_rate)::numeric, 2) as avg_bounce,
            ROUND(AVG(ea.avg_scroll_depth)::numeric, 2) as avg_scroll,
            ROUND(AVG(ea.engagement_score)::numeric, 2) as avg_engagement
        FROM experiment_articles ea
        JOIN topic_experiments te ON te.id = ea.experiment_id
        WHERE te.status = 'completed'
        GROUP BY ea.pattern_group, te.prompt_version
    )
    SELECT
        pattern_group,
        prompt_version,
        article_count,
        total_pv,
        avg_time,
        avg_bounce,
        avg_scroll,
        avg_engagement,
        RANK() OVER (PARTITION BY prompt_version ORDER BY avg_engagement DESC) as engagement_rank,
        CASE
            WHEN pattern_group = 'pattern_a' THEN '기존 상식 뒤집기'
            WHEN pattern_group = 'pattern_b' THEN '좋아하는 것 + 두려움'
            WHEN pattern_group = 'pattern_c' THEN 'SNS 트렌드'
            WHEN pattern_group = 'pattern_d' THEN '오래된 상식 파괴'
            WHEN pattern_group = 'pattern_e' THEN '수치 + 반전'
            ELSE pattern_group
        END as pattern_name_ko
    FROM pattern_stats
    ORDER BY prompt_version, avg_engagement DESC;""",
]

def run_migration():
    print("🚀 SPEC-006 마이그레이션 시작")

    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # 기본 SQL 문 실행
        print("\n📦 테이블 및 제약조건 생성 중...")
        for i, stmt in enumerate(MIGRATION_STATEMENTS, 1):
            try:
                cursor.execute(stmt)
                print(f"   ✅ [{i}/{len(MIGRATION_STATEMENTS)}] 완료")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"   ⏭️  [{i}/{len(MIGRATION_STATEMENTS)}] 이미 존재")
                else:
                    print(f"   ❌ [{i}/{len(MIGRATION_STATEMENTS)}] 오류: {e}")

        conn.commit()

        # 뷰 생성
        print("\n📊 뷰 생성 중...")
        for i, stmt in enumerate(VIEW_STATEMENTS, 1):
            try:
                cursor.execute(stmt)
                print(f"   ✅ [{i}/{len(VIEW_STATEMENTS)}] 뷰 생성 완료")
            except Exception as e:
                print(f"   ❌ [{i}/{len(VIEW_STATEMENTS)}] 오류: {e}")

        conn.commit()

        # 결과 확인
        print("\n📋 생성된 테이블 확인...")
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('topic_experiments', 'experiment_articles')
        """)
        tables = cursor.fetchall()
        for table in tables:
            print(f"   ✅ {table[0]}")

        # 컬럼 확인
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'articles'
            AND column_name IN ('topic_pattern', 'topic_category')
        """)
        columns = cursor.fetchall()
        print("\n📋 articles 테이블 추가 컬럼:")
        for col in columns:
            print(f"   ✅ {col[0]}")

        print("\n✅ SPEC-006 마이그레이션 완료!")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ 마이그레이션 실패: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
