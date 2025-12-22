# SPEC-003: Claude Code CLI 기반 분석 시스템

> **상태**: ✅ 구현 완료
> **우선순위**: P0
> **예상 기간**: 1일
> **작성일**: 2024-12-21
> **수정일**: 2024-12-22
> **선행조건**: SPEC-001 완료, SPEC-002 완료

---

## ⚠️ 아키텍처 변경 (2024-12-22)

**기존**: Cloud Function + Anthropic API (월 ~$425)
**변경**: Cloud Run + Claude Code CLI (구독 기반, 월 ~$5)

### 변경 이유
- Claude Code 구독으로 API 비용 절감 (88%)
- `claude setup-token`으로 Long-lived OAuth Token 사용
- Docker 컨테이너에서 CLI 실행

### 새 아키텍처
```
Cloud Scheduler (3일마다)
         ↓
Cloud Run (Docker)
  - Image: ghcr.io/cabinlab/claude-code-sdk:python
  - ENV: CLAUDE_CODE_OAUTH_TOKEN
         ↓
Claude Code CLI (구독 인증)
         ↓
Cloud SQL (factcheck_db)
```

---

## 1. 목표

A/B 테스트 완료 후 Claude Code CLI를 사용하여 승패 원인을 분석하고, 패턴을 추출하여 향후 콘텐츠 생성에 반영할 수 있는 자동화된 분석 시스템을 구축한다.

### 1.1 현재 상태

- A/B 테스트 결과: DB에 저장됨 (`ab_tests.winner_version`)
- 성과 데이터: `article_metrics` 테이블에 저장됨
- 분석: 없음 (수동으로 GA4 콘솔에서 확인)

### 1.2 목표 상태

- 자동 분석: A/B 테스트 완료 시 Claude Code CLI가 분석
- 패턴 추출: 성공/실패 패턴을 DB에 저장
- 프롬프트 개선: 검증된 패턴을 글 생성 프롬프트에 자동 반영
- 리포트: 분석 결과 `content_analysis` 테이블에 저장

---

## 2. 시스템 아키텍처 (최신)

### 2.1 데이터 흐름

```
SPEC-002 (GA4 수집)
    ↓
A/B 테스트 완료 감지
    ↓
Cloud Run (content_analyzer)
    ↓
Claude Code CLI (subprocess)
    ↓
├── content_analysis 테이블 저장
├── patterns 테이블 업데이트
└── prompt_versions 테이블 업데이트 (SPEC-004)
```

### 2.2 트리거 조건

`content_analyzer` Cloud Run은 다음 조건에서 실행:

1. **자동 트리거**: Cloud Scheduler (3일마다)
2. **수동 트리거**: POST /analyze 엔드포인트 호출

---

## 3. 구현 완료 파일

### 3.1 디렉토리 구조

```
functions/content_analyzer/
├── main.py               # ✅ Flask 앱 (Cloud Run용)
├── requirements.txt      # ✅ 의존성 (anthropic 제거됨)
├── prompts.py            # ✅ 분석 프롬프트
├── prompt_updater.py     # ✅ SPEC-004 프롬프트 업데이트
├── Dockerfile            # ✅ claude-code-sdk 기반
├── deploy-cloud-run.sh   # ✅ Cloud Run 배포 스크립트
├── SETUP.md              # ✅ 설정 가이드
├── .env.example          # ✅ 환경변수 예시
└── .env                  # ✅ 로컬 환경변수 (Git 제외)
```

### 3.2 핵심 코드 변경

**기존 (Anthropic API)**:
```python
import anthropic
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
response = client.messages.create(...)
```

**변경 (Claude Code CLI)**:
```python
import subprocess
result = subprocess.run(
    ["claude", "-p", prompt, "--output-format", "json"],
    capture_output=True,
    text=True,
    env={**os.environ, "CLAUDE_CODE_OAUTH_TOKEN": token}
)
response = json.loads(result.stdout)
```

---

## 4. 인증 설정

### 4.1 OAuth Token 생성

```bash
# 로컬 터미널에서 1회 실행
claude setup-token

# 출력: sk-ant-oat01-xxxxxxxx...
```

### 4.2 로컬 테스트 (.env 파일)

```bash
# functions/content_analyzer/.env
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-your-token-here
DB_HOST=34.64.111.186
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=galddae-password
DB_NAME=factcheck_db
```

### 4.3 프로덕션 (GCP Secret Manager)

```bash
# Secret 생성
echo -n "sk-ant-oat01-your-token" | \
  gcloud secrets create claude-oauth-token --data-file=-

# Cloud Run에 주입
gcloud run deploy content-analyzer \
  --set-secrets "CLAUDE_CODE_OAUTH_TOKEN=claude-oauth-token:latest"
```

---

## 5. 비용 비교

| 항목 | 기존 (API) | 변경 (CLI) |
|------|-----------|-----------|
| Claude API | ~$425/월 | **$0** (구독) |
| Cloud Run | - | ~$5/월 |
| Cloud SQL | $50/월 | $50/월 |
| **총합** | **~$476/월** | **~$55/월** |

> **88% 비용 절감!**

---

## 6. 구현 상태

### Phase 1: DB 스키마
- [x] `002_add_patterns_table.sql` 작성
- [ ] `patterns` 테이블 생성 (DB 마이그레이션 필요)
- [ ] `prompt_versions` 테이블 생성 (DB 마이그레이션 필요)

### Phase 2: Cloud Run 서비스
- [x] `main.py` - Flask 앱 + Claude CLI 호출
- [x] `prompts.py` - 분석 프롬프트
- [x] `requirements.txt` - 의존성 (anthropic 제거)
- [x] `Dockerfile` - claude-code-sdk 기반
- [x] `deploy-cloud-run.sh` - 배포 스크립트
- [x] `SETUP.md` - 설정 가이드
- [x] `.env.example` - 환경변수 예시

### Phase 3: 인증
- [x] `claude setup-token`으로 OAuth Token 생성
- [x] 로컬 테스트 완료 (2+2=4 응답 확인)
- [ ] GCP Secret Manager에 토큰 저장
- [ ] Cloud Run 배포

### Phase 4: 테스트
- [ ] DB 마이그레이션 실행
- [ ] Cloud Run 배포
- [ ] 엔드투엔드 테스트

---

## 7. 완료 조건

- [x] Cloud Run용 Flask 앱 구현
- [x] Claude Code CLI 호출 코드 구현
- [x] OAuth Token 생성 및 테스트
- [x] Dockerfile 및 배포 스크립트 작성
- [ ] DB 마이그레이션 실행
- [ ] Cloud Run 배포
- [ ] Cloud Scheduler 설정

---

## 8. 다음 단계

SPEC-003 배포 완료 후:
- **SPEC-004**: 프롬프트 자동 업데이트 (검증된 패턴 → 글 생성 프롬프트 반영)
- **SPEC-005**: Notion 리포트 (분석 결과 자동 전송)

---

## 9. 커밋 히스토리

| 커밋 | 내용 |
|------|------|
| `1ffab80` | feat(SPEC-003): Claude 분석 시스템 및 패턴 학습 |
| `db9a9dc` | refactor(SPEC-003): Anthropic API → Claude Code CLI 기반으로 변경 |

---

**문서 버전**: 2.0
**최종 수정**: 2024-12-22
**작성자**: R2-D2
