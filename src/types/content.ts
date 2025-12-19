// AI가 생성할 콘텐츠의 타입 정의

export interface ArticleFrontmatter {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
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
