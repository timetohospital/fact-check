"use client";

import { useEffect, useRef } from "react";
import { event } from "./GoogleAnalytics";

interface ScrollDepthTrackerProps {
  articleSlug: string;
  expectedReadingTime: number; // 분 단위
}

export default function ScrollDepthTracker({
  articleSlug,
  expectedReadingTime,
}: ScrollDepthTrackerProps) {
  const trackedDepths = useRef<Set<number>>(new Set());
  const startTime = useRef<number>(0);
  const hasTrackedComplete = useRef<boolean>(false);

  useEffect(() => {
    // 시작 시간 기록 (useEffect 내에서 초기화)
    startTime.current = Date.now();
    trackedDepths.current.clear();
    hasTrackedComplete.current = false;

    const handleScroll = () => {
      // 스크롤 깊이 계산
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) return;

      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // 25%, 50%, 75%, 100% 체크포인트
      const checkpoints = [25, 50, 75, 100];

      checkpoints.forEach((checkpoint) => {
        if (scrollPercent >= checkpoint && !trackedDepths.current.has(checkpoint)) {
          trackedDepths.current.add(checkpoint);

          // GA4 이벤트 전송
          event({
            action: "scroll_depth",
            category: "engagement",
            label: articleSlug,
            value: checkpoint,
          });

          // 커스텀 이벤트 파라미터와 함께 gtag 직접 호출
          if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "scroll_depth", {
              article_slug: articleSlug,
              scroll_percentage: checkpoint,
              time_on_page: Math.round((Date.now() - startTime.current) / 1000),
            });
          }
        }
      });
    };

    // 완독 체크 (페이지 떠날 때)
    const handleBeforeUnload = () => {
      if (hasTrackedComplete.current) return;

      const timeSpent = Math.round((Date.now() - startTime.current) / 1000); // 초 단위
      const expectedSeconds = expectedReadingTime * 60;
      const scrolledToEnd = trackedDepths.current.has(100);
      const readingRatio = Math.min(timeSpent / expectedSeconds, 2); // 최대 200%

      // 완독 판정: 100% 스크롤 + 예상 시간의 50% 이상 체류
      const isCompleteRead = scrolledToEnd && readingRatio >= 0.5;

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "article_engagement", {
          article_slug: articleSlug,
          time_spent_seconds: timeSpent,
          expected_reading_seconds: expectedSeconds,
          reading_ratio: Math.round(readingRatio * 100), // 백분율
          max_scroll_depth: Math.max(...Array.from(trackedDepths.current), 0),
          is_complete_read: isCompleteRead,
        });
      }

      hasTrackedComplete.current = true;
    };

    // 이벤트 리스너 등록
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 초기 스크롤 위치 체크 (페이지 중간으로 바로 이동한 경우)
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // 컴포넌트 언마운트시에도 완독 체크
      handleBeforeUnload();
    };
  }, [articleSlug, expectedReadingTime]);

  return null; // UI 없음, 트래킹만 수행
}
