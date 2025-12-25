-- ============================================
-- SPEC-006: 주제/카테고리 기반 실험 시스템
-- 생성일: 2024-12-24
-- DB: factcheck_db @ galddae-user (Cloud SQL)
--
-- 변경 사항:
-- - 기존 ab_tests: 동일 주제, 다른 표현 비교
-- - 신규 topic_experiments: 다른 주제/카테고리 비교
-- ============================================

-- ============================================
-- 1. articles 테이블에 topic_pattern 컬럼 추가
-- ============================================
-- 주제 패턴 카테고리:
-- pattern_a: 기존 상식 뒤집기 ("건강하다고 알려진 것이 해롭다")
-- pattern_b: 좋아하는 것 + 두려움 연결 ("매운 음식 좋아하면 치매?")
-- pattern_c: SNS 트렌드 팩트체크 ("입 테이프 붙이고 자면?")
-- pattern_d: 오래된 상식 파괴 ("하루 8잔 물, 70년 된 오해")
-- pattern_e: 구체적 수치 + 반전 ("심혈관 사망률 91% 증가")

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS topic_pattern TEXT;

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS topic_category TEXT;

-- topic_pattern 유효성 검사
ALTER TABLE articles
DROP CONSTRAINT IF EXISTS valid_topic_pattern;

ALTER TABLE articles
ADD CONSTRAINT valid_topic_pattern CHECK (
    topic_pattern IS NULL OR topic_pattern IN (
        'pattern_a',  -- 기존 상식 뒤집기
        'pattern_b',  -- 좋아하는 것 + 두려움
        'pattern_c',  -- SNS 트렌드
        'pattern_d',  -- 오래된 상식 파괴
        'pattern_e'   -- 수치 + 반전
    )
);

-- topic_category 유효성 검사 (더 세분화된 분류)
ALTER TABLE articles
DROP CONSTRAINT IF EXISTS valid_topic_category;

ALTER TABLE articles
ADD CONSTRAINT valid_topic_category CHECK (
    topic_category IS NULL OR topic_category IN (
        'food_nutrition',    -- 음식/영양
        'sns_trend',         -- SNS 트렌드
        'lifestyle',         -- 생활습관
        'skincare_beauty',   -- 스킨케어/뷰티
        'medical_myth',      -- 의학 미신
        'alternative_med'    -- 대체의학
    )
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_articles_topic_pattern ON articles(topic_pattern);
CREATE INDEX IF NOT EXISTS idx_articles_topic_category ON articles(topic_category);

-- ============================================
-- 2. topic_experiments: 주제 패턴 실험 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS topic_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 실험 식별
    name TEXT NOT NULL,                    -- "2024-12 주제 패턴 비교 실험 #1"
    description TEXT,                       -- 실험 목적 설명

    -- 실험 설정
    prompt_version TEXT NOT NULL,           -- 사용된 프롬프트 버전 (v1.0, v1.1...)
    patterns_tested TEXT[] NOT NULL,        -- 테스트된 패턴들 ['pattern_a', 'pattern_b', ...]
    articles_per_pattern INT DEFAULT 2,     -- 패턴당 글 수

    -- 성공 기준
    primary_metric TEXT DEFAULT 'engagement_score',  -- 주요 측정 지표
    secondary_metrics TEXT[] DEFAULT '{"avg_time_on_page", "scroll_depth_avg", "bounce_rate"}',
    minimum_sample_size INT DEFAULT 100,    -- 패턴당 최소 PV
    test_duration_days INT DEFAULT 6,       -- 테스트 기간

    -- 상태
    status TEXT DEFAULT 'draft',            -- draft, running, completed, cancelled
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- 결과
    winner_pattern TEXT,                    -- 승리 패턴
    results JSONB,                          -- 상세 결과 데이터
    -- 예: {
    --   "pattern_a": {"avg_engagement": 72.5, "avg_time": 45.2, "total_pv": 523},
    --   "pattern_b": {"avg_engagement": 68.1, "avg_time": 38.7, "total_pv": 498},
    --   "ranking": ["pattern_a", "pattern_c", "pattern_b", ...]
    -- }

    analysis_notes TEXT,                    -- Claude 분석 결과 요약

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT valid_experiment_status CHECK (
        status IN ('draft', 'running', 'completed', 'cancelled')
    )
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_topic_experiments_status ON topic_experiments(status);
CREATE INDEX IF NOT EXISTS idx_topic_experiments_started ON topic_experiments(started_at DESC);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_topic_experiments_updated_at
    BEFORE UPDATE ON topic_experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 코멘트
COMMENT ON TABLE topic_experiments IS '주제 패턴 기반 실험 - 다른 주제/카테고리 비교';
COMMENT ON COLUMN topic_experiments.patterns_tested IS '테스트된 주제 패턴 목록 (pattern_a~e)';
COMMENT ON COLUMN topic_experiments.results IS 'JSON 형태의 상세 결과 데이터';

-- ============================================
-- 3. experiment_articles: 실험-글 매핑 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS experiment_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    experiment_id UUID NOT NULL REFERENCES topic_experiments(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

    -- 이 실험에서의 역할
    pattern_group TEXT NOT NULL,            -- 어떤 패턴 그룹인지

    -- 개별 성과 (실험 기간 중 집계)
    total_pageviews INT DEFAULT 0,
    avg_time_on_page DECIMAL(10,2),
    avg_bounce_rate DECIMAL(5,2),
    avg_scroll_depth DECIMAL(5,2),
    engagement_score DECIMAL(5,2),

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metrics_updated_at TIMESTAMPTZ,

    -- 중복 방지
    UNIQUE(experiment_id, article_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_experiment_articles_experiment ON experiment_articles(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_articles_pattern ON experiment_articles(pattern_group);

-- 코멘트
COMMENT ON TABLE experiment_articles IS '실험과 글의 매핑 및 개별 성과 추적';

-- ============================================
-- 4. 뷰: 실험 대시보드
-- ============================================
CREATE OR REPLACE VIEW v_topic_experiment_dashboard AS
SELECT
    te.id as experiment_id,
    te.name as experiment_name,
    te.status,
    te.prompt_version,
    te.patterns_tested,
    te.started_at,
    te.test_duration_days,
    te.primary_metric,

    -- 패턴별 집계
    ea.pattern_group,
    COUNT(ea.article_id) as article_count,
    SUM(ea.total_pageviews) as total_pv,
    ROUND(AVG(ea.avg_time_on_page)::numeric, 2) as avg_time,
    ROUND(AVG(ea.avg_bounce_rate)::numeric, 2) as avg_bounce,
    ROUND(AVG(ea.avg_scroll_depth)::numeric, 2) as avg_scroll,
    ROUND(AVG(ea.engagement_score)::numeric, 2) as avg_engagement,

    -- 테스트 진행률
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
ORDER BY te.started_at DESC, avg_engagement DESC NULLS LAST;

-- ============================================
-- 5. 뷰: 패턴별 성과 순위
-- ============================================
CREATE OR REPLACE VIEW v_pattern_performance AS
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
ORDER BY prompt_version, avg_engagement DESC;

-- ============================================
-- 6. patterns 테이블에 topic_pattern_type 추가
-- ============================================
-- 기존 patterns는 표현 패턴(도입부, 제목 등)
-- topic_pattern_type은 주제 패턴 연결
ALTER TABLE patterns
ADD COLUMN IF NOT EXISTS topic_pattern_type TEXT;

ALTER TABLE patterns
DROP CONSTRAINT IF EXISTS valid_topic_pattern_type;

ALTER TABLE patterns
ADD CONSTRAINT valid_topic_pattern_type CHECK (
    topic_pattern_type IS NULL OR topic_pattern_type IN (
        'pattern_a', 'pattern_b', 'pattern_c', 'pattern_d', 'pattern_e'
    )
);

-- ============================================
-- 7. 기존 ab_tests 테이블 비활성화 (삭제 대신)
-- ============================================
-- 기존 데이터 보존을 위해 삭제하지 않고 deprecated 표시
COMMENT ON TABLE ab_tests IS 'DEPRECATED: 동일 주제 A/B 테스트 - topic_experiments로 대체됨';

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'SPEC-006 마이그레이션 완료: topic_experiments, experiment_articles 테이블 생성';
    RAISE NOTICE '주제 패턴: pattern_a(상식뒤집기), pattern_b(두려움연결), pattern_c(SNS트렌드), pattern_d(오래된상식), pattern_e(수치반전)';
END $$;
