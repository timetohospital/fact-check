import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { Article, ArticleFrontmatter, MainCategory, CATEGORIES } from "@/types/content";

const CONTENT_DIR = path.join(process.cwd(), "src/content/articles");

export function getAllArticles(): Article[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const slug = filename.replace(".mdx", "");
      return getArticleBySlug(slug);
    })
    .filter((article): article is Article => article !== null)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.publishedAt).getTime() -
        new Date(a.frontmatter.publishedAt).getTime()
    );
}

export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    frontmatter: data as ArticleFrontmatter,
    content,
    readingTime: Math.ceil(readingTime(content).minutes),
  };
}

export function getArticlesByCategory(category: string): Article[] {
  return getAllArticles().filter(
    (article) => article.frontmatter.category === category
  );
}

// 태그별 기사 필터링
export function getArticlesByTag(tag: string): Article[] {
  return getAllArticles().filter(
    (article) => article.frontmatter.tags.includes(tag)
  );
}

// 카테고리 display name 가져오기
export function getCategoryDisplayName(slug: string): string {
  const category = CATEGORIES[slug as MainCategory];
  return category?.name || slug;
}

// 카테고리 설명 가져오기
export function getCategoryDescription(slug: string): string {
  const category = CATEGORIES[slug as MainCategory];
  return category?.description || '';
}

export function getAllCategories(): string[] {
  const articles = getAllArticles();
  const categories = new Set(articles.map((a) => a.frontmatter.category));
  return Array.from(categories);
}

export function getAllTags(): string[] {
  const articles = getAllArticles();
  const tags = new Set(articles.flatMap((a) => a.frontmatter.tags));
  return Array.from(tags).sort();
}

// 태그별 기사 수 카운트
export function getTagCounts(): Record<string, number> {
  const articles = getAllArticles();
  const counts: Record<string, number> = {};
  
  articles.forEach(article => {
    article.frontmatter.tags.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  
  return counts;
}
