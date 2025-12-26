import Link from "next/link";
import { getAllArticlesWithFallback } from "@/lib/content-db";
import { Article, CATEGORIES } from "@/types/content";

// Category-based background colors (de Volkskrant style)
const CATEGORY_COLORS: Record<string, { bg: string; accent: string }> = {
  factcheck: { bg: "#f5f5f0", accent: "#e6d5a7" },      // 베이지
  "health-info": { bg: "#e8ece9", accent: "#c8d1cc" },  // 민트
  etc: { bg: "#f0f4f7", accent: "#b8c8d4" },            // 하늘
  default: { bg: "#f9e8e2", accent: "#d99a8a" },        // 핑크
};

// Hero Article Component - Image background with text overlay
function HeroArticle({ article }: { article: Article }) {
  return (
    <article style={{ position: "relative" }}>
      <Link href={`/articles/${article.slug}`}>
        {/* Background Image */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
            backgroundColor: "#1a1a1a",
            overflow: "hidden",
          }}
        >
          {article.frontmatter.image && (
            <img
              src={article.frontmatter.image}
              alt={article.frontmatter.imageAlt || article.frontmatter.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}

          {/* Gradient Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "70%",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
            }}
          />

          {/* Text Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "2rem",
            }}
          >
            {/* Category */}
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {article.frontmatter.category}
            </span>

            {/* Title - WHITE color */}
            <h2
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                fontWeight: 700,
                marginTop: "0.5rem",
                lineHeight: 1.2,
                maxWidth: "800px",
                color: "#ffffff",
              }}
            >
              {article.frontmatter.title}
            </h2>
          </div>
        </div>
      </Link>
    </article>
  );
}

// Small Card with Image Background and Text Overlay
function OverlayCard({ article }: { article: Article }) {
  return (
    <article style={{ position: "relative", flexShrink: 0 }}>
      <Link href={`/articles/${article.slug}`}>
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/3",
            backgroundColor: "#1a1a1a",
            overflow: "hidden",
          }}
        >
          {article.frontmatter.image && (
            <img
              src={article.frontmatter.image}
              alt={article.frontmatter.imageAlt || article.frontmatter.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}

          {/* Gradient Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "80%",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
            }}
          />

          {/* Text Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "1rem",
            }}
          >
            {/* Category */}
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {article.frontmatter.category}
            </span>

            {/* Title - WHITE color */}
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                marginTop: "0.25rem",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                color: "#ffffff",
              }}
            >
              {article.frontmatter.title}
            </h3>
          </div>
        </div>
      </Link>
    </article>
  );
}

// Section Divider (de Volkskrant style - bold title)
function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginTop: "2.5rem", marginBottom: "1rem" }}>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--foreground)",
          margin: 0,
          borderBottom: "2px solid var(--foreground)",
          paddingBottom: "0.5rem",
          display: "inline-block",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

// Column Card - de Volkskrant style (colored background + author image at bottom)
function ColumnCard({ article, index }: { article: Article; index: number }) {
  const categorySlug = article.frontmatter.category?.toLowerCase().replace(/\s+/g, "-") || "default";
  const colors = CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.default;

  // Rotate colors for variety
  const colorOptions = Object.values(CATEGORY_COLORS);
  const selectedColors = colorOptions[index % colorOptions.length];

  return (
    <article style={{ flexShrink: 0, width: "280px", height: "350px" }}>
      <Link href={`/articles/${article.slug}`} style={{ textDecoration: "none" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            backgroundColor: selectedColors.bg,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            transition: "transform 0.3s ease",
          }}
          className="column-card"
        >
          {/* Top Section - Text */}
          <div style={{ padding: "1.25rem" }}>
            {/* Category Tag */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>
              <span
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#1a1a1a",
                }}
              >
                칼럼 • {article.frontmatter.category}
              </span>
            </div>

            {/* Author Name */}
            <div
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                color: "#666",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              전문가 기고
            </div>

            {/* Headline */}
            <h3
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: "1.125rem",
                fontWeight: 500,
                lineHeight: 1.4,
                color: "#1a1a1a",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                margin: 0,
              }}
            >
              {article.frontmatter.title}
            </h3>
          </div>

          {/* Bottom Section - Author Image or Icon */}
          <div
            style={{
              height: "120px",
              backgroundColor: selectedColors.accent,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              position: "relative",
            }}
          >
            {article.frontmatter.authorImage ? (
              <img
                src={article.frontmatter.authorImage}
                alt="Author"
                style={{
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              /* Default Icon when no author image */
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="1.5"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

// Image Overlay Card - de Volkskrant "Mensen/Opinie" style
// Full image background with gradient overlay and white text at bottom
function ImageOverlayCard({ article }: { article: Article }) {
  return (
    <article style={{ flexShrink: 0, width: "280px", height: "350px" }}>
      <Link href={`/articles/${article.slug}`} style={{ textDecoration: "none" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            backgroundColor: "#1a1a1a",
            overflow: "hidden",
          }}
          className="image-overlay-card"
        >
          {/* Background Image */}
          {article.frontmatter.image ? (
            <img
              src={article.frontmatter.image}
              alt={article.frontmatter.imageAlt || article.frontmatter.title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.5s ease",
              }}
              className="card-image"
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: "3rem",
                fontWeight: 700,
              }}
            >
              36.5
            </div>
          )}

          {/* Gradient Overlay - Bottom to top fade */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
            }}
          />

          {/* Text Content - Bottom aligned */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "1.25rem",
              color: "#ffffff",
            }}
          >
            {/* Category Tag */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {article.frontmatter.category}
              </span>
            </div>

            {/* Headline - Serif font, white */}
            <h3
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: "1.125rem",
                fontWeight: 700,
                lineHeight: 1.35,
                color: "#ffffff",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                margin: 0,
              }}
            >
              {article.frontmatter.title}
            </h3>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default async function HomePage() {
  const articles = await getAllArticlesWithFallback();
  const heroArticle = articles[0];
  const overlayCards = articles.slice(1, 4); // 3 cards for overlay row (changed from 5)
  const columnArticles = articles.slice(0, 5); // Articles for column-style cards
  const factcheckArticles = articles.slice(0, 6); // More articles for slider
  const healthInfoArticles = articles.slice(0, 6); // More articles for slider

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Main Content */}
      <div className="container" style={{ padding: "0 0 2rem 0" }}>
        {articles.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 1rem",
              color: "var(--muted)",
            }}
          >
            <p>No articles yet. Add MDX files to src/content/articles/</p>
          </div>
        ) : (
          <>
            {/* Hero Section - Full width image with overlay */}
            {heroArticle && (
              <section>
                <HeroArticle article={heroArticle} />
              </section>
            )}

            {/* Overlay Cards Row - 3 cards */}
            {overlayCards.length > 0 && (
              <section style={{ marginTop: "2px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "2px",
                  }}
                >
                  {overlayCards.map((article) => (
                    <OverlayCard key={article.slug} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Expert Columns Section - de Volkskrant style */}
            {columnArticles.length > 0 && (
              <section style={{ padding: "0 1rem" }}>
                <SectionHeader title="전문가 칼럼" />
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    paddingBottom: "1rem",
                  }}
                  className="hide-scrollbar"
                >
                  {columnArticles.map((article, index) => (
                    <ColumnCard key={`column-${article.slug}`} article={article} index={index} />
                  ))}
                </div>
              </section>
            )}

            {/* Factcheck Section - Image Overlay Cards */}
            <section style={{ padding: "0 1rem" }}>
              <SectionHeader title="팩트체크" />
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  paddingBottom: "1rem",
                }}
                className="hide-scrollbar"
              >
                {factcheckArticles.map((article) => (
                  <ImageOverlayCard key={`factcheck-${article.slug}`} article={article} />
                ))}
              </div>
            </section>

            {/* Health Info Section - Image Overlay Cards */}
            {healthInfoArticles.length > 0 && (
              <section style={{ padding: "0 1rem" }}>
                <SectionHeader title="건강정보" />
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    paddingBottom: "1rem",
                  }}
                  className="hide-scrollbar"
                >
                  {healthInfoArticles.map((article) => (
                    <ImageOverlayCard key={`health-${article.slug}`} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Categories Section */}
            <section style={{ padding: "0 1rem" }}>
              <SectionHeader title="카테고리" />
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                {Object.values(CATEGORIES).map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    style={{
                      padding: "0.625rem 1.25rem",
                      backgroundColor: "var(--secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "9999px",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--foreground)",
                      transition: "all 0.2s",
                    }}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Styles */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .column-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .image-overlay-card:hover .card-image {
          transform: scale(1.05);
        }
        .image-overlay-card {
          cursor: pointer;
        }
        @media (max-width: 1024px) {
          .container section:nth-of-type(2) > div {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .container section:nth-of-type(2) > div {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .container section:nth-of-type(2) > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
