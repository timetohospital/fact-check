# Medical Fact-Check Design System

> 기반: shadcn/ui + anticancer-generations 컬러 팔레트
> 마지막 업데이트: 2024-12-24

## 개요

이 디자인 시스템은 의료 정보 팩트체크 콘텐츠를 위해 설계되었습니다.
**신뢰성**(Blue)과 **긍정적 건강 결과**(Green)를 핵심 컬러로 사용합니다.

## 컬러 팔레트

### Primary Colors (주요 컬러)

| 용도 | CSS 변수 | Hex | Tailwind |
|------|---------|-----|----------|
| Primary | `--primary` | `#3B82F6` | `blue-500` |
| Primary Dark | `--primary-dark` | `#2563EB` | `blue-600` |
| Primary Light | `--primary-light` | `#60A5FA` | `blue-400` |
| Primary Muted | `--primary-muted` | `#DBEAFE` | `blue-100` |

### Success Colors (성공/안전)

| 용도 | CSS 변수 | Hex | Tailwind |
|------|---------|-----|----------|
| Success | `--success` | `#10B981` | `green-500` |
| Success Dark | `--success-dark` | `#059669` | `green-600` |
| Success Light | `--success-light` | `#34D399` | `green-400` |
| Success Muted | `--success-muted` | `#D1FAE5` | `green-100` |

### Semantic Colors (의미론적 컬러)

| 용도 | CSS 변수 | Hex | 설명 |
|------|---------|-----|------|
| Warning | `--warning` | `#F59E0B` | Amber-500, 주의 필요 |
| Danger | `--danger` | `#EF4444` | Red-500, 위험/경고 |
| Danger Dark | `--danger-dark` | `#DC2626` | Red-600, 강조된 위험 |
| Muted | `--muted` | `#6B7280` | Gray-500, 보조 텍스트 |

### Chart Colors (차트 전용) - 절제된 3색 팔레트

> ⚠️ **중요**: anticancer-generations 스타일에 맞춰 Red/Orange를 사용하지 않습니다.
> 의료 신뢰감 강화를 위해 Blue 계열로 위험도를 표현합니다.

```css
/* 위험도 표시 - 절제된 Green → Gray → Blue 그라데이션 */
--chart-risk-low: #10B981;     /* Green-500 - 낮은 위험 (안전) */
--chart-risk-medium: #6B7280;  /* Gray-500 - 중간 위험 (중립) */
--chart-risk-high: #1E40AF;    /* Blue-800 - 높은 위험 (진한 블루) */

/* 세대 구분 (anticancer-generations 기반) */
--chart-gen1: #6B7280;         /* Gray-500 - 1세대, 과거 */
--chart-gen2: #3B82F6;         /* Blue-500 - 2세대, 현재 */
--chart-gen3: #10B981;         /* Green-500 - 3세대, 미래 */
```

**D3.js 컬러 스케일 예시:**
```typescript
// ✅ 올바른 사용법 (절제된 팔레트)
const colorScale = d3.scaleLinear<string>()
  .domain([0, 20, 40])
  .range([
    '#10B981',  // Green-500 (저위험 - 안전)
    '#6B7280',  // Gray-500 (중위험 - 중립)
    '#1E40AF',  // Blue-800 (고위험 - 진한 블루)
  ]);

// ❌ 사용하지 말 것 (너무 컬러풀)
// .range(['#10B981', '#F59E0B', '#EF4444'])  // Red/Orange 금지!
```

## 컴포넌트

### shadcn/ui 컴포넌트

설치된 컴포넌트:
- `Card` - 콘텐츠 카드
- `Badge` - 라벨/태그
- `Button` - 버튼
- `Alert` - 알림 메시지

사용 예시:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

<Card>
  <CardHeader>
    <CardTitle>용종 종류</CardTitle>
    <Badge variant="destructive">위험</Badge>
  </CardHeader>
  <CardContent>
    {/* 콘텐츠 */}
  </CardContent>
</Card>
```

### Insight Cards (인사이트 카드)

시맨틱 컬러 클래스:

```tsx
const getColorClasses = (color: string) => {
  const colors = {
    success: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    primary: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    muted: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  };
  return colors[color] || colors.primary;
};
```

## 타이포그래피

- **Font Family**: Pretendard (CDN)
- **Heading**: font-weight 700, line-height 1.3
- **Body**: font-weight 400, line-height 1.6
- **한글 줄바꿈**: `word-break: keep-all`

## 차트 스타일 가이드

### D3.js 차트 컬러 상수 (절제된 팔레트)

```typescript
const COLORS = {
  // Risk levels - 절제된 Green → Gray → Blue
  riskLow: '#10B981',      // Green-500 (안전)
  riskMedium: '#6B7280',   // Gray-500 (중립) - Amber 대신!
  riskHigh: '#1E40AF',     // Blue-800 (고위험) - Red 대신!

  // Primary palette
  primary: '#3B82F6',      // Blue-500
  primaryDark: '#2563EB',  // Blue-600

  // Generation colors
  gen1: '#6B7280',         // Gray-500 - 과거
  gen2: '#3B82F6',         // Blue-500 - 현재
  gen3: '#10B981',         // Green-500 - 미래
};
```

### 그라디언트 (Blue-800 기반)

```css
/* 차트 영역 그라디언트 - Blue-800 사용 */
background: linear-gradient(to bottom, rgba(30,64,175,0.4), rgba(30,64,175,0.05));

/* Hero 섹션 그라디언트 */
background: linear-gradient(to bottom, #EFF6FF, #FFFFFF);
```

## Scrollytelling 레이아웃 가이드

### StickyChart 컴포넌트 규칙

> ⚠️ **필수**: 모든 오른쪽 Sticky 차트는 **수직 중앙 정렬**되어야 합니다.

**StickyChart.tsx 구조:**
```tsx
// ✅ 올바른 구조 - 수직 중앙 정렬
<div className="sticky top-[10vh] h-[80vh] flex items-center justify-center">
  <div className="w-full max-w-2xl flex items-center justify-center">
    {children}
  </div>
</div>
```

**차트 컨테이너 규칙:**
```tsx
// ✅ 올바른 사용법 - h-full 제거, 중앙 정렬에 맡김
<div className="flex flex-col items-center justify-center p-8">
  {/* 차트 콘텐츠 */}
</div>

// ❌ 잘못된 사용법 - h-full이 정렬을 방해함
<div className="flex flex-col items-center justify-center h-full p-8">
  {/* h-full 사용 금지! */}
</div>
```

### 레이아웃 체크리스트

- [ ] StickyChart 내부 div에 `flex items-center justify-center` 적용
- [ ] 차트 컨테이너에서 `h-full` 제거
- [ ] 모든 차트가 화면 수직 중앙에 위치하는지 확인
- [ ] 스크롤 시 차트 위치가 일관되게 유지되는지 확인

## 규칙

### DO (권장)

- ✅ CSS 변수 또는 Tailwind 클래스 사용
- ✅ 시맨틱 컬러 이름 사용 (success, warning, danger, primary)
- ✅ 차트에서 일관된 위험도 컬러 사용
- ✅ shadcn/ui 컴포넌트 우선 사용

### DON'T (금지)

- ❌ 하드코딩된 임의 컬러 사용 (예: `#6EE7B7`)
- ❌ purple, pink 등 정의되지 않은 컬러 사용
- ❌ 컬러 팔레트 외 컬러 직접 지정

## 파일 구조

```
src/
├── app/
│   └── globals.css          # CSS 변수 정의
├── components/
│   └── ui/                   # shadcn/ui 컴포넌트
│       ├── card.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       └── alert.tsx
└── lib/
    └── utils.ts              # cn() 유틸리티
```

## 참고

- [shadcn/ui 문서](https://ui.shadcn.com)
- [Tailwind CSS 컬러](https://tailwindcss.com/docs/customizing-colors)
