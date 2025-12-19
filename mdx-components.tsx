import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // 기본 HTML 요소 스타일링 (나중에 UI 작업 시 커스터마이징)
    h1: ({ children }) => <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-semibold mt-6 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-medium mt-4 mb-2">{children}</h3>,
    p: ({ children }) => <p className="my-4 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside my-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside my-4">{children}</ol>,
    a: ({ href, children }) => (
      <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    ...components,
  };
}
