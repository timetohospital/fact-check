import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { Article, ArticleFrontmatter } from "@/types/content";

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

export function getAllCategories(): string[] {
  const articles = getAllArticles();
  const categories = new Set(articles.map((a) => a.frontmatter.category));
  return Array.from(categories);
}

export function getAllTags(): string[] {
  const articles = getAllArticles();
  const tags = new Set(articles.flatMap((a) => a.frontmatter.tags));
  return Array.from(tags);
}
