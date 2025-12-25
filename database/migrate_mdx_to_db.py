#!/usr/bin/env python3
"""
MDX 파일을 PostgreSQL DB로 마이그레이션
- frontmatter → 메타데이터 컬럼
- 본문 → sections JSONB (섹션별 구조화)
"""

import re
import json
import uuid
from pathlib import Path
from datetime import datetime
import psycopg2
import yaml

# DB 연결 정보
DB_CONFIG = {
    "host": "34.64.111.186",
    "port": 5432,
    "user": "admin",
    "password": "galddae-password",
    "database": "factcheck_db"
}

# MDX 파일 경로
MDX_DIR = Path(__file__).parent.parent / "src" / "content" / "articles"


def parse_mdx(file_path: Path) -> dict:
    """MDX 파일을 파싱하여 frontmatter와 본문 분리"""
    content = file_path.read_text(encoding="utf-8")

    # frontmatter 추출 (--- 사이의 YAML)
    frontmatter_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)

    if not frontmatter_match:
        raise ValueError(f"No frontmatter found in {file_path}")

    frontmatter_yaml = frontmatter_match.group(1)
    frontmatter = yaml.safe_load(frontmatter_yaml)

    # 본문 추출
    body = content[frontmatter_match.end():]

    return {
        "frontmatter": frontmatter,
        "body": body.strip(),
        "slug": file_path.stem  # 파일명에서 .mdx 제거
    }


def parse_body_to_sections(body: str) -> list:
    """
    마크다운 본문을 섹션별로 구조화

    섹션 타입:
    - intro: 첫 번째 ## 전까지의 내용
    - main: ## 헤딩 섹션
    - faq: ### 로 시작하는 Q&A 섹션
    - conclusion: 결론 섹션
    """
    sections = []

    # ## 기준으로 분리
    parts = re.split(r'\n(?=## )', body)

    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue

        # 첫 번째 파트 (## 없이 시작하면 intro)
        if i == 0 and not part.startswith('## '):
            sections.append({
                "type": "intro",
                "heading": None,
                "content": part
            })
            continue

        # ## 헤딩 파싱
        heading_match = re.match(r'^## (.+?)(?:\n|$)', part)
        if not heading_match:
            continue

        heading = heading_match.group(1).strip()
        content = part[heading_match.end():].strip()

        # FAQ 섹션 감지 (### 가 여러 개 있으면)
        faq_items = re.findall(r'### (.+?)\n\n(.+?)(?=\n### |\n## |$)', content, re.DOTALL)

        if faq_items and len(faq_items) >= 2:
            sections.append({
                "type": "faq",
                "heading": heading,
                "items": [
                    {"q": q.strip(), "a": a.strip()}
                    for q, a in faq_items
                ]
            })
        elif "결론" in heading or "요약" in heading:
            sections.append({
                "type": "conclusion",
                "heading": heading,
                "content": content
            })
        elif "핵심" in heading and "요약" in heading:
            # 핵심 요약은 bullet points로 파싱
            bullets = re.findall(r'^- (.+)$', content, re.MULTILINE)
            sections.append({
                "type": "summary",
                "heading": heading,
                "items": bullets if bullets else [content]
            })
        else:
            sections.append({
                "type": "main",
                "heading": heading,
                "content": content
            })

    return sections


def migrate_article(cursor, parsed: dict) -> str:
    """단일 글을 DB에 삽입"""
    fm = parsed["frontmatter"]
    sections = parse_body_to_sections(parsed["body"])

    article_id = str(uuid.uuid4())

    # 날짜 파싱
    published_at = None
    if fm.get("publishedAt"):
        try:
            published_at = datetime.strptime(fm["publishedAt"], "%Y-%m-%d")
        except:
            pass

    reviewed_at = None
    if fm.get("reviewedAt"):
        try:
            reviewed_at = datetime.strptime(fm["reviewedAt"], "%Y-%m-%d")
        except:
            pass

    # INSERT
    cursor.execute("""
        INSERT INTO articles (
            id, slug, version, is_active,
            title, description, author, category, tags,
            meta_title, meta_description,
            sections,
            sources, medical_reviewer, reviewed_at,
            image_url, image_alt,
            status, ai_model, prompt_version,
            published_at
        ) VALUES (
            %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s,
            %s,
            %s, %s, %s,
            %s, %s,
            %s, %s, %s,
            %s
        )
    """, (
        article_id,
        parsed["slug"],
        "A",  # 기본 버전
        True,
        fm.get("title"),
        fm.get("description"),
        fm.get("author", "36.5 의학팀"),
        fm.get("category", "health-info"),
        fm.get("tags", []),
        fm.get("metaTitle"),
        fm.get("metaDescription"),
        json.dumps(sections, ensure_ascii=False),
        fm.get("sources", []),
        fm.get("medicalReviewer"),
        reviewed_at,
        fm.get("image"),
        fm.get("imageAlt"),
        "published",  # 기존 글은 published 상태
        "manual",  # 수동 마이그레이션
        "v0-mdx-import",
        published_at
    ))

    return article_id


def main():
    """메인 마이그레이션 실행"""
    print("🚀 MDX → DB 마이그레이션 시작")
    print(f"📂 소스: {MDX_DIR}")

    # MDX 파일 목록
    mdx_files = list(MDX_DIR.glob("*.mdx"))
    print(f"📄 발견된 파일: {len(mdx_files)}개")

    # DB 연결
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cursor = conn.cursor()

    print(f"✅ DB 연결 성공: {DB_CONFIG['database']}")

    # 기존 데이터 확인
    cursor.execute("SELECT COUNT(*) FROM articles")
    existing_count = cursor.fetchone()[0]
    print(f"📊 기존 글 수: {existing_count}")

    success_count = 0
    error_count = 0

    for mdx_file in mdx_files:
        try:
            # sample-article은 스킵
            if mdx_file.stem == "sample-article":
                print(f"⏭️  {mdx_file.name} (샘플 스킵)")
                continue

            parsed = parse_mdx(mdx_file)

            # 중복 체크
            cursor.execute("SELECT id FROM articles WHERE slug = %s AND version = 'A'", (parsed["slug"],))
            if cursor.fetchone():
                print(f"⏭️  {mdx_file.name} (이미 존재)")
                continue

            article_id = migrate_article(cursor, parsed)
            success_count += 1

            sections_count = len(parse_body_to_sections(parsed["body"]))
            print(f"✅ {mdx_file.name} → {parsed['slug']} ({sections_count}개 섹션)")

        except Exception as e:
            error_count += 1
            print(f"❌ {mdx_file.name}: {e}")

    # 결과 출력
    cursor.execute("SELECT COUNT(*) FROM articles")
    final_count = cursor.fetchone()[0]

    print("\n" + "=" * 50)
    print(f"✅ 성공: {success_count}개")
    print(f"❌ 실패: {error_count}개")
    print(f"📊 총 글 수: {final_count}개")

    # 마이그레이션된 글 목록 출력
    cursor.execute("""
        SELECT slug, title, category, array_length(tags, 1) as tag_count,
               jsonb_array_length(sections) as section_count
        FROM articles
        ORDER BY created_at DESC
    """)

    print("\n📋 마이그레이션된 글:")
    print("-" * 80)
    for row in cursor.fetchall():
        print(f"  {row[0]}")
        print(f"    제목: {row[1][:40]}...")
        print(f"    카테고리: {row[2]} | 태그: {row[3]}개 | 섹션: {row[4]}개")
        print()

    cursor.close()
    conn.close()

    print("🎉 마이그레이션 완료!")


if __name__ == "__main__":
    main()
