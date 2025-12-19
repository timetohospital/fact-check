"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const categories = [
  { name: "Nutrition", href: "/category/nutrition" },
  { name: "Fitness", href: "/category/fitness" },
  { name: "Mental Health", href: "/category/mental-health" },
  { name: "Wellness", href: "/category/wellness" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--background)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="container">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100px",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Image
              src="/images/logo.png"
              alt="365 Health"
              width={240}
              height={80}
              style={{ objectFit: "contain" }}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: "flex",
              gap: "2rem",
            }}
            className="desktop-nav"
          >
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--foreground)",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.color = "var(--primary)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.color = "var(--foreground)")
                }
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: "none",
              padding: "0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Toggle menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isMenuOpen ? (
                <path d="M6 6L18 18M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav
            className="mobile-nav"
            style={{
              display: "none",
              flexDirection: "column",
              paddingBottom: "1rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                style={{
                  padding: "0.75rem 0",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--foreground)",
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-nav {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
