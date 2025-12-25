import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WebsiteJsonLd } from "@/components/seo/JsonLd";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://health-factcheck.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "건강의학 팩트체크 | 36.5 의학저널",
    template: "%s | 36.5 의학저널"
  },
  description: "가장 신뢰도 높은 건강정보를 전달해드립니다. 국내외 논문으로 두 번 검증합니다.",
  keywords: ["건강", "의학", "health", "wellness", "medical", "cohort", "meta review", "팩트체크", "의학저널", "논문"],
  authors: [{ name: "36.5 Medical Journalist" }],
  creator: "36.5 건강의학 팩트체크",
  publisher: "36.5 건강의학 팩트체크",

  // Canonical URL 설정
  alternates: {
    canonical: SITE_URL,
  },

  // Favicon 및 아이콘
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },

  // 검색엔진 인증 메타태그
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE", // 구글 서치콘솔에서 발급받은 코드로 교체
    other: {
      "naver-site-verification": "335fa9abcb2cd3973ed25fbc7c1204f23f0e4dff",
    },
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

  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "36.5 건강의학 팩트체크",
    title: "건강의학 팩트체크 | 36.5 의학저널",
    description: "가장 신뢰도 높은 건강정보를 전달해드립니다. 국내외 논문으로 두 번 검증합니다.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "36.5 건강의학 팩트체크 - 논문에 기반한 건강정보",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <GoogleAnalytics />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <WebsiteJsonLd />
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
