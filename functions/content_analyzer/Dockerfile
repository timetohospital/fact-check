# Content Analyzer - Cloud Run Service
# Claude Code CLI 기반 A/B 테스트 분석
#
# 베이스 이미지: cabinlab/claude-code-sdk (Claude CLI + Python SDK 포함)
# 인증: CLAUDE_CODE_OAUTH_TOKEN 환경변수

FROM ghcr.io/cabinlab/claude-code-sdk:python

# 작업 디렉토리 설정
WORKDIR /app

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY main.py .
COPY prompts.py .
COPY prompt_updater.py .

# Cloud Run은 PORT 환경변수 사용
ENV PORT=8080

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# gunicorn으로 프로덕션 실행
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "2", "--timeout", "300", "main:app"]
