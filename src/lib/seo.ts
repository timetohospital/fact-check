import { Metadata } from "next";
import { ArticleFrontmatter } from "@/types/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Health Content";

// 기본 메타데이터 생성
export function generateMetadata(
  title: string,
  description: string,
  path: string = "",
  image?: string
): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// 기사용 메타데이터 생성
export function generateArticleMetadata(
  frontmatter: ArticleFrontmatter,
  slug: string
): Metadata {
  const title = frontmatter.metaTitle || frontmatter.title;
  const description = frontmatter.metaDescription || frontmatter.description;
  const url = `${SITE_URL}/articles/${slug}`;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: frontmatter.canonicalUrl || url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt,
      authors: [frontmatter.author],
      tags: frontmatter.tags,
      images: frontmatter.image
        ? [
            {
              url: frontmatter.image,
              width: 1200,
              height: 630,
              alt: frontmatter.imageAlt || frontmatter.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: frontmatter.image ? [frontmatter.image] : [],
    },
  };
}
