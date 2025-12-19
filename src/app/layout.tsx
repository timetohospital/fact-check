import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WebsiteJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: {
    default: "VitalFlow | Evidence-Based Health & Wellness",
    template: "%s | VitalFlow"
  },
  description: "Evidence-based health content reviewed by medical professionals. Discover expert insights on wellness, nutrition, mental health, and more.",
  keywords: ["health", "wellness", "medical", "nutrition", "mental health", "fitness"],
  authors: [{ name: "VitalFlow Team" }],
  creator: "VitalFlow",
  publisher: "VitalFlow",
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
    locale: "en_US",
    siteName: "VitalFlow",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@vitalflow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
