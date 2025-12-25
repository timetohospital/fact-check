// AI가 생성할 콘텐츠의 타입 정의

// 메인 카테고리 타입 (3개)
export type MainCategory = 'factcheck' | 'health-info' | 'etc';

// 카테고리 메타 정보
export interface CategoryMeta {
  slug: MainCategory;
  name: string;
  description: string;
}

// 카테고리 상수 맵
export const CATEGORIES: Record<MainCategory, CategoryMeta> = {
  'factcheck': {
    slug: 'factcheck',
    name: '팩트체크',
    description: '건강 관련 주장을 의학적 근거로 검증합니다'
  },
  'health-info': {
    slug: 'health-info',
    name: '건강정보',
    description: '최신 의학 연구 기반 건강 정보를 제공합니다'
  },
  'etc': {
    slug: 'etc',
    name: '기타',
    description: '다양한 건강 관련 콘텐츠'
  }
};

// 주요 태그 상수 (참고용)
export const MAIN_TAGS = {
  'diet': '식단',
  'mental-health': '정신건강',
  'disease': '질병',
  'exercise': '운동',
  'cancer': '암환자',
} as const;

export interface ArticleFrontmatter {
  title: string;
  description: string;
  author: string;
  authorImage?: string;
  publishedAt: string;
  updatedAt?: string;
  category: MainCategory;  // string → MainCategory로 변경
  tags: string[];
  image?: string;
  imageAlt?: string;
  // SEO 메타
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  // AI 최적화용 구조화 데이터
  medicalReviewer?: string;
  reviewedAt?: string;
  sources?: string[];
}

export interface Article {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
  readingTime: number;
}
