# Content Analyzer - Cloud Run Service
# Claude Code CLI 기반 A/B 테스트 분석
#
# 베이스 이미지: Python 3.11 slim
# Claude CLI: npm으로 설치
# 인증: CLAUDE_CODE_OAUTH_TOKEN 환경변수

FROM python:3.11-slim

# 시스템 패키지 설치 (Node.js, curl)
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI 설치
RUN npm install -g @anthropic-ai/claude-code

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

# gunicorn으로 프로덕션 실행
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "2", "--timeout", "300", "main:app"]
