'use client';

import { useEffect, useRef, useCallback, ReactNode } from 'react';
import scrollama from 'scrollama';

interface ScrollyContainerProps {
  children: ReactNode;
  onStepEnter?: (stepIndex: number, direction: 'up' | 'down') => void;
  onStepProgress?: (stepIndex: number, progress: number) => void;
  offset?: number;
  debug?: boolean;
  /** CSS Scroll Snap 활성화 */
  enableSnap?: boolean;
  /** Snap 컨테이너 클래스 (기본: scrolly-snap-container) */
  snapContainerClass?: string;
}

export default function ScrollyContainer({
  children,
  onStepEnter,
  onStepProgress,
  offset = 0.5,
  debug = false,
  enableSnap = false,
  snapContainerClass = 'scrolly-snap-container',
}: ScrollyContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrollerRef = useRef<any>(null);

  const handleStepEnter = useCallback(
    (response: { index: number; direction: 'up' | 'down' }) => {
      if (onStepEnter) {
        onStepEnter(response.index, response.direction);
      }
    },
    [onStepEnter]
  );

  const handleStepProgress = useCallback(
    (response: { index: number; progress: number }) => {
      if (onStepProgress) {
        onStepProgress(response.index, response.progress);
      }
    },
    [onStepProgress]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scrollama
    scrollerRef.current = scrollama();

    // Snap 모드일 때는 컨테이너 내부 스크롤 감지
    const scrollParent = enableSnap ? containerRef.current : undefined;

    scrollerRef.current
      .setup({
        step: '.scroll-step',
        offset: offset as number,
        progress: true,
        debug: debug as boolean,
        parent: scrollParent,
      })
      .onStepEnter(handleStepEnter)
      .onStepProgress(handleStepProgress);

    // Handle window resize
    const handleResize = () => {
      scrollerRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      scrollerRef.current?.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, [offset, debug, enableSnap, handleStepEnter, handleStepProgress]);

  // 클래스 조합
  const containerClasses = [
    'scrolly-container',
    'relative',
    enableSnap ? snapContainerClass : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={containerClasses}>
      {children}
    </div>
  );
}
