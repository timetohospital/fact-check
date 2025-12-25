-- ============================================
-- fact-check 콘텐츠 최적화 시스템 스키마
-- 생성일: 2024-12-20
-- DB: factcheck_db @ galddae-user (Cloud SQL)
-- ============================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. articles: 글 테이블 (A/B 버전 지원)
-- ============================================
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT 'A',  -- 'A', 'B', 'C'...
    is_active BOOLEAN DEFAULT true,

    -- 메타데이터
    title TEXT NOT NULL,
    description TEXT,
    author TEXT DEFAULT '36.5 의학팀',
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',

    -- SEO
    meta_title TEXT,
    meta_description TEXT,

    -- 본문 (섹션별 구조화)
    sections JSONB NOT NULL,

    -- 의료 신뢰성 (EEAT)
    sources TEXT[] DEFAULT '{}',
    medical_reviewer TEXT,
    reviewed_at TIMESTAMPTZ,

    -- 이미지
    image_url TEXT,
    image_alt TEXT,

    -- 상태 관리
    status TEXT DEFAULT 'draft',  -- draft, review, published, archived

    -- AI 생성 추적
    ai_model TEXT,
    prompt_version TEXT,
    generation_batch_id UUID,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    -- 제약조건: 같은 글의 여러 버전 허용
    UNIQUE(slug, version)
);

-- 인덱스
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_batch ON articles(generation_batch_id);
CREATE INDEX idx_articles_published ON articles(published_at DESC) WHERE status = 'published';

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. ab_tests: A/B 테스트 관리
-- ============================================
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_slug TEXT NOT NULL,

    -- 테스트 설정
    name TEXT NOT NULL,  -- "도입부 개선 테스트"
    hypothesis TEXT NOT NULL,  -- "도입부를 질문형으로 바꾸면 체류시간 증가"
    target_section TEXT,  -- "intro" (어떤 섹션 테스트인지)

    -- 버전 설정
    control_version TEXT DEFAULT 'A',
    variant_version TEXT DEFAULT 'B',
    traffic_split DECIMAL(3,2) DEFAULT 0.50,  -- 50:50

    -- 성공 기준
    primary_metric TEXT DEFAULT 'avg_time_on_page',  -- 주요 측정 지표
    minimum_sample_size INT DEFAULT 1000,  -- 최소 샘플 크기
    expected_lift DECIMAL(5,2),  -- 예상 개선률 (%)

    -- 상태
    status TEXT DEFAULT 'draft',  -- draft, running, paused, completed, cancelled
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- 결과
    winner_version TEXT,
    actual_lift DECIMAL(5,2),  -- 실제 개선률 (%)
    confidence_level DECIMAL(5,2),  -- 신뢰수준 (%)

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_traffic_split CHECK (traffic_split > 0 AND traffic_split < 1)
);

-- 인덱스
CREATE INDEX idx_ab_tests_article ON ab_tests(article_slug);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);
CREATE INDEX idx_ab_tests_running ON ab_tests(started_at) WHERE status = 'running';

CREATE TRIGGER update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. article_metrics: GA 성과 데이터 (일별 집계)
-- ============================================
CREATE TABLE article_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_slug TEXT NOT NULL,
    article_version TEXT NOT NULL DEFAULT 'A',
    date DATE NOT NULL,

    -- 트래픽 지표
    pageviews INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,

    -- 참여도 지표
    avg_time_on_page DECIMAL(10,2),  -- 초
    bounce_rate DECIMAL(5,2),  -- %
    exit_rate DECIMAL(5,2),  -- %

    -- 스크롤 지표
    scroll_depth_avg DECIMAL(5,2),  -- 평균 스크롤 깊이 %
    scroll_25_pct INT DEFAULT 0,  -- 25% 도달 수
    scroll_50_pct INT DEFAULT 0,  -- 50% 도달 수
    scroll_75_pct INT DEFAULT 0,  -- 75% 도달 수
    scroll_100_pct INT DEFAULT 0,  -- 100% 도달 수

    -- 계산된 점수
    engagement_score DECIMAL(5,2),  -- 종합 참여 점수 (0-100)

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 중복 방지
    UNIQUE(article_slug, article_version, date)
);

-- 인덱스
CREATE INDEX idx_metrics_slug ON article_metrics(article_slug);
CREATE INDEX idx_metrics_date ON article_metrics(date DESC);
CREATE INDEX idx_metrics_slug_date ON article_metrics(article_slug, date DESC);
CREATE INDEX idx_metrics_version ON article_metrics(article_slug, article_version);

-- ============================================
-- 4. content_analysis: AI 분석 결과
-- ============================================
CREATE TABLE content_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_slug TEXT NOT NULL,
    article_version TEXT DEFAULT 'A',

    -- 분석 트리거
    trigger_type TEXT NOT NULL,  -- 'scheduled', 'manual', 'performance_alert'

    -- 성과 스냅샷 (분석 시점 데이터)
    metrics_snapshot JSONB,  -- {"avg_time": 45, "bounce_rate": 65, ...}

    -- 문제점 진단
    problems JSONB,  -- [{"section": "intro", "issue": "너무 길다", "severity": "high"}]

    -- 개선 가설
    hypotheses JSONB,  -- [{"hypothesis": "...", "expected_lift": 15, "confidence": "medium"}]

    -- 다음 액션
    recommended_action TEXT,  -- 'run_ab_test', 'immediate_fix', 'monitor', 'no_action'
    action_taken BOOLEAN DEFAULT false,
    action_details TEXT,

    -- AI 메타
    ai_model TEXT,
    analysis_prompt_version TEXT,

    -- 타임스탬프
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_trigger CHECK (trigger_type IN ('scheduled', 'manual', 'performance_alert'))
);

-- 인덱스
CREATE INDEX idx_analysis_slug ON content_analysis(article_slug);
CREATE INDEX idx_analysis_date ON content_analysis(analyzed_at DESC);
CREATE INDEX idx_analysis_action ON content_analysis(recommended_action) WHERE action_taken = false;

-- ============================================
-- 5. generation_batches: 배치 생성 추적
-- ============================================
CREATE TABLE generation_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 배치 정보
    name TEXT,  -- "2024-12 건강정보 배치"
    description TEXT,

    -- 설정
    total_count INT NOT NULL,
    prompt_version TEXT NOT NULL,
    ai_model TEXT NOT NULL,

    -- 진행 상태
    status TEXT DEFAULT 'pending',  -- pending, running, completed, failed
    completed_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_batches_status ON generation_batches(status);

-- ============================================
-- 뷰: 실시간 A/B 테스트 대시보드
-- ============================================
CREATE VIEW v_ab_test_dashboard AS
SELECT
    t.id as test_id,
    t.article_slug,
    t.name as test_name,
    t.hypothesis,
    t.status,
    t.started_at,
    t.traffic_split,
    t.primary_metric,

    -- A 버전 성과 (최근 7일)
    ROUND(AVG(CASE WHEN m.article_version = t.control_version THEN m.avg_time_on_page END)::numeric, 2) as control_avg_time,
    ROUND(AVG(CASE WHEN m.article_version = t.control_version THEN m.bounce_rate END)::numeric, 2) as control_bounce,
    ROUND(AVG(CASE WHEN m.article_version = t.control_version THEN m.scroll_depth_avg END)::numeric, 2) as control_scroll,
    SUM(CASE WHEN m.article_version = t.control_version THEN m.pageviews ELSE 0 END) as control_views,

    -- B 버전 성과 (최근 7일)
    ROUND(AVG(CASE WHEN m.article_version = t.variant_version THEN m.avg_time_on_page END)::numeric, 2) as variant_avg_time,
    ROUND(AVG(CASE WHEN m.article_version = t.variant_version THEN m.bounce_rate END)::numeric, 2) as variant_bounce,
    ROUND(AVG(CASE WHEN m.article_version = t.variant_version THEN m.scroll_depth_avg END)::numeric, 2) as variant_scroll,
    SUM(CASE WHEN m.article_version = t.variant_version THEN m.pageviews ELSE 0 END) as variant_views,

    -- 리프트 계산
    CASE
        WHEN AVG(CASE WHEN m.article_version = t.control_version THEN m.avg_time_on_page END) > 0
        THEN ROUND(
            ((AVG(CASE WHEN m.article_version = t.variant_version THEN m.avg_time_on_page END) -
              AVG(CASE WHEN m.article_version = t.control_version THEN m.avg_time_on_page END)) /
             AVG(CASE WHEN m.article_version = t.control_version THEN m.avg_time_on_page END) * 100)::numeric, 2)
        ELSE NULL
    END as time_lift_pct

FROM ab_tests t
LEFT JOIN article_metrics m ON t.article_slug = m.article_slug
    AND m.date >= CURRENT_DATE - INTERVAL '7 days'
    AND m.article_version IN (t.control_version, t.variant_version)
WHERE t.status = 'running'
GROUP BY t.id, t.article_slug, t.name, t.hypothesis, t.status,
         t.started_at, t.traffic_split, t.primary_metric,
         t.control_version, t.variant_version;

-- ============================================
-- 뷰: 성과 하위 글 (개선 필요)
-- ============================================
CREATE VIEW v_underperforming_articles AS
WITH article_stats AS (
    SELECT
        article_slug,
        article_version,
        AVG(avg_time_on_page) as avg_time,
        AVG(bounce_rate) as avg_bounce,
        AVG(scroll_depth_avg) as avg_scroll,
        AVG(engagement_score) as avg_engagement,
        SUM(pageviews) as total_views
    FROM article_metrics
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY article_slug, article_version
),
percentiles AS (
    SELECT
        PERCENTILE_CONT(0.2) WITHIN GROUP (ORDER BY avg_engagement) as p20_engagement,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY avg_engagement) as median_engagement
    FROM article_stats
)
SELECT
    s.*,
    p.p20_engagement,
    p.median_engagement,
    ROUND(((p.median_engagement - s.avg_engagement) / p.median_engagement * 100)::numeric, 2) as below_median_pct
FROM article_stats s
CROSS JOIN percentiles p
WHERE s.avg_engagement < p.p20_engagement
ORDER BY s.avg_engagement ASC;

-- ============================================
-- 권한 설정 (Cloud Run 서비스 계정용)
-- ============================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "your-service-account";
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "your-service-account";

-- ============================================
-- 초기 데이터 (옵션)
-- ============================================
-- 테스트용 카테고리 확인
COMMENT ON TABLE articles IS '글 테이블 - A/B 버전 지원, JSONB 섹션 구조';
COMMENT ON TABLE ab_tests IS 'A/B 테스트 관리 - 가설, 트래픽 분배, 결과 추적';
COMMENT ON TABLE article_metrics IS 'GA 성과 데이터 - 일별 집계';
COMMENT ON TABLE content_analysis IS 'AI 분석 결과 - 문제점, 가설, 액션';
COMMENT ON TABLE generation_batches IS '배치 생성 추적';
