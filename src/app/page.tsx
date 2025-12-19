import Link from "next/link";
import { getAllArticles } from "@/lib/content";
import { Article } from "@/types/content";

// Article Card Component
function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
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
            aspectRatio: featured ? "16/9" : "3/2",
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
              VitalFlow
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: featured ? "1.5rem" : "1rem" }}>
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
              fontSize: featured ? "1.25rem" : "1rem",
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
            <span>{article.frontmatter.author}</span>
            <span>·</span>
            <span>{article.readingTime} min read</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function HomePage() {
  const articles = getAllArticles();
  const featuredArticle = articles[0];
  const latestArticles = articles.slice(1, 7);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          backgroundColor: "var(--secondary)",
          padding: "3rem 0",
        }}
      >
        <div className="container">
          <div style={{ maxWidth: "600px" }}>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: "1rem",
                color: "var(--foreground)",
              }}
            >
              Evidence-Based Health & Wellness
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "var(--muted)",
                lineHeight: 1.6,
              }}
            >
              Expert-reviewed articles to help you make informed decisions about
              your health and well-being.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container" style={{ padding: "3rem 1rem" }}>
        {articles.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 0",
              color: "var(--muted)",
            }}
          >
            <p>No articles yet. Add MDX files to src/content/articles/</p>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featuredArticle && (
              <section style={{ marginBottom: "3rem" }}>
                <h2
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "1rem",
                  }}
                >
                  Featured
                </h2>
                <ArticleCard article={featuredArticle} featured />
              </section>
            )}

            {/* Latest Articles */}
            {latestArticles.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "1rem",
                  }}
                >
                  Latest Articles
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {latestArticles.map((article) => (
                    <ArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Categories */}
        <section style={{ marginTop: "4rem" }}>
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}
          >
            Browse by Category
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            {["Nutrition", "Fitness", "Mental Health", "Wellness"].map(
              (category) => (
                <Link
                  key={category}
                  href={`/category/${category.toLowerCase().replace(" ", "-")}`}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "var(--secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "9999px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--foreground)",
                    transition: "all 0.2s",
                  }}
                >
                  {category}
                </Link>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
