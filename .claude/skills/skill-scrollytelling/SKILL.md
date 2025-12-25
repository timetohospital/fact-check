---
name: skill-scrollytelling
description: Scrollama 기반 스크롤리텔링 구현. IntersectionObserver 패턴, Sticky 레이아웃, Step 관리 제공. expert-scroll-orchestrator에서 사용.
tools: Read, Write, Edit, Glob, Grep
---

# Skill: Scrollytelling

Scrollama 기반 스크롤리텔링 구현 전문 Skill

## Purpose

Scrollama 라이브러리를 활용한 스크롤리텔링 레이아웃 구현 패턴과 가이드를 제공합니다.

## Dependencies

```json
{
  "scrollama": "^3.2.0",
  "framer-motion": "^11.0.0"
}
```

## Core Components

### 1. ScrollyContainer

```tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import scrollama from 'scrollama';

interface ScrollyContainerProps {
  children: React.ReactNode;
  onStepEnter?: (stepIndex: number, direction: 'up' | 'down') => void;
  onStepProgress?: (stepIndex: number, progress: number) => void;
  offset?: number;
  debug?: boolean;
}

export default function ScrollyContainer({
  children,
  onStepEnter,
  onStepProgress,
  offset = 0.5,
  debug = false,
}: ScrollyContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<any>(null);

  const handleStepEnter = useCallback(
    (response: { index: number; direction: 'up' | 'down' }) => {
      onStepEnter?.(response.index, response.direction);
    },
    [onStepEnter]
  );

  const handleStepProgress = useCallback(
    (response: { index: number; progress: number }) => {
      onStepProgress?.(response.index, response.progress);
    },
    [onStepProgress]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    scrollerRef.current = scrollama();

    scrollerRef.current
      .setup({
        step: '.scroll-step',
        offset: offset as number,
        progress: true,
        debug: debug as boolean,
      })
      .onStepEnter(handleStepEnter)
      .onStepProgress(handleStepProgress);

    const handleResize = () => {
      scrollerRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      scrollerRef.current?.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, [offset, debug, handleStepEnter, handleStepProgress]);

  return (
    <div ref={containerRef} className="scrolly-container relative">
      {children}
    </div>
  );
}
```

### 2. ScrollStep

```tsx
'use client';

import { motion } from 'framer-motion';

interface ScrollStepProps {
  children: React.ReactNode;
  index: number;
  isActive: boolean;
}

export default function ScrollStep({
  children,
  index,
  isActive,
}: ScrollStepProps) {
  return (
    <motion.div
      className="scroll-step min-h-screen flex items-center justify-center p-8"
      data-step={index}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: isActive ? 1 : 0.3 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
```

### 3. StickyChart

```tsx
'use client';

interface StickyChartProps {
  children: React.ReactNode;
}

export default function StickyChart({ children }: StickyChartProps) {
  return (
    <div className="sticky top-0 h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        {children}
      </div>
    </div>
  );
}
```

## Layout Patterns

### Desktop (2열 레이아웃)

```tsx
<section className="relative">
  <ScrollyContainer onStepEnter={handleStepEnter}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
      {/* Left: Scroll Steps */}
      <div className="relative z-10">
        {steps.map((step, index) => (
          <ScrollStep key={index} index={index} isActive={currentStep === index}>
            <StepContent {...step} />
          </ScrollStep>
        ))}
      </div>

      {/* Right: Sticky Chart */}
      <div className="hidden lg:block">
        <StickyChart>
          <Chart currentStep={currentStep} />
        </StickyChart>
      </div>
    </div>
  </ScrollyContainer>
</section>
```

### Mobile (1열 레이아웃)

```tsx
{/* Mobile Chart (visible only on mobile) */}
<section className="lg:hidden px-4 py-8 bg-gray-50">
  <Chart currentStep={totalSteps} /> {/* 전체 데이터 표시 */}
</section>
```

## Scrollama Configuration

### offset 설정

| 값 | 설명 | 용도 |
|---|------|-----|
| 0.0 | Step이 뷰포트 상단에 도달 | 빠른 전환 |
| 0.5 | Step이 뷰포트 중앙에 도달 (기본) | 일반적 용도 |
| 0.8 | Step이 거의 지나갈 때 | 느린 전환 |

### progress 모드

```typescript
// Step 진입 시에만 트리거
scroller.setup({ progress: false })
  .onStepEnter(handleStepEnter);

// Step 내 진행률 추적
scroller.setup({ progress: true })
  .onStepProgress(({ progress }) => {
    // progress: 0.0 ~ 1.0
    animateChart(progress);
  });
```

## Best Practices

### DO

- 각 Step에 충분한 높이 (min-h-screen)
- 명확한 시각적 피드백 (활성 Step 강조)
- 부드러운 트랜지션 (300-500ms)
- 반응형 레이아웃

### DON'T

- Step 높이 너무 짧게
- 과도한 애니메이션
- 모바일에서 Sticky 레이아웃 사용
- resize 이벤트 미처리

---

**Skill Version:** 1.0.0
**Created:** 2025-12-20
