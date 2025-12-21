/**
 * Next.js 미들웨어 - A/B 테스트 쿠키 설정
 *
 * /articles/[slug] 접근 시 A/B 버킷 쿠키 자동 설정
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // /articles/[slug] 경로만 처리
  if (pathname.startsWith('/articles/')) {
    const slug = pathname.replace('/articles/', '').split('/')[0];

    if (slug) {
      const bucketKey = `ab_${slug}`;
      const existingBucket = request.cookies.get(bucketKey)?.value;

      // 버킷이 없으면 새로 할당
      if (!existingBucket) {
        const bucket = Math.random() < 0.5 ? 'A' : 'B';

        // 쿠키 설정 (30일 유지)
        response.cookies.set(bucketKey, bucket, {
          maxAge: 60 * 60 * 24 * 30, // 30일
          httpOnly: true,
          sameSite: 'lax',
        });
      }
    }
  }

  return response;
}

export const config = {
  matcher: '/articles/:path*',
};
