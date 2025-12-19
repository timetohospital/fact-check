import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  categories: [
    { name: "Nutrition", href: "/category/nutrition" },
    { name: "Fitness", href: "/category/fitness" },
    { name: "Mental Health", href: "/category/mental-health" },
    { name: "Wellness", href: "/category/wellness" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Editorial Policy", href: "/editorial-policy" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Use", href: "/terms" },
    { name: "Medical Disclaimer", href: "/disclaimer" },
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
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2rem",
            padding: "3rem 0",
          }}
        >
          {/* Brand */}
          <div>
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

          {/* Categories */}
          <div>
            <h4
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "var(--foreground)",
              }}
            >
              Categories
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
          <div>
            <h4
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "var(--foreground)",
              }}
            >
              Company
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
          <div>
            <h4
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "var(--foreground)",
              }}
            >
              Legal
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
