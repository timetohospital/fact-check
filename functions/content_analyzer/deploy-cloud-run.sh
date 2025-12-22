#!/bin/bash
# Content Analyzer - Cloud Run 배포 스크립트
#
# 사전 준비:
# 1. OAuth Token 생성: claude setup-token
# 2. Secret 생성: gcloud secrets create claude-oauth-token --data-file=-
# 3. 이 스크립트 실행

set -e

# 설정
PROJECT_ID="galddae-health"
REGION="asia-northeast3"
SERVICE_NAME="content-analyzer"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=== Content Analyzer Cloud Run 배포 ==="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# 1. Docker 이미지 빌드
echo "[1/4] Docker 이미지 빌드..."
docker build -t ${IMAGE_NAME} .

# 2. GCR에 푸시
echo "[2/4] GCR에 푸시..."
docker push ${IMAGE_NAME}

# 3. Cloud Run 배포
echo "[3/4] Cloud Run 배포..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 1Gi \
    --timeout 300 \
    --set-env-vars "DB_HOST=34.64.111.186,DB_PORT=5432,DB_USER=admin,DB_NAME=factcheck_db" \
    --set-secrets "DB_PASSWORD=db-password:latest,CLAUDE_CODE_OAUTH_TOKEN=claude-oauth-token:latest"

# 4. 서비스 URL 확인
echo "[4/4] 배포 완료!"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
echo ""
echo "서비스 URL: ${SERVICE_URL}"
echo "헬스체크: ${SERVICE_URL}/health"
echo "분석 실행: ${SERVICE_URL}/analyze"
echo ""
echo "=== Cloud Scheduler 설정 (선택) ==="
echo "gcloud scheduler jobs create http content-analyzer-job \\"
echo "    --location=${REGION} \\"
echo "    --schedule=\"0 3 */3 * *\" \\"
echo "    --uri=\"${SERVICE_URL}/analyze\" \\"
echo "    --http-method=POST"
