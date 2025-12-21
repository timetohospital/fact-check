import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticlesByTagWithFallback, getAllTagsWithCount } from "@/lib/content-db";
import { Article } from "@/types/content";

// 정적 빌드를 위한 태그 목록 생성
export async function generateStaticParams() {
  const tagsWithCount = await getAllTagsWithCount();
  const tags = Object.keys(tagsWithCount);
  return tags.map((tag) => ({
    tag: encodeURIComponent(tag),
  }));
}

// ArticleCard 컴포넌트
function ArticleCard({ article }: { article: Article }) {
  return (
    <article
      style={{
        backgroundColor: "var(--background)",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        transition: "box-shadow 0.2s",
      }}
    >
      <Link href={`/articles/${article.slug}`}>
        {/* Image */}
        <div
          style={{
            aspectRatio: "3/2",
            backgroundColor: "var(--secondary)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {article.frontmatter.image ? (
            <img
              src={article.frontmatter.image}
              alt={article.frontmatter.imageAlt || article.frontmatter.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: "0.875rem",
              }}
            >
              365 Health
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "1rem" }}>
          {/* Category */}
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {article.frontmatter.category}
          </span>

          {/* Title */}
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              marginTop: "0.5rem",
              lineHeight: 1.4,
              color: "var(--foreground)",
            }}
          >
            {article.frontmatter.title}
          </h3>

          {/* Description */}
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--muted)",
              marginTop: "0.5rem",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.frontmatter.description}
          </p>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginTop: "1rem",
              fontSize: "0.75rem",
              color: "var(--muted)",
            }}
          >
            <span>{article.frontmatter.publishedAt}</span>
            <span>·</span>
            <span>{article.readingTime} min read</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const articles = await getArticlesByTagWithFallback(decodedTag);

  if (articles.length === 0) {
    notFound();
  }

  return (
    <div className="container" style={{ padding: "2rem 1rem" }}>
      {/* Breadcrumb */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
          color: "var(--muted)",
          marginBottom: "1.5rem",
        }}
      >
        <Link href="/" style={{ color: "var(--primary)" }}>
          Home
        </Link>
        <span>/</span>
        <span>태그</span>
        <span>/</span>
        <span style={{ color: "var(--foreground)" }}>#{decodedTag}</span>
      </nav>

      {/* Header */}
      <header style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--foreground)",
          }}
        >
          #{decodedTag}
        </h1>
        <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
          {articles.length}개의 기사
        </p>
      </header>

      {/* Articles Grid */}
      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
