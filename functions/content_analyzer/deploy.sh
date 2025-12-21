#!/bin/bash
# Content Analyzer Cloud Function 배포 스크립트

set -e

PROJECT_ID="galddae-health"
REGION="asia-northeast3"
FUNCTION_NAME="content-analyzer"

echo "=== Content Analyzer 배포 시작 ==="

# 환경 변수 확인
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "경고: ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다."
    echo "배포 후 GCP Console에서 환경 변수를 설정하세요."
fi

# 1. Cloud Function 배포
echo "1. Cloud Function 배포 중..."
gcloud functions deploy $FUNCTION_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --runtime=python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=analyze_completed_tests \
  --memory=512MB \
  --timeout=300s \
  --set-env-vars="DB_HOST=34.64.111.186,DB_PORT=5432,DB_USER=admin,DB_PASSWORD=galddae-password,DB_NAME=factcheck_db,CLAUDE_MODEL=claude-sonnet-4-20250514"

echo ""
echo "=== 배포 완료 ==="
echo "Function URL: https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"
echo ""
echo "중요: GCP Console에서 ANTHROPIC_API_KEY 환경 변수를 설정하세요!"
echo "https://console.cloud.google.com/functions/details/${REGION}/${FUNCTION_NAME}?project=${PROJECT_ID}"
