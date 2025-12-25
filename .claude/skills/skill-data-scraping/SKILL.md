---
name: skill-data-scraping
description: 공공 데이터 수집 및 정제. data.go.kr, KOSIS, 정부 기관 데이터 수집 패턴과 JSON 스키마 제공. expert-data-collector에서 사용.
tools: Read, Write, WebFetch, WebSearch, Glob, Grep
---

# Skill: Data Scraping

공공 데이터 수집 및 정제 전문 Skill

## Purpose

인터랙티브 아티클에 필요한 데이터를 공공데이터포털, 통계청, 정부 기관에서 수집하고 JSON 형식으로 정제하는 패턴과 가이드를 제공합니다.

## Data Sources

### 1. 공공데이터포털 (data.go.kr)

**검색 패턴:**
```
WebSearch("{주제} site:data.go.kr")
```

**API 접근:**
- 오픈 API 키 필요 (무료 발급)
- REST API 또는 파일 다운로드

**데이터 형식:**
- CSV, JSON, XML
- Excel (xlsx)

### 2. 통계청 KOSIS (kosis.kr)

**검색 패턴:**
```
WebSearch("{주제} site:kosis.kr 통계표")
```

**데이터 접근:**
- 웹 테이블 스크래핑
- KOSIS API (등록 필요)

**주요 통계:**
- 인구 통계
- 경제 지표
- 사회 통계
- 보건 통계

### 3. 정부 기관 웹사이트

**주요 기관:**
| 기관 | 도메인 | 데이터 분야 |
|-----|--------|-----------|
| 국립암센터 | ncc.re.kr | 암 통계 |
| 건강보험심사평가원 | hira.or.kr | 의료 통계 |
| 한국은행 | bok.or.kr | 경제 지표 |
| 고용노동부 | moel.go.kr | 노동 통계 |
| 환경부 | me.go.kr | 환경 데이터 |

## Data Collection Patterns

### Pattern 1: WebSearch + WebFetch

```typescript
// 1. 데이터 소스 검색
const searchQuery = `${topic} site:data.go.kr 통계`;
const searchResults = await WebSearch(searchQuery);

// 2. 관련 페이지 접근
const pageUrl = searchResults[0].url;
const pageContent = await WebFetch(pageUrl, "데이터 테이블 추출");

// 3. 데이터 파싱
const parsedData = parseTableData(pageContent);
```

### Pattern 2: HTML 테이블 추출

**테이블 구조 분석:**
```html
<table class="data-table">
  <thead>
    <tr><th>연도</th><th>값</th></tr>
  </thead>
  <tbody>
    <tr><td>2020</td><td>100</td></tr>
    <tr><td>2021</td><td>110</td></tr>
  </tbody>
</table>
```

**추출 결과:**
```json
[
  { "연도": "2020", "값": 100 },
  { "연도": "2021", "값": 110 }
]
```

### Pattern 3: PDF/Excel 데이터

**처리 전략:**
1. PDF: 텍스트 추출 → 구조화
2. Excel: CSV 변환 → 파싱
3. 수동 입력: 핵심 데이터만 추출

## Data Cleaning Patterns

### 숫자 정규화

```typescript
function normalizeNumber(value: string): number {
  // 쉼표 제거
  let cleaned = value.replace(/,/g, '');
  // 단위 처리 (천, 만, 억)
  if (cleaned.includes('천')) {
    cleaned = String(parseFloat(cleaned) * 1000);
  }
  return parseFloat(cleaned);
}
```

### 날짜 정규화

```typescript
function normalizePeriod(value: string): string {
  // "1993~1995" → "1993-1995"
  // "2020년" → "2020"
  // "2020.01" → "2020-01"
  return value
    .replace(/~/g, '-')
    .replace(/년|월|일/g, '')
    .replace(/\./g, '-')
    .trim();
}
```

### 결측값 처리

```typescript
function handleMissing(data: any[], strategy: 'null' | 'interpolate' | 'previous'): any[] {
  return data.map((item, index) => {
    if (item.value === null || item.value === undefined) {
      switch (strategy) {
        case 'null':
          return { ...item, value: null };
        case 'interpolate':
          // 선형 보간
          const prev = data[index - 1]?.value;
          const next = data[index + 1]?.value;
          return { ...item, value: (prev + next) / 2 };
        case 'previous':
          return { ...item, value: data[index - 1]?.value };
      }
    }
    return item;
  });
}
```

## Output Schema

### 표준 JSON 스키마

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["metadata", "timeline"],
  "properties": {
    "metadata": {
      "type": "object",
      "required": ["source", "sourceUrl", "lastUpdated"],
      "properties": {
        "title": { "type": "string" },
        "source": { "type": "string" },
        "sourceUrl": { "type": "string", "format": "uri" },
        "lastUpdated": { "type": "string", "format": "date" },
        "license": { "type": "string" },
        "description": { "type": "string" }
      }
    },
    "timeline": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["period", "value"],
        "properties": {
          "period": { "type": "string" },
          "value": { "type": "number" },
          "label": { "type": "string" },
          "milestone": { "type": "string" }
        }
      }
    },
    "categories": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "color": { "type": "string" },
          "data": { "type": "array" }
        }
      }
    },
    "highlights": { "type": "object" },
    "keyInsights": { "type": "array" },
    "statistics": { "type": "object" }
  }
}
```

## Quality Validation

### 검증 체크리스트

- [ ] 출처 URL 유효성 확인
- [ ] 숫자 범위 검증 (0-100% 등)
- [ ] 시계열 연속성 확인
- [ ] 중복 데이터 제거
- [ ] 필수 필드 존재 확인
- [ ] JSON 문법 검증

### 검증 함수

```typescript
function validateData(data: DataPackage): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 메타데이터 검증
  if (!data.metadata.sourceUrl) {
    errors.push('출처 URL 누락');
  }

  // 타임라인 검증
  if (data.timeline.length < 5) {
    warnings.push('데이터 포인트가 5개 미만');
  }

  // 값 범위 검증
  data.timeline.forEach(item => {
    if (item.value < 0 || item.value > 100) {
      warnings.push(`비정상 값: ${item.period} = ${item.value}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

## Best Practices

### DO

- 항상 공식 출처 URL 기록
- 데이터 수집 날짜 명시
- 라이선스 정보 확인 (공공누리 등)
- 데이터 검증 후 저장
- 원본 데이터 보존

### DON'T

- 비공식 출처 사용
- 저작권 침해 데이터 수집
- 출처 없이 데이터 사용
- 데이터 임의 조작
- 검증 없이 출력

## Error Handling

| 에러 | 원인 | 해결책 |
|-----|------|-------|
| 404 Not Found | 페이지 삭제됨 | 대체 소스 검색 |
| 403 Forbidden | 접근 제한 | 공개 요약 데이터 사용 |
| Timeout | 서버 응답 없음 | 재시도 (최대 3회) |
| Parse Error | 형식 불일치 | 수동 데이터 입력 |

---

**Skill Version:** 1.0.0
**Created:** 2025-12-20
**Maintained By:** fact-check project
