import { GLMClient } from './glm';

// Helper functions for accessing GLM client methods
export async function generateGLMArticle(
  topic: string,
  articleType: 'standard' | 'comparison' | 'howto' | 'list' | 'faq' = 'standard',
  options: {
    primaryKeyword?: string;
    secondaryKeywords?: string[];
    targetAudience?: string;
    category?: string;
  } = {}
): Promise<string> {
  try {
    const client = new GLMClient();
    return await client.generateArticle(topic, articleType, options);
  } catch (error) {
    console.error('Error generating GLM article:', error);
    throw error;
  }
}

export async function generateGLMContent(
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
): Promise<string> {
  try {
    const client = new GLMClient();
    return await client.generateContent(prompt, options);
  } catch (error) {
    console.error('Error generating GLM content:', error);
    throw error;
  }
}

export async function streamGLMChat(
  messages: any[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AsyncGenerator<any>> {
  try {
    const client = new GLMClient();
    return await client.chatStream({
      model: process.env.GLM_MODEL || 'glm-4.6',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      stream: true,
    });
  } catch (error) {
    console.error('Error streaming GLM chat:', error);
    throw error;
  }
}

// Utility functions for prompt building
export function buildArticleSystemPrompt(
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

export function buildArticleUserPrompt(
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
