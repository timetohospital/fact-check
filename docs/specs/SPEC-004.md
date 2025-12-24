# SPEC-004: 프롬프트 자동 업데이트 시스템

> **상태**: ✅ 배포 완료
> **우선순위**: P1
> **예상 기간**: 0.5일
> **작성일**: 2024-12-21
> **수정일**: 2024-12-24
> **선행조건**: SPEC-003 완료

---

## 1. 목표

검증된 패턴(HIGH/MEDIUM 신뢰도)을 글 생성 프롬프트에 자동으로 반영하여, 새로 생성되는 콘텐츠가 점진적으로 최적화되도록 한다.

### 1.1 현재 상태

- 패턴 저장: `patterns` 테이블에 저장됨 (SPEC-003)
- 프롬프트 버전: `prompt_versions` 테이블에 v1.0 존재
- 글 생성: 수동으로 프롬프트 작성

### 1.2 목표 상태

- 자동 업데이트: HIGH/MEDIUM 패턴이 일정 수 이상 누적되면 프롬프트 자동 갱신
- 버전 관리: 새 프롬프트 버전 자동 생성 및 기록
- 글 생성 적용: 새 글 생성 시 최신 active 프롬프트 사용

---

## 2. 시스템 아키텍처

### 2.1 프롬프트 업데이트 흐름

```
SPEC-003 (패턴 추출)
    ↓
patterns 테이블 업데이트
    ↓
패턴 누적 체크 (트리거 조건)
    ↓
조건 충족 시 → 프롬프트 업데이트 함수 호출
    ↓
새 prompt_version 생성
    ↓
기존 버전 deprecated 처리
```

### 2.2 트리거 조건

다음 조건 중 하나라도 만족하면 프롬프트 업데이트:

1. **새로운 HIGH 패턴**: 새로 HIGH 레벨로 승격된 패턴 1개 이상
2. **MEDIUM 패턴 누적**: 미적용 MEDIUM 패턴 3개 이상
3. **수동 트리거**: 관리자가 수동으로 업데이트 요청

---

## 3. 구현 완료 파일

### 3.1 디렉토리 구조

```
functions/content_analyzer/
├── main.py               # ✅ SPEC-003 메인 (prompt_updater 연동)
├── prompt_updater.py     # ✅ 프롬프트 자동 업데이트 모듈
└── ...
```

### 3.2 핵심 함수

| 함수 | 설명 |
|------|------|
| `get_active_patterns()` | 활성 패턴 조회 (신뢰도 순) |
| `get_current_prompt_version()` | 현재 활성 프롬프트 조회 |
| `get_unapplied_patterns()` | 미적용 패턴 조회 |
| `should_update_prompt()` | 업데이트 필요 여부 판단 |
| `generate_pattern_instructions()` | 패턴 → 프롬프트 지침 변환 |
| `create_new_prompt_version()` | 새 버전 생성 |
| `update_prompt_if_needed()` | 메인 함수 |

---

## 4. 프롬프트 구조

### 4.1 템플릿

```
[시스템 프롬프트]
├── 기본 역할 정의 (고정)
├── 작성 원칙 (고정)
└── 검증된 패턴 적용 지침 (동적)
    ├── [필수] HIGH 패턴 (반드시 적용)
    ├── [권장] MEDIUM 패턴 (가능하면 적용)
    └── [실험] LOW 패턴 (선택적 적용)

[사용자 프롬프트]
├── 주제/카테고리/타겟 (입력)
└── 요구사항 (고정)
```

### 4.2 생성 예시

```python
# HIGH 패턴 2개, MEDIUM 패턴 3개 적용 시
system_prompt = '''
당신은 의학 전문가이자 건강 콘텐츠 작가입니다.
...

## 검증된 콘텐츠 패턴

### [필수] 검증 완료 패턴
- **질문형 도입부**: 도입부를 독자의 고민을 담은 질문으로 시작하세요
- **숫자 강조 제목**: 제목에 구체적인 숫자를 포함하세요

### [권장] 높은 승률 패턴
- **결론 먼저 제시**: 핵심 결론을 본문 초반에 제시하세요
- **FAQ 5개**: 자주 묻는 질문을 5개 이상 포함하세요
- **출처 명시**: 신뢰할 수 있는 출처를 본문에 명시하세요
'''
```

---

## 5. SPEC-003 연동

### 5.1 content_analyzer/main.py에 추가

```python
from prompt_updater import update_prompt_if_needed

# analyze_completed_tests 함수 끝에 추가
try:
    update_result = update_prompt_if_needed(conn)
    print(f"[Analyzer] 프롬프트 업데이트: {update_result}")
except Exception as e:
    print(f"[Analyzer] 프롬프트 업데이트 실패: {e}")
```

---

## 6. 구현 상태

- [x] `prompt_updater.py` 모듈 작성
- [x] 트리거 조건 로직 구현
- [x] 패턴 지침 생성 함수
- [x] 프롬프트 버전 관리 로직
- [x] SPEC-003 main.py에 연동 ✅ (2024-12-24 완료)
- [x] DB 마이그레이션 (prompt_versions 테이블) ✅ (2024-12-23 완료)
- [x] Cloud Run 배포 ✅ (2024-12-24 완료)

---

## 7. 완료 조건

- [x] `prompt_updater.py` 모듈 구현
- [x] SPEC-003 (content_analyzer)에 연동 ✅ (2024-12-24 완료)
- [x] Cloud Run 배포 ✅ (2024-12-24 완료)
- [ ] 새 프롬프트 버전 생성 확인

---

## 8. 다음 단계

SPEC-004 완료 후:
- **SPEC-005**: Notion 리포트 (분석 결과 자동 전송)

---

**문서 버전**: 1.2
**최종 수정**: 2024-12-22
**작성자**: R2-D2
