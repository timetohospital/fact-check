#!/bin/bash
# Cloud Scheduler + Cloud Function 배포 스크립트

PROJECT_ID="gen-lang-client-0511029567"
REGION="asia-northeast3"
FUNCTION_NAME="factcheck-optimization-cycle"
SCHEDULER_NAME="factcheck-optimization-scheduler"

echo "🚀 Cloud Function 배포 중..."

# 1. Cloud Function 배포
gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --runtime=python311 \
  --region=$REGION \
  --source=./cloud_function \
  --entry-point=run_optimization_cycle \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=540s \
  --memory=512MB \
  --set-env-vars="OPENAI_API_KEY=$OPENAI_API_KEY"

echo "✅ Cloud Function 배포 완료"

# 2. Cloud Scheduler 작업 생성 (3일마다)
echo "📅 Cloud Scheduler 작업 생성 중..."

# 기존 작업 삭제 (있으면)
gcloud scheduler jobs delete $SCHEDULER_NAME \
  --location=$REGION \
  --quiet 2>/dev/null || true

# 새 작업 생성
# 매 3일마다 오전 6시 (KST)
gcloud scheduler jobs create http $SCHEDULER_NAME \
  --location=$REGION \
  --schedule="0 6 */3 * *" \
  --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME" \
  --http-method=POST \
  --time-zone="Asia/Seoul" \
  --description="팩트체크 콘텐츠 최적화 사이클 (3일마다)"

echo "✅ Cloud Scheduler 작업 생성 완료"

echo ""
echo "📋 배포 완료!"
echo "   Function: https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME"
echo "   Schedule: 매 3일마다 오전 6시 (KST)"
