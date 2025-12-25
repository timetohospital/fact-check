/**
 * DB 기반 콘텐츠 라이브러리 (A/B 테스트 지원)
 *
 * 기존 content.ts (MDX 기반)를 대체
 */

import { query, queryOne } from './db';
import { cookies } from 'next/headers';
import { Article, ArticleFrontmatter, MainCategory } from '@/types/content';

// ============================================
// 타입 정의
// ============================================

export interface ArticleSection {
  type: 'intro' | 'main' | 'faq' | 'conclusion' | 'summary';
  heading: string | null;
  content?: string;
  items?: Array<{ q: string; a: string } | string>;
}

export interface ArticleDB {
  id: string;
  slug: string;
  version: string;
  is_active: boolean;
  title: string;
  description: string | null;
  author: string;
  category: string;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  sections: ArticleSection[];
  sources: string[];
  medical_reviewer: string | null;
  reviewed_at: Date | null;
  image_url: string | null;
  image_alt: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface ABTest {
  id: string;
  article_slug: string;
  name: string;
  hypothesis: string;
  target_section: string;
  control_version: string;
  variant_version: string;
  traffic_split: number;
  status: string;
  started_at: Date;
}

// ============================================
// A/B 테스트 로직
// ============================================

/**
 * 사용자의 A/B 버킷 결정
 * - 쿠키로 일관성 유지 (같은 사용자는 항상 같은 버전)
 */
export async function getABBucket(slug: string): Promise<string> {
  const cookieStore = await cookies();
  const bucketKey = `ab_${slug}`;
  const existingBucket = cookieStore.get(bucketKey)?.value;

  if (existingBucket) {
    return existingBucket;
  }

  // 새 버킷 할당 (50:50)
  const bucket = Math.random() < 0.5 ? 'A' : 'B';

  // 쿠키 설정은 Server Action에서 해야 함
  // 여기서는 버킷만 반환
  return bucket;
}

/**
 * 진행 중인 A/B 테스트 확인
 */
export async function getRunningABTest(slug: string): Promise<ABTest | null> {
  return queryOne<ABTest>(
    `SELECT * FROM ab_tests
     WHERE article_slug = $1 AND status = 'running'
     LIMIT 1`,
    [slug]
  );
}

// ============================================
// 글 조회 함수
// ============================================

/**
 * 슬러그로 글 조회 (A/B 테스트 적용)
 */
export async function getArticleBySlug(
  slug: string,
  forcedVersion?: string
): Promise<ArticleDB | null> {
  let version = forcedVersion || 'A';

  // A/B 테스트 확인
  if (!forcedVersion) {
    const abTest = await getRunningABTest(slug);
    if (abTest) {
      version = await getABBucket(slug);

      // B 버전이 없으면 A로 폴백
      const hasB = await queryOne<{ id: string }>(
        `SELECT id FROM articles WHERE slug = $1 AND version = 'B' AND is_active = true`,
        [slug]
      );
      if (!hasB && version === 'B') {
        version = 'A';
      }
    }
  }

  return queryOne<ArticleDB>(
    `SELECT * FROM articles
     WHERE slug = $1 AND version = $2 AND is_active = true`,
    [slug, version]
  );
}

/**
 * 모든 글 조회 (A 버전만, 목록용)
 */
export async function getAllArticles(): Promise<ArticleDB[]> {
  return query<ArticleDB>(
    `SELECT * FROM articles
     WHERE version = 'A' AND status = 'published' AND is_active = true
     ORDER BY published_at DESC NULLS LAST, created_at DESC`
  );
}

/**
 * 카테고리별 글 조회
 */
export async function getArticlesByCategory(category: string): Promise<ArticleDB[]> {
  return query<ArticleDB>(
    `SELECT * FROM articles
     WHERE category = $1 AND version = 'A' AND status = 'published' AND is_active = true
     ORDER BY published_at DESC NULLS LAST`,
    [category]
  );
}

/**
 * 태그별 글 조회
 */
export async function getArticlesByTag(tag: string): Promise<ArticleDB[]> {
  return query<ArticleDB>(
    `SELECT * FROM articles
     WHERE $1 = ANY(tags) AND version = 'A' AND status = 'published' AND is_active = true
     ORDER BY published_at DESC NULLS LAST`,
    [tag]
  );
}

/**
 * 모든 카테고리 조회
 */
export async function getAllCategories(): Promise<string[]> {
  const rows = await query<{ category: string }>(
    `SELECT DISTINCT category FROM articles
     WHERE version = 'A' AND status = 'published'
     ORDER BY category`
  );
  return rows.map(r => r.category);
}

/**
 * 모든 태그 조회 (카운트 포함)
 */
export async function getAllTagsWithCount(): Promise<Record<string, number>> {
  const rows = await query<{ tag: string; count: string }>(
    `SELECT unnest(tags) as tag, COUNT(*) as count
     FROM articles
     WHERE version = 'A' AND status = 'published'
     GROUP BY tag
     ORDER BY count DESC`
  );

  const counts: Record<string, number> = {};
  rows.forEach(r => {
    counts[r.tag] = parseInt(r.count);
  });
  return counts;
}

/**
 * 모든 슬러그 조회 (정적 생성용)
 */
export async function getAllSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(
    `SELECT DISTINCT slug FROM articles
     WHERE status = 'published' AND is_active = true
     ORDER BY slug`
  );
  return rows.map(r => r.slug);
}

// ============================================
// 섹션 → 마크다운 변환 (렌더링용)
// ============================================

/**
 * JSONB 섹션을 마크다운으로 변환
 */
export function sectionsToMarkdown(sections: ArticleSection[]): string {
  return sections
    .map(section => {
      let md = '';

      if (section.heading) {
        md += `## ${section.heading}\n\n`;
      }

      if (section.content) {
        md += `${section.content}\n\n`;
      }

      if (section.type === 'faq' && section.items) {
        const faqItems = section.items as Array<{ q: string; a: string }>;
        faqItems.forEach(item => {
          md += `### ${item.q}\n\n${item.a}\n\n`;
        });
      }

      if (section.type === 'summary' && section.items) {
        const bullets = section.items as string[];
        bullets.forEach(item => {
          md += `- ${item}\n`;
        });
        md += '\n';
      }

      return md;
    })
    .join('');
}

// ============================================
// A/B 버전 비교 (내부용)
// ============================================

/**
 * A/B 버전 비교
 */
export async function compareABVersions(slug: string): Promise<{
  a: ArticleDB | null;
  b: ArticleDB | null;
}> {
  const [a, b] = await Promise.all([
    queryOne<ArticleDB>(
      `SELECT * FROM articles WHERE slug = $1 AND version = 'A'`,
      [slug]
    ),
    queryOne<ArticleDB>(
      `SELECT * FROM articles WHERE slug = $1 AND version = 'B'`,
      [slug]
    ),
  ]);

  return { a, b };
}

// ============================================
// DB -> Legacy 형식 변환 (기존 코드 호환용)
// ============================================

/**
 * ArticleDB를 ArticleFrontmatter로 변환
 */
export function articleToFrontmatter(article: ArticleDB): ArticleFrontmatter {
  return {
    title: article.title,
    description: article.description || '',
    author: article.author,
    category: article.category as MainCategory,
    tags: article.tags || [],
    publishedAt: article.published_at
      ? new Date(article.published_at).toISOString().split('T')[0]
      : new Date(article.created_at).toISOString().split('T')[0],
    image: article.image_url || undefined,
    imageAlt: article.image_alt || undefined,
    medicalReviewer: article.medical_reviewer || undefined,
    reviewedAt: article.reviewed_at
      ? new Date(article.reviewed_at).toISOString().split('T')[0]
      : undefined,
    sources: article.sources || [],
    metaTitle: article.meta_title || undefined,
    metaDescription: article.meta_description || undefined,
  };
}

/**
 * ArticleDB를 기존 Article 형식으로 변환
 */
export function articleToLegacy(article: ArticleDB): Article {
  const content = sectionsToMarkdown(article.sections || []);
  return {
    slug: article.slug,
    frontmatter: articleToFrontmatter(article),
    content,
    readingTime: Math.ceil(content.split(/\s+/).length / 200),
  };
}

/**
 * 모든 글을 Legacy 형식으로 조회
 */
export async function getAllArticlesLegacy(): Promise<Article[]> {
  const articles = await getAllArticles();
  return articles.map(articleToLegacy);
}

/**
 * 슬러그로 글 조회 (Legacy 형식)
 */
export async function getArticleBySlugLegacy(
  slug: string,
  forcedVersion?: string
): Promise<Article | null> {
  const article = await getArticleBySlug(slug, forcedVersion);
  if (!article) return null;
  return articleToLegacy(article);
}

/**
 * 카테고리별 글 조회 (Legacy 형식)
 */
export async function getArticlesByCategoryLegacy(category: string): Promise<Article[]> {
  const articles = await getArticlesByCategory(category);
  return articles.map(articleToLegacy);
}

/**
 * 태그별 글 조회 (Legacy 형식)
 */
export async function getArticlesByTagLegacy(tag: string): Promise<Article[]> {
  const articles = await getArticlesByTag(tag);
  return articles.map(articleToLegacy);
}

// ============================================
// 폴백 함수 (DB 실패시 MDX 사용)
// ============================================

/**
 * DB 우선, MDX 폴백으로 글 조회
 */
export async function getArticleWithFallback(slug: string): Promise<Article | null> {
  try {
    const dbArticle = await getArticleBySlug(slug);
    if (dbArticle) {
      return articleToLegacy(dbArticle);
    }
  } catch (error) {
    console.error('[content-db] DB 조회 실패, MDX로 폴백:', error);
  }

  // MDX 폴백
  try {
    const mdxContent = await import('@/lib/content');
    return mdxContent.getArticleBySlug(slug);
  } catch (error) {
    console.error('[content-db] MDX 폴백도 실패:', error);
    return null;
  }
}

/**
 * DB 우선, MDX 폴백으로 모든 글 조회
 */
export async function getAllArticlesWithFallback(): Promise<Article[]> {
  try {
    const dbArticles = await getAllArticles();
    if (dbArticles.length > 0) {
      return dbArticles.map(articleToLegacy);
    }
  } catch (error) {
    console.error('[content-db] DB 조회 실패, MDX로 폴백:', error);
  }

  // MDX 폴백
  try {
    const mdxContent = await import('@/lib/content');
    return mdxContent.getAllArticles();
  } catch (error) {
    console.error('[content-db] MDX 폴백도 실패:', error);
    return [];
  }
}

/**
 * DB와 MDX 슬러그를 합쳐서 조회 (중복 제거)
 */
export async function getAllSlugsWithFallback(): Promise<string[]> {
  const allSlugs = new Set<string>();

  // DB 슬러그 추가
  try {
    const dbSlugs = await getAllSlugs();
    dbSlugs.forEach(slug => allSlugs.add(slug));
  } catch (error) {
    console.error('[content-db] DB 조회 실패:', error);
  }

  // MDX 슬러그도 추가 (DB에 없는 글 포함)
  try {
    const mdxContent = await import('@/lib/content');
    const mdxArticles = mdxContent.getAllArticles();
    mdxArticles.forEach(a => allSlugs.add(a.slug));
  } catch (error) {
    console.error('[content-db] MDX 조회 실패:', error);
  }

  return Array.from(allSlugs).sort();
}

/**
 * DB 우선, MDX 폴백으로 카테고리별 글 조회
 */
export async function getArticlesByCategoryWithFallback(category: string): Promise<Article[]> {
  try {
    const dbArticles = await getArticlesByCategory(category);
    if (dbArticles.length > 0) {
      return dbArticles.map(articleToLegacy);
    }
  } catch (error) {
    console.error('[content-db] DB 조회 실패, MDX로 폴백:', error);
  }

  // MDX 폴백
  try {
    const mdxContent = await import('@/lib/content');
    return mdxContent.getArticlesByCategory(category);
  } catch (error) {
    console.error('[content-db] MDX 폴백도 실패:', error);
    return [];
  }
}

/**
 * DB 우선, MDX 폴백으로 태그별 글 조회
 */
export async function getArticlesByTagWithFallback(tag: string): Promise<Article[]> {
  try {
    const dbArticles = await getArticlesByTag(tag);
    if (dbArticles.length > 0) {
      return dbArticles.map(articleToLegacy);
    }
  } catch (error) {
    console.error('[content-db] DB 조회 실패, MDX로 폴백:', error);
  }

  // MDX 폴백
  try {
    const mdxContent = await import('@/lib/content');
    return mdxContent.getArticlesByTag(tag);
  } catch (error) {
    console.error('[content-db] MDX 폴백도 실패:', error);
    return [];
  }
}

/**
 * DB와 MDX 태그를 합쳐서 조회 (중복 제거, 카운트 포함)
 */
export async function getAllTagsWithCountWithFallback(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  // DB 태그 추가
  try {
    const dbCounts = await getAllTagsWithCount();
    Object.entries(dbCounts).forEach(([tag, count]) => {
      counts[tag] = (counts[tag] || 0) + count;
    });
  } catch (error) {
    console.error('[content-db] DB 태그 조회 실패:', error);
  }

  // MDX 태그도 추가 (DB에 없는 태그 포함)
  try {
    const mdxContent = await import('@/lib/content');
    const mdxCounts = mdxContent.getTagCounts();
    Object.entries(mdxCounts).forEach(([tag, count]) => {
      counts[tag] = (counts[tag] || 0) + count;
    });
  } catch (error) {
    console.error('[content-db] MDX 태그 조회 실패:', error);
  }

  return counts;
}
