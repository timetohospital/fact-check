import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  getArticleWithFallback,
  getAllSlugsWithFallback,
} from "@/lib/content-db";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { generateArticleMetadata } from "@/lib/seo";
import ScrollDepthTracker from "@/components/analytics/ScrollDepthTracker";

export async function generateStaticParams() {
  const slugs = await getAllSlugsWithFallback();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleWithFallback(slug);
  if (!article) return {};
  return generateArticleMetadata(article.frontmatter, slug);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleWithFallback(slug);

  if (!article) {
    notFound();
  }

  const { frontmatter, content, readingTime } = article;

  return (
    <>
      <ScrollDepthTracker articleSlug={slug} expectedReadingTime={readingTime} />
      <ArticleJsonLd frontmatter={frontmatter} slug={slug} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          {
            name: frontmatter.category,
            url: `/category/${frontmatter.category.toLowerCase()}`,
          },
          { name: frontmatter.title, url: `/articles/${slug}` },
        ]}
      />

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
          <Link href="/" style={{ color: "var(--primary)" }}>
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/category/${frontmatter.category.toLowerCase()}`}
            style={{ color: "var(--primary)" }}
          >
            {frontmatter.category}
          </Link>
          <span>/</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {frontmatter.title}
          </span>
        </nav>

        <article style={{ maxWidth: "720px", margin: "0 auto" }}>
          {/* Header */}
          <header style={{ marginBottom: "2rem" }}>
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
              {frontmatter.category}
            </span>

            {/* Title */}
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                lineHeight: 1.2,
                marginTop: "0.5rem",
                color: "var(--foreground)",
                wordBreak: "keep-all",
                overflowWrap: "break-word",
              }}
            >
              {frontmatter.title}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: "1.25rem",
                color: "var(--muted)",
                marginTop: "1rem",
                lineHeight: 1.6,
                wordBreak: "keep-all",
                overflowWrap: "break-word",
              }}
            >
              {frontmatter.description}
            </p>

            {/* Meta */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "1rem",
                marginTop: "1.5rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--border)",
                fontSize: "0.875rem",
                color: "var(--muted)",
              }}
            >
              <span>{frontmatter.publishedAt}</span>
              <span>·</span>
              <span>{readingTime} min read</span>
              {frontmatter.medicalReviewer && (
                <>
                  <span>·</span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      color: "var(--primary)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    {frontmatter.medicalReviewer}
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {frontmatter.image && (
            <div
              style={{
                aspectRatio: "16/9",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "2rem",
                backgroundColor: "var(--secondary)",
              }}
            >
              <img
                src={frontmatter.image}
                alt={frontmatter.imageAlt || frontmatter.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* Content */}
          <div
            className="article-content"
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.8,
              color: "var(--foreground)",
              wordBreak: "keep-all",
            }}
          >
            <MDXRemote
              source={content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                },
              }}
            />
          </div>

          {/* Tags */}
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div
              style={{
                marginTop: "3rem",
                paddingTop: "2rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  marginBottom: "0.75rem",
                }}
              >
                Tags
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                {frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "var(--secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      color: "var(--muted)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {frontmatter.sources && frontmatter.sources.length > 0 && (
            <div
              style={{
                marginTop: "3rem",
                padding: "1.5rem",
                backgroundColor: "var(--secondary)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  marginBottom: "1rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                참고 문헌
              </h3>
              <ol
                style={{
                  paddingLeft: "1.25rem",
                  fontSize: "0.8125rem",
                  color: "var(--muted)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {frontmatter.sources.map((source, index) => {
                  const urlMatch = source.match(/(https?:\/\/[^\s]+)/);
                  const url = urlMatch ? urlMatch[1] : null;
                  const text = url ? source.replace(url, "").trim() : source;

                  return (
                    <li key={index} style={{ marginBottom: "0.625rem" }}>
                      {text}
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--primary)",
                            textDecoration: "none",
                            marginLeft: "0.375rem",
                            fontWeight: 500,
                          }}
                        >
                          ↗
                        </a>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Medical Disclaimer */}
          <div
            style={{
              marginTop: "1rem",
              padding: "1.5rem",
              backgroundColor: "var(--secondary)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              의료 면책 조항
            </h3>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--muted)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              이 콘텐츠는 정보 제공 목적으로만 작성되었으며, 의료적 조언으로 간주되어서는 안 됩니다. 건강 관련 결정은 반드시 전문 의료인과 상담 후 내리시기 바랍니다.
            </p>
          </div>
        </article>
      </div>

      {/* Article Content Styles */}
      <style>{`
        .article-content {
          word-break: keep-all;
          overflow-wrap: break-word;
        }
        .article-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 3.5rem;
          margin-bottom: 1rem;
          color: var(--primary);
          padding-left: 1rem;
          border-left: 4px solid var(--primary);
          word-break: keep-all;
        }
        .article-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          color: var(--foreground);
          word-break: keep-all;
        }
        .article-content p {
          margin-bottom: 1.75rem;
          word-break: keep-all;
        }
        .article-content ul,
        .article-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .article-content li {
          margin-bottom: 0.5rem;
        }
        .article-content a {
          color: var(--primary);
          text-decoration: underline;
        }
        .article-content blockquote {
          border-left: 4px solid var(--primary);
          padding: 1rem 1.5rem;
          margin: 1.75rem 0;
          background: var(--secondary);
          border-radius: 0 8px 8px 0;
          color: var(--foreground);
        }
        .article-content code {
          background: var(--secondary);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.875em;
        }
        .article-content pre {
          background: var(--secondary);
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }
        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
        }
        /* Table Styles */
        .article-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.95rem;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .article-content thead {
          background: var(--primary);
          color: white;
        }
        .article-content th {
          padding: 0.875rem 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .article-content td {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--border);
          vertical-align: top;
        }
        .article-content tbody tr:nth-child(even) {
          background: var(--secondary);
        }
        .article-content tbody tr:hover {
          background: rgba(15, 118, 110, 0.05);
        }
        .article-content tbody tr:last-child td {
          border-bottom: none;
        }
        /* Horizontal Rule */
        .article-content hr {
          border: none;
          border-top: 2px solid var(--border);
          margin: 2.5rem 0;
        }
      `}</style>
    </>
  );
}
