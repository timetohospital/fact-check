---
name: skill-storytelling
description: 데이터 기반 스토리텔링 설계. 3막 구조, 감정 곡선, NYT/Pudding 스타일 혼합 패턴 제공. expert-story-architect에서 사용.
tools: Read, Write, Glob, Grep
---

# Skill: Storytelling

데이터 기반 스토리텔링 설계 전문 Skill

## Purpose

데이터를 기반으로 독자의 감정을 이끌어내는 스토리 구조를 설계하는 패턴과 가이드를 제공합니다.

## 3-Act Structure

### Act 1: Introduction (도입)

**목적:** 독자의 관심을 끌고 문제/상황 제시

**감정:** 충격, 놀라움, 호기심

**기법:**
- 과거의 충격적인 데이터로 시작
- "그때는 이랬다" 형식
- 핵심 숫자 하나로 임팩트

**예시:**
```
"1993년, 암은 사형선고였다"
→ 5년 생존율 42.9%
→ 10명 중 6명은 5년을 넘기지 못했다
```

### Act 2: Development (전개)

**목적:** 변화 과정을 시간순으로 보여줌

**감정:** 이해 → 공감 → 희망 → 기대

**기법:**
- 시간 순 마일스톤 나열
- 각 변화의 원인 설명
- 데이터 변화와 스크롤 동기화

**마일스톤 패턴:**
```
1999년: 국가암조기검진사업 시작 → 45.3%
2000년: 건강보험 통합 → 47.2%
2015년: 면역항암제 도입 → 70.7%
2022년: 현재 → 72.9%
```

### Act 3: Conclusion (결말)

**목적:** 현재 상황과 인사이트 제공

**감정:** 희망, 성취감, 통찰

**기법:**
- 현재의 긍정적 데이터
- 비교 인터랙션 제공
- 핵심 인사이트 요약

**예시:**
```
"이제 10명 중 7명이 생존합니다"
→ 암 종류별 비교 인터랙션
→ 핵심 인사이트 3가지
```

## Emotion Curve

```
감정 강도
    ^
    |     *     *
    |   /   \  / \
    | /       *   \
    |*             \*
    +----------------> Step
     1  2  3  4  5  6
     충  희  기  클  해  희
     격  망  대  라  결  망
              이
              맥
              스
```

## Step Design Patterns

### Step 유형

| 유형 | 설명 | 감정 |
|-----|------|------|
| Hook | 충격적인 시작 | 놀라움 |
| Context | 배경 설명 | 이해 |
| Milestone | 주요 사건 | 기대 |
| Turning | 전환점 | 흥분 |
| Climax | 최고점 | 클라이맥스 |
| Insight | 인사이트 | 통찰 |
| Resolution | 마무리 | 희망 |

### Step 개수 가이드

| Depth | Step 수 | 읽기 시간 |
|-------|---------|----------|
| quick | 5-6 | 3분 |
| standard | 7-10 | 5분 |
| deep | 10-15 | 8분 |

## Style Mixing

### NYT 스타일 (70%)

- 스크롤 동기화 차트
- 텍스트-시각화 연동
- 단계별 이산적 전환
- Sticky 차트 레이아웃

### Pudding 스타일 (30%)

- 필터 버튼 인터랙션
- 호버 툴팁
- 사용자 선택 비교
- "당신의 선택" 기능

### 혼합 비율 결정

```typescript
function calculateStyleRatio(content: StoryContent): { nyt: number; pudding: number } {
  // 시계열 데이터가 주요 → NYT 비중 증가
  if (content.hasTimeline) {
    return { nyt: 0.8, pudding: 0.2 };
  }

  // 카테고리 비교가 주요 → Pudding 비중 증가
  if (content.hasCategories && content.categories.length > 5) {
    return { nyt: 0.6, pudding: 0.4 };
  }

  // 기본
  return { nyt: 0.7, pudding: 0.3 };
}
```

## Writing Guidelines

### 제목 작성

- **길이:** 10자 이내
- **형식:** 숫자 또는 감정 포함
- **목적:** 호기심 유발

**예시:**
- ✅ "30년간의 기적"
- ✅ "암은 더 이상 사형선고가 아니다"
- ❌ "한국 암환자 5년 상대생존율의 변화 추이"

### Step 내용 작성

- **길이:** 50-100자
- **구조:** 팩트 + 감정 + 의미
- **문체:** 간결한 서술체

**예시:**
- ✅ "국가암조기검진사업이 시작되었습니다. 조기 발견율이 높아지며 희망이 싹텄습니다."
- ❌ "1999년에 국가에서 암조기검진사업이라는 것을..."

## Highlight Selection

### 주목할 만한 변화 기준

1. **가장 큰 향상:** 절대 변화량 최대
2. **가장 극적인 변화:** 상대 변화율 최대
3. **아직도 과제:** 여전히 낮은 수치

### 예시

```json
{
  "biggestImprovement": {
    "category": "전립선암",
    "from": 58.5,
    "to": 95.2,
    "change": 36.7
  },
  "mostDramatic": {
    "category": "폐암",
    "from": 11.3,
    "to": 36.8,
    "changePercent": 225
  },
  "stillChallenging": {
    "category": "췌장암",
    "rate": 15.2
  }
}
```

## Best Practices

### DO

- 데이터에서 스토리 추출
- 감정의 흐름 설계
- 독자 관점에서 검토
- 핵심 숫자 강조
- 전환점 명확히 표시

### DON'T

- 데이터 나열만 하기
- 너무 긴 텍스트
- 감정 없는 건조한 서술
- 모든 데이터 포함 시도
- 스토리 없이 인터랙션만

---

**Skill Version:** 1.0.0
**Created:** 2025-12-20
