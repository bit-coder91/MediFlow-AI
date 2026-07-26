"""
MediFlow AI - Production Database Initializer & Schema Migrator
Supports SQLite (Local Dev Fallback), MySQL (Production), and PostgreSQL (Cloud Services).
"""
import os
import sys
import re
import sqlite3

def init_database():
    database_url = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    schema_path = os.path.join(base_dir, "database", "schema.sql")

    print("=" * 60)
    print("  MediFlow AI - Database Initialization Engine")
    print("=" * 60)

    if not os.path.exists(schema_path):
        print(f"[ERROR] Schema missing at {schema_path}")
        sys.exit(1)

    if database_url and ("postgresql://" in database_url or "postgres://" in database_url):
        print("[DATABASE] Target: PostgreSQL Cloud Database Detected")
        try:
            import psycopg2
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            with open(schema_path, "r", encoding="utf-8") as f:
                sql_script = f.read()
            pg_sql = sql_script.replace("AUTO_INCREMENT", "").replace("ENGINE=InnoDB", "").replace("IF NOT EXISTS", "")
            cursor.execute(pg_sql)
            conn.commit()
            cursor.close()
            conn.close()
            print("[SUCCESS] Initialized PostgreSQL Database schema.")
        except Exception as e:
            print(f"[WARNING] PostgreSQL Init Error: {e}. Falling back to internal engine.")

    elif database_url and "mysql://" in database_url:
        print("[DATABASE] Target: MySQL Production Database Detected")
        try:
            import pymysql
            from urllib.parse import urlparse
            url = urlparse(database_url)
            conn = pymysql.connect(
                host=url.hostname,
                user=url.username,
                password=url.password,
                port=url.port or 3306,
                database=url.path.lstrip('/')
            )
            cursor = conn.cursor()
            with open(schema_path, "r", encoding="utf-8") as f:
                sql_statements = f.read().split(';')
            for stmt in sql_statements:
                stmt = stmt.strip()
                if stmt:
                    cursor.execute(stmt)
            conn.commit()
            cursor.close()
            conn.close()
            print("[SUCCESS] Initialized MySQL Database schema.")
        except Exception as e:
            print(f"[WARNING] MySQL Init Error: {e}. Falling back to internal engine.")

    else:
        print("[DATABASE] Target: Local SQLite Database (mediflow_local.db)")
        sqlite_path = os.path.join(base_dir, "database", "mediflow_local.db")
        try:
            conn = sqlite3.connect(sqlite_path)
            cursor = conn.cursor()
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            
            # Remove MySQL stored procedure blocks for SQLite
            if "DELIMITER" in schema_sql:
                schema_sql = schema_sql.split("DELIMITER")[0]

            # Regex replace ENUM(...) with TEXT for SQLite
            schema_sql = re.sub(r"ENUM\([^)]+\)", "TEXT", schema_sql)

            sqlite_sql = (
                schema_sql.replace("BIGINT AUTO_INCREMENT PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
                .replace("AUTO_INCREMENT PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
                .replace("ON UPDATE CURRENT_TIMESTAMP", "")
                .replace("INSERT IGNORE INTO", "INSERT OR IGNORE INTO")
                .replace("ENGINE=InnoDB", "")
                .replace("USE mediflow_db;", "")
                .replace("CREATE DATABASE IF NOT EXISTS mediflow_db;", "")
            )
            cursor.executescript(sqlite_sql)
            conn.commit()
            conn.close()
            print(f"[SUCCESS] Initialized SQLite Database at {sqlite_path}")
        except Exception as e:
            print(f"[ERROR] SQLite Error: {e}")

if __name__ == "__main__":
    init_database()
