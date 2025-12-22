# fact-check 콘텐츠 최적화 시스템 - 계획 문서

> **작성일**: 2024-12-21
> **수정일**: 2024-12-22
> **상태**: 🚧 구현 진행 중
> **버전**: v2.1 (Claude Code CLI 적용)

---

## 1. 프로젝트 개요

### 1.1 비전

**데이터 기반 콘텐츠 진화 엔진** - AI가 스스로 학습하고 개선하는 콘텐츠 생산 시스템

### 1.2 핵심 목표

단순 A/B 테스트가 아닌 **패턴 학습 기반 자기강화 플라이휠**

매 사이클마다:
1. **무엇이 성공했는지** - 패턴 추출
2. **왜 성공했는지** - 원인 분석 (Claude Code CLI)
3. **다음 글에 어떻게 적용할지** - 규칙 업데이트
4. **글 생성 프롬프트에 자동 반영** - 점진적 품질 향상

### 1.3 핵심 차별점

| 기존 A/B 테스트 | 플라이휠 방식 |
|----------------|--------------|
| 단일 테스트 - 결과 - 끝 | 테스트 - 패턴 추출 - 프롬프트 개선 - 반복 |
| 수동 분석 | Claude Code CLI 자동 분석 |
| 개별 개선 | 시스템 전체 학습 |
| 느린 개선 속도 | 가속화되는 개선 속도 |

### 1.4 성공 지표 (6개월)

| 지표 | 현재 | 3개월 목표 | 6개월 목표 |
|------|------|-----------|-----------|
| 평균 체류시간 | 측정 필요 | +20% | +50% |
| 스크롤 75% 도달률 | 측정 필요 | +15% | +40% |
| 3초 이탈률 | 측정 필요 | -15% | -30% |
| A/B 테스트 B 승률 | N/A | 55%+ | 70%+ |
| 검증된 패턴 누적 | 0 | 30개 | 100개+ |
| 글 생성 프롬프트 버전 | v1.0 | v1.15+ | v2.0+ |

---

## 2. 현재 상태 (As-Is)

### 2.1 완료된 인프라

- ✅ Cloud SQL (factcheck_db): articles, ab_tests, article_metrics, content_analysis
- ✅ GA4 (Property ID: 517111075, 측정 ID: G-YMWX4H2JFM)
- ✅ Firebase Hosting: https://health-factcheck-web.web.app

### 2.2 구현 진행 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| Next.js DB 연동 | ✅ 완료 | SPEC-001 |
| GA4 자동 수집 | ✅ 완료 | SPEC-002 |
| Claude 분석 시스템 | ✅ 코드 완료 | SPEC-003 (배포 대기) |
| patterns 테이블 | ⏳ 대기 | 마이그레이션 필요 |
| prompt_versions 테이블 | ⏳ 대기 | 마이그레이션 필요 |
| OAuth Token 생성 | ✅ 완료 | 로컬 테스트 성공 |
| Cloud Run 배포 | ⏳ 대기 | Dockerfile 준비 완료 |
| Notion 연동 | ⏳ 대기 | SPEC-005 |

---

## 3. 플라이휠 설계

### 3.1 핵심 설정

- 사이클: 3일마다
- 테스트: 5쌍 (A 5개, B 5개)
- p-value: 0.15 (탐색적)
- AI: Claude Code CLI (구독 기반)

### 3.2 플라이휠 가속 메커니즘

- Week 1-4: 느린 시작 - 기본 패턴 발견 (테스트 20회, 패턴 5-10개)
- Week 5-12: 가속 단계 - 패턴 간 조합 발견 (테스트 40회, 패턴 20-40개)
- Week 13+: 자기강화 - 새 글이 자동으로 최적화

---

## 4. 테스트 영역 분류

### 4.1 5대 테스트 영역

| 영역 | 측정 지표 | 테스트 예시 | 우선순위 |
|------|----------|------------|---------|
| 도입부 (훅) | 3초 이탈률 | 질문형 vs 팩트형 | P0 |
| 제목/메타 | CTR | 숫자 포함 vs 감정 호소 | P0 |
| 본문 구조 | 스크롤 깊이 | 결론 먼저 vs 점진적 전개 | P1 |
| FAQ/결론 | 체류시간 | Q&A 5개 vs 3개 | P1 |
| 시각 요소 | 참여도 | 인포그래픽 유무 | P2 |

---

## 5. A/B 테스트 설계

### 5.1 통계 설정

| 항목 | 값 | 이유 |
|------|-----|------|
| p-value 기준 | 0.15 | 탐색적 테스트, 패턴 발견 목적 |
| 최소 샘플 크기 | 50 PV | 빠른 피드백 루프 |
| 테스트 기간 | 6일 | 충분한 데이터 + 빠른 반복 |
| 동시 테스트 수 | 5쌍 | 다양한 가설 탐색 |

---

## 6. Claude Code CLI 분석 시스템 (변경됨)

### 6.1 아키텍처

```
Cloud Scheduler (3일마다)
         ↓
Cloud Run (Docker)
  - Image: ghcr.io/cabinlab/claude-code-sdk:python
  - ENV: CLAUDE_CODE_OAUTH_TOKEN
         ↓
Claude Code CLI (subprocess)
         ↓
Cloud SQL (factcheck_db)
```

### 6.2 분석 역할

입력:
- 글 A (원본) + 성과 데이터
- 글 B (변형) + 성과 데이터
- 상위 성과 글 샘플 3개

분석 작업:
1. 승패 원인 분석
2. 패턴 추출
3. 다음 테스트 가설 제안
4. 글 생성 가이드 업데이트 제안

출력:
- 분석 리포트 (Notion 전송)
- 패턴 DB 업데이트
- 다음 테스트 가설 목록

### 6.3 인증 방식

```bash
# 1. OAuth Token 생성 (로컬에서 1회)
claude setup-token
# 출력: sk-ant-oat01-xxxxxxxx...

# 2. 로컬 테스트 (.env 파일)
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-your-token

# 3. 프로덕션 (GCP Secret Manager)
echo -n "token" | gcloud secrets create claude-oauth-token --data-file=-
```

---

## 7. 패턴 학습 시스템

### 7.1 패턴 신뢰도 레벨

| 레벨 | 조건 | 프롬프트 적용 |
|------|------|--------------|
| EXPERIMENTAL | 테스트 1-2회 | 적용 안 함 |
| LOW | 3-5회, 승률 55%+ | [실험 중] |
| MEDIUM | 6-10회, 승률 60%+ | [권장] |
| HIGH | 11회+, 승률 65%+ | [필수] |

---

## 8. SPEC 문서 구성

| SPEC ID | 제목 | 상태 | 비고 |
|---------|------|------|------|
| SPEC-001 | DB 기반 콘텐츠 서빙 | ✅ 완료 | 커밋: `1f266d3` |
| SPEC-002 | GA4 자동 수집 | ✅ 완료 | 커밋: `45f578f` |
| SPEC-003 | Claude Code CLI 분석 | ✅ 코드 완료 | 커밋: `db9a9dc` (배포 대기) |
| SPEC-004 | 프롬프트 자동 업데이트 | 📝 문서 작성 | SPEC-003 연동 |
| SPEC-005 | Notion 리포트 | ⏳ 대기 | |

---

## 9. 비용 추정 (2024-12-22 수정)

### 변경 전 (Anthropic API)
| 항목 | 월 비용 |
|------|--------|
| Cloud SQL | $50 |
| Claude API | ~$425 |
| 기타 | $1 |
| 합계 | ~$476 |

### 변경 후 (Claude Code 구독 활용)
| 항목 | 월 비용 |
|------|--------|
| Cloud SQL | $50 |
| Claude API | **$0** (구독) |
| Cloud Run | ~$5 |
| 합계 | **~$55** |

> **88% 비용 절감!**
>
> Claude Code CLI를 Docker 컨테이너에서 실행하여 구독 기반으로 사용.
> `claude setup-token`으로 OAuth Token 생성 후 환경변수로 주입.

---

## 10. 다음 단계

### 즉시 필요
1. [ ] DB 마이그레이션 실행 (patterns, prompt_versions 테이블)
2. [ ] GCP Secret Manager에 OAuth Token 저장
3. [ ] Cloud Run 배포 (content-analyzer)
4. [ ] Cloud Scheduler 설정 (3일마다)

### 후속 작업
5. [ ] SPEC-004 구현 (프롬프트 자동 업데이트)
6. [ ] SPEC-005 구현 (Notion 리포트)
7. [ ] 첫 A/B 테스트 배치 실행

---

## 11. 커밋 히스토리

| 커밋 | 내용 |
|------|------|
| `1f266d3` | feat(SPEC-001): DB 기반 콘텐츠 서빙 구현 |
| `45f578f` | feat(SPEC-002): GA4 데이터 자동 수집 Cloud Function |
| `1ffab80` | feat(SPEC-003): Claude 분석 시스템 및 패턴 학습 |
| `db9a9dc` | refactor(SPEC-003): Anthropic API → Claude Code CLI 기반으로 변경 |

---

문서 버전: v2.1
최종 수정: 2024-12-22
상태: 구현 진행 중
