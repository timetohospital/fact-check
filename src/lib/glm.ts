import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// GLM-4.6 API 관련 타입 정의
export interface GLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GLMChatRequest {
  model: string;
  messages: GLMMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface GLMChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: GLMMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GLMStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
}

export class GLMClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GLM_API_KEY || '';
    this.baseUrl = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
    this.model = process.env.GLM_MODEL || 'glm-4.6';

    if (!this.apiKey) {
      throw new Error('GLM_API_KEY environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: 60000, // 60초 타임아웃
    });

    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        console.log(`GLM API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('GLM API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        console.log('GLM API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('GLM API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 채팅 API 호출 (일반)
   */
  async chat(request: GLMChatRequest): Promise<GLMChatResponse> {
    try {
      const response = await this.client.post<GLMChatResponse>('/chat/completions', {
        ...request,
        model: request.model || this.model,
        stream: false,
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 스트리밍 채팅 API 호출
   */
  async *chatStream(request: GLMChatRequest): AsyncGenerator<GLMStreamResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        ...request,
        model: request.model || this.model,
        stream: true,
      }, {
        responseType: 'stream',
        adapter: 'http',
      });

      const stream = response.data;
      const decoder = new TextDecoder();
      let buffer = '';

      for await (const chunk of stream) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * VitalFlow 콘텐츠 생성에 최적화된 메소드
   */
  async generateContent(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<string> {
    const messages: GLMMessage[] = [];

    // 시스템 프롬프트가 있는 경우 추가
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await this.chat({
      model: this.model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * VitalFlow 아티클 생성용 전용 메소드
   */
  async generateArticle(
    topic: string,
    articleType: 'standard' | 'comparison' | 'howto' | 'list' | 'faq' = 'standard',
    options: {
      primaryKeyword?: string;
      secondaryKeywords?: string[];
      targetAudience?: string;
      category?: string;
    } = {}
  ): Promise<string> {
    const systemPrompt = this.buildArticleSystemPrompt(articleType, options);
    const userPrompt = this.buildArticleUserPrompt(topic, articleType, options);

    return this.generateContent(userPrompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 8000,
    });
  }

  /**
   * 아티클 타입에 따른 시스템 프롬프트 생성
   */
  private buildArticleSystemPrompt(
    articleType: string,
    options: {
      primaryKeyword?: string;
      secondaryKeywords?: string[];
      targetAudience?: string;
      category?: string;
    }
  ): string {
    const basePrompt = `당신은 VitalFlow의 수석 건강 콘텐츠 작성자입니다. 의학적 정확성과 SEO 최적화를 모두 갖춘 콘텐츠를 작성합니다.

## 글쓰기 원칙
1. **첫 문장 = 답변**: 각 섹션의 첫 문장이 질문에 대한 직접 답변이어야 함
2. **구체적 수치**: "많은" → "67%", "좋다" → "혈압 10mmHg 감소"
3. **능동태 사용**: "복용되어야 한다" → "복용하세요"
4. **2인칭 사용**: "사람들은" → "당신은"
5. **전문용어 설명**: "EGCG(에피갈로카테킨 갈레이트, 녹차의 주요 항산화제)"
6. **출처 명시**: 모든 통계/연구에 출처 괄호 표기

## 금지 사항
- "기적의", "완치", "100%" 등 과장 표현
- 구체적 의료 조언 (진단, 처방)
- 출처 없는 통계
- 키워드 부자연스러운 반복`;

    switch (articleType) {
      case 'standard':
        return basePrompt + `

## 표준 건강 아티클 형식
YAML Frontmatter와 함께 구조화된 건강 아티클 작성
- 도입부, 정의, 베네핏, 사용법, 부작용, 비교, FAQ, 결론 포함
- 최소 2000단어 이상`;

      case 'comparison':
        return basePrompt + `

## 비교 아티클 형식
- A vs B 형식의 객관적 비교
- 표 형식 활용
- 양쪽 장단점 공정하게 제시`;

      case 'howto':
        return basePrompt + `

## How-To 가이드 형식
- 단계별 실행 가이드
- 체크리스트 포함
- 초보자 vs 경험자 팁 제공`;

      case 'list':
        return basePrompt + `

## 리스트 아티클 형식
- "Best for" 태그 포함
- 순위 기준 명확히 설명
- 최소 3개 이상 연구/출처 인용`;

      case 'faq':
        return basePrompt + `

## FAQ 확장 형식
- "People Also Ask" 스타일
- 안전성, 방법, 비교, 시간/양 질문 포함
- 각 FAQ를 별도 H3 섹션으로 작성`;

      default:
        return basePrompt;
    }
  }

  /**
   * 아티클 타입과 주제에 따른 사용자 프롬프트 생성
   */
  private buildArticleUserPrompt(
    topic: string,
    articleType: string,
    options: {
      primaryKeyword?: string;
      secondaryKeywords?: string[];
      targetAudience?: string;
      category?: string;
    }
  ): string {
    let prompt = `다음 주제에 대한 ${articleType} 아티클을 작성해주세요.

## 작성할 아티클 정보
- **주제:** ${topic}`;

    if (options.primaryKeyword) {
      prompt += `\n- **주요 키워드:** ${options.primaryKeyword}`;
    }

    if (options.secondaryKeywords && options.secondaryKeywords.length > 0) {
      prompt += `\n- **보조 키워드:** ${options.secondaryKeywords.join(', ')}`;
    }

    if (options.targetAudience) {
      prompt += `\n- **타겟 독자:** ${options.targetAudience}`;
    }

    if (options.category) {
      prompt += `\n- **카테고리:** ${options.category}`;
    }

    prompt += `

## 요구사항
1. docs/AI_CONTENT_PROMPTS.md의 ${articleType} 프롬프트 형식 따르기
2. YAML Frontmatter 포함
3. MDX 형식으로 작성
4. 의학적 정확성 유지
5. SEO 최적화 적용

지금 ${topic}에 대한 아티클을 작성해주세요.`;

    return prompt;
  }

  /**
   * 에러 처리
   */
  private handleError(error: any): Error {
    if (error.response) {
      // API 응답 에러
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return new Error(`Bad Request: ${data.error?.message || 'Invalid request parameters'}`);
        case 401:
          return new Error(`Unauthorized: Invalid API key or insufficient permissions`);
        case 429:
          return new Error(`Rate Limit Exceeded: Too many requests. Please try again later.`);
        case 500:
          return new Error(`Internal Server Error: GLM API server error`);
        default:
          return new Error(`API Error (${status}): ${data.error?.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      // 네트워크 에러
      return new Error(`Network Error: Unable to connect to GLM API`);
    } else {
      // 기타 에러
      return new Error(`Error: ${error.message}`);
    }
  }

  /**
   * API 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/models');
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
export const glmClient = new GLMClient();
