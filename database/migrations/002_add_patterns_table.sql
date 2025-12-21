-- ============================================
-- SPEC-003: 패턴 학습 시스템 스키마
-- 생성일: 2024-12-21
-- DB: factcheck_db @ galddae-user (Cloud SQL)
-- ============================================

-- ============================================
-- 1. patterns: 검증된 콘텐츠 패턴
-- ============================================
CREATE TABLE IF NOT EXISTS patterns (
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

    -- 제약조건
    UNIQUE(name, category),
    CONSTRAINT valid_category CHECK (
        category IN ('intro', 'title', 'structure', 'faq', 'visual', 'meta', 'other')
    ),
    CONSTRAINT valid_confidence CHECK (
        confidence_level IN ('EXPERIMENTAL', 'LOW', 'MEDIUM', 'HIGH')
    )
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON patterns(confidence_level);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON patterns(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_patterns_win_rate ON patterns(win_rate DESC) WHERE is_active = true;

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_patterns_updated_at
    BEFORE UPDATE ON patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 코멘트
COMMENT ON TABLE patterns IS '검증된 콘텐츠 패턴 - A/B 테스트로 발견된 성공 패턴';
COMMENT ON COLUMN patterns.confidence_level IS 'EXPERIMENTAL(1-2회) < LOW(3-5회,55%+) < MEDIUM(6-10회,60%+) < HIGH(11+회,65%+)';
COMMENT ON COLUMN patterns.prompt_instruction IS '글 생성 프롬프트에 적용할 구체적 지침';

-- ============================================
-- 2. prompt_versions: 프롬프트 버전 관리
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    version TEXT NOT NULL,        -- "v1.0", "v1.1", ...
    name TEXT,                    -- "도입부 개선 버전"
    description TEXT,             -- 변경 사유

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

    -- 제약조건
    UNIQUE(version),
    CONSTRAINT valid_status CHECK (
        status IN ('draft', 'active', 'deprecated')
    )
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_prompt_versions_status ON prompt_versions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_active ON prompt_versions(activated_at DESC) WHERE status = 'active';

-- 코멘트
COMMENT ON TABLE prompt_versions IS '글 생성 프롬프트 버전 관리';
COMMENT ON COLUMN prompt_versions.applied_patterns IS '이 버전에 적용된 패턴 ID 목록';

-- ============================================
-- 3. 초기 프롬프트 버전 삽입
-- ============================================
INSERT INTO prompt_versions (version, name, description, system_prompt, user_prompt_template, status, activated_at)
VALUES (
    'v1.0',
    '초기 버전',
    '기본 건강 콘텐츠 생성 프롬프트',
    '당신은 의학 전문가이자 건강 콘텐츠 작가입니다.
정확한 의학 정보를 바탕으로 독자가 이해하기 쉬운 건강 콘텐츠를 작성합니다.

작성 원칙:
1. 신뢰할 수 있는 의학 논문과 가이드라인을 참조합니다.
2. 전문 용어는 쉽게 풀어서 설명합니다.
3. 독자의 건강 결정에 도움이 되는 실용적 정보를 제공합니다.
4. 의료 면책 조항을 포함합니다.',
    '다음 주제로 건강 콘텐츠를 작성해주세요:

주제: {topic}
카테고리: {category}
타겟 독자: {target_audience}

요구사항:
- 제목: SEO 최적화된 매력적인 제목
- 도입부: 독자의 관심을 끄는 도입
- 본문: 체계적인 구조로 정보 전달
- 결론: 핵심 요약과 실천 방안
- 출처: 신뢰할 수 있는 참고 문헌',
    'active',
    NOW()
)
ON CONFLICT (version) DO NOTHING;

-- ============================================
-- 4. 뷰: 패턴 대시보드
-- ============================================
CREATE OR REPLACE VIEW v_pattern_dashboard AS
SELECT
    p.id,
    p.name,
    p.category,
    p.description,
    p.confidence_level,
    p.test_count,
    p.win_count,
    p.win_rate,
    p.avg_lift,
    p.is_active,
    p.created_at,
    p.updated_at,
    CASE
        WHEN p.confidence_level = 'HIGH' THEN '필수 적용'
        WHEN p.confidence_level = 'MEDIUM' THEN '권장'
        WHEN p.confidence_level = 'LOW' THEN '실험 중'
        ELSE '검증 필요'
    END as apply_status
FROM patterns p
WHERE p.is_active = true
ORDER BY
    CASE p.confidence_level
        WHEN 'HIGH' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'LOW' THEN 3
        ELSE 4
    END,
    p.win_rate DESC NULLS LAST;

-- ============================================
-- 5. 뷰: 프롬프트 버전 히스토리
-- ============================================
CREATE OR REPLACE VIEW v_prompt_history AS
SELECT
    pv.version,
    pv.name,
    pv.description,
    pv.status,
    pv.articles_generated,
    pv.avg_engagement_score,
    pv.activated_at,
    pv.deprecated_at,
    COALESCE(array_length(pv.applied_patterns, 1), 0) as pattern_count,
    pv.created_at
FROM prompt_versions pv
ORDER BY pv.created_at DESC;

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'SPEC-003 마이그레이션 완료: patterns, prompt_versions 테이블 생성';
END $$;
