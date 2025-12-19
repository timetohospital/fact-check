import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getArticleBySlug, getAllArticles } from "@/lib/content";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { generateArticleMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return generateArticleMetadata(article.frontmatter, slug);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const { frontmatter, content, readingTime } = article;

  return (
    <>
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

        <article style={{ maxWidth: "800px" }}>
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
              <span>By {frontmatter.author}</span>
              <span>·</span>
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
                    Reviewed by {frontmatter.medicalReviewer}
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
                marginTop: "2rem",
                padding: "1.5rem",
                backgroundColor: "var(--secondary)",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--foreground)",
                  marginBottom: "0.75rem",
                }}
              >
                Sources
              </h3>
              <ol
                style={{
                  listStylePosition: "inside",
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                  lineHeight: 1.8,
                }}
              >
                {frontmatter.sources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Medical Disclaimer */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              backgroundColor: "#fef3c7",
              border: "1px solid #fbbf24",
              borderRadius: "8px",
              fontSize: "0.875rem",
              color: "#92400e",
            }}
          >
            <strong>Medical Disclaimer:</strong> This content is for
            informational purposes only and should not be considered medical
            advice. Always consult with a qualified healthcare professional.
          </div>
        </article>
      </div>

      {/* Article Content Styles */}
      <style>{`
        .article-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: var(--foreground);
        }
        .article-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: var(--foreground);
        }
        .article-content p {
          margin-bottom: 1.5rem;
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
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: var(--muted);
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
