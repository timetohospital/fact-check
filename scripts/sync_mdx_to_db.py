#!/usr/bin/env python3
"""
MDX 파일 콘텐츠를 DB articles 테이블의 sections 필드로 동기화

실험용 글의 placeholder를 실제 콘텐츠로 업데이트
"""

import os
import re
import json
import psycopg2
from pathlib import Path

DB_CONFIG = {
    "host": "34.64.111.186",
    "port": 5432,
    "user": "admin",
    "password": "galddae-password",
    "database": "factcheck_db"
}

# 실험 글 슬러그 목록
EXPERIMENT_SLUGS = [
    "olive-oil-cancer-myth",
    "pre-washed-salad-danger",
    "spicy-food-dementia",
    "morning-coffee-heart-attack",
    "mouth-taping-tiktok-trend",
    "bone-smashing-dangerous",
    "8-glasses-water-myth",
    "egg-yolk-cholesterol-myth",
    "intermittent-fasting-death-risk",
    "farmed-salmon-carcinogen"
]

MDX_DIR = Path(__file__).parent.parent / "src" / "content" / "articles"


def parse_mdx_file(file_path: Path) -> dict:
    """MDX 파일을 파싱하여 frontmatter와 content 분리"""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # frontmatter 분리 (--- 사이)
    parts = content.split("---", 2)
    if len(parts) >= 3:
        frontmatter_str = parts[1].strip()
        body = parts[2].strip()
    else:
        frontmatter_str = ""
        body = content

    # frontmatter에서 필요한 정보 추출
    frontmatter = {}

    # title 추출
    title_match = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', frontmatter_str, re.MULTILINE)
    if title_match:
        frontmatter["title"] = title_match.group(1).strip('"\'')

    # description 추출
    desc_match = re.search(r'^description:\s*["\']?(.+?)["\']?\s*$', frontmatter_str, re.MULTILINE)
    if desc_match:
        frontmatter["description"] = desc_match.group(1).strip('"\'')

    # metaTitle 추출
    meta_title_match = re.search(r'^metaTitle:\s*["\']?(.+?)["\']?\s*$', frontmatter_str, re.MULTILINE)
    if meta_title_match:
        frontmatter["meta_title"] = meta_title_match.group(1).strip('"\'')

    # metaDescription 추출
    meta_desc_match = re.search(r'^metaDescription:\s*["\']?(.+?)["\']?\s*$', frontmatter_str, re.MULTILINE)
    if meta_desc_match:
        frontmatter["meta_description"] = meta_desc_match.group(1).strip('"\'')

    # sources 추출
    sources_match = re.search(r'^sources:\s*\n((?:\s+-\s+.+\n?)+)', frontmatter_str, re.MULTILINE)
    if sources_match:
        sources_text = sources_match.group(1)
        sources = []
        for line in sources_text.split("\n"):
            line = line.strip()
            if line.startswith("- "):
                source = line[2:].strip().strip('"\'')
                if source:
                    sources.append(source)
        frontmatter["sources"] = sources

    # medicalReviewer 추출
    reviewer_match = re.search(r'^medicalReviewer:\s*["\']?(.+?)["\']?\s*$', frontmatter_str, re.MULTILINE)
    if reviewer_match:
        frontmatter["medical_reviewer"] = reviewer_match.group(1).strip('"\'')

    return {
        "frontmatter": frontmatter,
        "body": body
    }


def body_to_sections(body: str) -> list:
    """마크다운 본문을 섹션 구조로 변환"""
    sections = []

    # ## 헤딩으로 분할
    parts = re.split(r'^## (.+)$', body, flags=re.MULTILINE)

    # 첫 부분은 intro (헤딩 없음)
    if parts[0].strip():
        sections.append({
            "type": "intro",
            "heading": None,
            "content": parts[0].strip()
        })

    # 나머지는 헤딩 + 콘텐츠 쌍
    for i in range(1, len(parts), 2):
        if i + 1 < len(parts):
            heading = parts[i].strip()
            content = parts[i + 1].strip()

            # FAQ 섹션 특별 처리
            if "질문" in heading.lower() or "faq" in heading.lower():
                section_type = "faq"
            elif "결론" in heading.lower() or "요약" in heading.lower():
                section_type = "conclusion"
            elif "근거" in heading.lower() or "연구" in heading.lower() or "증거" in heading.lower():
                section_type = "evidence"
            else:
                section_type = "body"

            sections.append({
                "type": section_type,
                "heading": heading,
                "content": content
            })

    return sections


def sync_mdx_to_db():
    """MDX 파일들을 DB로 동기화"""
    print("🚀 MDX → DB 동기화 시작")

    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        updated_count = 0

        for slug in EXPERIMENT_SLUGS:
            mdx_path = MDX_DIR / f"{slug}.mdx"

            if not mdx_path.exists():
                print(f"   ⚠️ {slug}: MDX 파일 없음")
                continue

            # MDX 파싱
            parsed = parse_mdx_file(mdx_path)
            frontmatter = parsed["frontmatter"]
            sections = body_to_sections(parsed["body"])

            # DB 업데이트
            cursor.execute("""
                UPDATE articles SET
                    title = COALESCE(%s, title),
                    description = COALESCE(%s, description),
                    meta_title = COALESCE(%s, meta_title),
                    meta_description = COALESCE(%s, meta_description),
                    sections = %s,
                    sources = COALESCE(%s, sources),
                    medical_reviewer = COALESCE(%s, medical_reviewer),
                    updated_at = NOW()
                WHERE slug = %s AND version = 'A'
            """, (
                frontmatter.get("title"),
                frontmatter.get("description"),
                frontmatter.get("meta_title"),
                frontmatter.get("meta_description"),
                json.dumps(sections, ensure_ascii=False),
                frontmatter.get("sources"),
                frontmatter.get("medical_reviewer"),
                slug
            ))

            if cursor.rowcount > 0:
                print(f"   ✅ {slug}: 업데이트 완료 ({len(sections)}개 섹션)")
                updated_count += 1
            else:
                print(f"   ⚠️ {slug}: DB에 글 없음")

        conn.commit()

        print(f"\n✅ 동기화 완료: {updated_count}/{len(EXPERIMENT_SLUGS)}개 글 업데이트")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ 오류 발생: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    sync_mdx_to_db()
