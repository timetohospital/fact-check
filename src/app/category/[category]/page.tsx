import Link from "next/link";
import { getArticlesByCategory, getAllCategories } from "@/lib/content";
import { Article } from "@/types/content";

// 정적 빌드를 위한 카테고리 목록 생성
export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({
    category: category.toLowerCase(),
  }));
}

// Simple Article Card for Category Page
function ArticleCard({ article }: { article: Article }) {
  return (
    <article
      style={{
        backgroundColor: "var(--background)",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <Link href={`/articles/${article.slug}`}>
        <div
          style={{
            aspectRatio: "3/2",
            backgroundColor: "var(--secondary)",
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
              VitalFlow
            </div>
          )}
        </div>

        <div style={{ padding: "1rem" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              lineHeight: 1.4,
              color: "var(--foreground)",
            }}
          >
            {article.frontmatter.title}
          </h3>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.75rem",
              fontSize: "0.75rem",
              color: "var(--muted)",
            }}
          >
            <span>{article.frontmatter.author}</span>
            <span>·</span>
            <span>{article.readingTime} min read</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const displayName = decodedCategory
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const articles = getArticlesByCategory(decodedCategory);

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
          marginBottom: "2rem",
        }}
      >
        <Link
          href="/"
          style={{ color: "var(--primary)" }}
        >
          Home
        </Link>
        <span>/</span>
        <span>{displayName}</span>
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
          {displayName}
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--muted)",
            marginTop: "0.5rem",
          }}
        >
          {articles.length} article{articles.length !== 1 ? "s" : ""} in this
          category
        </p>
      </header>

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 0",
            color: "var(--muted)",
            backgroundColor: "var(--secondary)",
            borderRadius: "8px",
          }}
        >
          <p>No articles found in this category.</p>
        </div>
      )}
    </div>
  );
}
