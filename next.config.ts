import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  // 정적 사이트 빌드 (Firebase Hosting용)
  output: "export",
  trailingSlash: true,

  // Turbopack 설정 (Windows symlink 문제 해결)
  turbopack: {
    root: "C:/grum_code/fact-check",
  },

  // SEO 최적화
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true, // 정적 빌드에서는 이미지 최적화 비활성화
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // 성능 최적화
  compress: true,
  poweredByHeader: false,
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
