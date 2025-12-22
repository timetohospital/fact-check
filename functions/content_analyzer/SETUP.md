# Content Analyzer - Cloud Run 설정 가이드

## 개요

이 서비스는 **Claude Code 구독**을 활용하여 A/B 테스트 분석을 자동화합니다.

- **비용**: Claude API $0 (구독으로 사용)
- **인프라**: Cloud Run (~$5/월)
- **실행 주기**: 3일마다 (Cloud Scheduler)

---

## 1. OAuth Token 생성

### 로컬 터미널에서 실행

```bash
# Claude Code가 설치되어 있어야 합니다
claude setup-token
```

### 출력 예시

```
Your OAuth token: sk-ant-oat01-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...
```

⚠️ **중요**: 이 토큰을 안전하게 보관하세요. 비밀번호처럼 취급해야 합니다.

---

## 2. GCP Secret 생성

```bash
# Secret Manager에 토큰 저장
echo -n "sk-ant-oat01-your-token-here" | \
  gcloud secrets create claude-oauth-token --data-file=-

# DB 비밀번호도 저장 (아직 없다면)
echo -n "galddae-password" | \
  gcloud secrets create db-password --data-file=-
```

### Secret 확인

```bash
gcloud secrets list
```

---

## 3. Cloud Run 배포

### 방법 1: 스크립트 사용

```bash
cd functions/content_analyzer
chmod +x deploy-cloud-run.sh
./deploy-cloud-run.sh
```

### 방법 2: 수동 배포

```bash
# Docker 빌드
docker build -t gcr.io/galddae-health/content-analyzer .

# GCR 푸시
docker push gcr.io/galddae-health/content-analyzer

# Cloud Run 배포
gcloud run deploy content-analyzer \
    --image gcr.io/galddae-health/content-analyzer \
    --platform managed \
    --region asia-northeast3 \
    --allow-unauthenticated \
    --memory 1Gi \
    --timeout 300 \
    --set-env-vars "DB_HOST=34.64.111.186,DB_PORT=5432,DB_USER=admin,DB_NAME=factcheck_db" \
    --set-secrets "DB_PASSWORD=db-password:latest,CLAUDE_CODE_OAUTH_TOKEN=claude-oauth-token:latest"
```

---

## 4. Cloud Scheduler 설정

3일마다 자동 실행:

```bash
gcloud scheduler jobs create http content-analyzer-job \
    --location=asia-northeast3 \
    --schedule="0 3 */3 * *" \
    --uri="https://content-analyzer-xxx.run.app/analyze" \
    --http-method=POST \
    --time-zone="Asia/Seoul"
```

---

## 5. 테스트

### 헬스체크

```bash
curl https://content-analyzer-xxx.run.app/health
```

### 수동 분석 실행

```bash
curl -X POST https://content-analyzer-xxx.run.app/analyze
```

---

## 문제 해결

### OAuth Token 만료

토큰이 만료되면 다시 생성:

```bash
# 새 토큰 생성
claude setup-token

# Secret 업데이트
echo -n "sk-ant-oat01-new-token" | \
  gcloud secrets versions add claude-oauth-token --data-file=-
```

### 로그 확인

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=content-analyzer" --limit=50
```

---

## 아키텍처

```
Cloud Scheduler (3일마다 03:00)
         ↓
Cloud Run (content-analyzer)
  ├── Docker: ghcr.io/cabinlab/claude-code-sdk:python
  ├── ENV: CLAUDE_CODE_OAUTH_TOKEN (Secret Manager)
  └── Claude CLI → 구독 인증
         ↓
Cloud SQL (factcheck_db)
  ├── patterns 테이블 업데이트
  └── content_analysis 테이블 저장
```

---

## 비용 예상

| 항목 | 월 비용 |
|------|---------|
| Claude API | $0 (구독) |
| Cloud Run | ~$1-5 |
| Cloud SQL | $50 |
| **총합** | **~$55** |

기존 설계 ($476) 대비 **88% 절감**
