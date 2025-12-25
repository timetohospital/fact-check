#!/usr/bin/env python3
"""Cloud SQL에 마이그레이션 실행"""

import psycopg2
from pathlib import Path

# DB 연결 정보
DB_CONFIG = {
    "host": "34.64.111.186",
    "port": 5432,
    "user": "admin",
    "password": "galddae-password",
    "database": "factcheck_db"
}

def run_migration():
    """마이그레이션 SQL 실행"""
    sql_file = Path(__file__).parent / "migrations" / "001_initial_schema.sql"

    print(f"📂 SQL 파일: {sql_file}")
    print(f"🔌 접속 중: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()

        print("✅ 연결 성공!")

        # SQL 파일 읽기
        sql_content = sql_file.read_text(encoding="utf-8")

        # 실행
        print("⚙️  스키마 생성 중...")
        cursor.execute(sql_content)

        print("✅ 마이그레이션 완료!")

        # 생성된 테이블 확인
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = cursor.fetchall()

        print("\n📋 생성된 테이블:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
            count = cursor.fetchone()[0]
            print(f"   - {table[0]} ({count} rows)")

        # 뷰 확인
        cursor.execute("""
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        views = cursor.fetchall()

        print("\n📊 생성된 뷰:")
        for view in views:
            print(f"   - {view[0]}")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

if __name__ == "__main__":
    run_migration()
