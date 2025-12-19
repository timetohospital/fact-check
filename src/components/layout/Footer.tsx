import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  categories: [
    { name: "팩트체크", href: "/category/factcheck" },
    { name: "암 환자 관리", href: "/category/cancer-care" },
    { name: "건강정보", href: "/category/health-info" },
    { name: "무료 AI상담", href: "/ai-consult" },
  ],
  company: [
    { name: "소개", href: "/about" },
    { name: "문의하기", href: "/contact" },
  ],
  legal: [
    { name: "개인정보처리방침", href: "/privacy" },
    { name: "이용약관", href: "/terms" },
    { name: "의료 면책조항", href: "/disclaimer" },
  ],
};

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--secondary)",
        borderTop: "1px solid var(--border)",
        marginTop: "4rem",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "2rem",
            padding: "3rem 0",
          }}
        >
          {/* Brand - 왼쪽 */}
          <div style={{ flex: "1 1 300px", maxWidth: "350px" }}>
            <Link
              href="/"
              style={{
                display: "block",
                marginBottom: "1rem",
              }}
            >
              <Image
                src="/images/logo.png"
                alt="365 Health"
                width={200}
                height={66}
                style={{ objectFit: "contain" }}
              />
            </Link>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--muted)",
                lineHeight: 1.6,
              }}
            >
              전문가가 검증한 신뢰할 수 있는 건강 정보를 제공합니다.
            </p>
          </div>

          {/* 오른쪽 링크 그룹 */}
          <div
            style={{
              display: "flex",
              gap: "3rem",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {/* Categories */}
            <div style={{ textAlign: "right" }}>
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  color: "var(--foreground)",
                }}
              >
                카테고리
              </h4>
              <ul style={{ listStyle: "none" }}>
                {footerLinks.categories.map((link) => (
                  <li key={link.name} style={{ marginBottom: "0.5rem" }}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--muted)",
                        transition: "color 0.2s",
                      }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div style={{ textAlign: "right" }}>
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  color: "var(--foreground)",
                }}
              >
                회사
              </h4>
              <ul style={{ listStyle: "none" }}>
                {footerLinks.company.map((link) => (
                  <li key={link.name} style={{ marginBottom: "0.5rem" }}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--muted)",
                      }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div style={{ textAlign: "right" }}>
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  color: "var(--foreground)",
                }}
              >
                법적 고지
              </h4>
              <ul style={{ listStyle: "none" }}>
                {footerLinks.legal.map((link) => (
                  <li key={link.name} style={{ marginBottom: "0.5rem" }}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--muted)",
                      }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "1.5rem 0",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
            }}
          >
            © {new Date().getFullYear()} 365 Health. All rights reserved.
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
            }}
          >
            Content is for informational purposes only. Consult a healthcare
            professional.
          </p>
        </div>
      </div>
    </footer>
  );
}
