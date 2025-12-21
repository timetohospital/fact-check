#!/bin/bash
# GA4 Collector Cloud Function 배포 스크립트

set -e

PROJECT_ID="galddae-health"
REGION="asia-northeast3"
FUNCTION_NAME="ga4-metrics-collector"

echo "=== GA4 Collector 배포 시작 ==="

# 1. Cloud Function 배포
echo "1. Cloud Function 배포 중..."
gcloud functions deploy $FUNCTION_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --runtime=python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=collect_ga4_metrics \
  --memory=256MB \
  --timeout=300s \
  --set-env-vars="GA4_PROPERTY_ID=517111075,DB_HOST=34.64.111.186,DB_PORT=5432,DB_USER=admin,DB_PASSWORD=galddae-password,DB_NAME=factcheck_db"

echo "Cloud Function 배포 완료!"

# 2. Cloud Scheduler 설정
echo ""
echo "2. Cloud Scheduler 설정 중..."

# 기존 스케줄러 삭제 (있으면)
gcloud scheduler jobs delete ga4-collector-schedule \
  --project=$PROJECT_ID \
  --location=$REGION \
  --quiet 2>/dev/null || true

# 새 스케줄러 생성 (3일마다 오전 2시)
gcloud scheduler jobs create http ga4-collector-schedule \
  --project=$PROJECT_ID \
  --location=$REGION \
  --schedule="0 2 */3 * *" \
  --time-zone="Asia/Seoul" \
  --uri="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}" \
  --http-method=POST \
  --attempt-deadline=600s

echo "Cloud Scheduler 설정 완료!"

# 3. 테스트 실행
echo ""
echo "3. 테스트 실행..."
curl -X POST "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"

echo ""
echo "=== 배포 완료 ==="
echo "Function URL: https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"
echo "Schedule: 3일마다 오전 2시 (Asia/Seoul)"
