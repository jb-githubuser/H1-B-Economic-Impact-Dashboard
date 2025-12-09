"""
Load NAICS lookup table into PostgreSQL database
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create database connection from environment variables"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT', 5432),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )

def load_naics_lookup():
    """Load NAICS lookup data from CSV into database"""
    print("Loading NAICS lookup table...")

    # Read NAICS lookup CSV
    naics_file = Path('../analysis/naics_lookup.csv')
    if not naics_file.exists():
        print(f"Error: {naics_file} not found!")
        return

    df = pd.read_csv(naics_file)
    print(f"Loaded {len(df)} NAICS codes from CSV")

    # Connect to database
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Clear existing data
        cur.execute("DELETE FROM naics_lookup")
        print("Cleared existing NAICS data")

        # Prepare insert query
        insert_query = """
            INSERT INTO naics_lookup (naics_code, industry_name, sector, industry_category)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (naics_code) DO UPDATE
            SET industry_name = EXCLUDED.industry_name,
                sector = EXCLUDED.sector,
                industry_category = EXCLUDED.industry_category
        """

        # Convert DataFrame to list of tuples
        data = [
            (
                str(row['naics_code']),
                row['industry_name'],
                row['sector'],
                row['industry_category']
            )
            for _, row in df.iterrows()
        ]

        # Batch insert
        execute_batch(cur, insert_query, data, page_size=1000)

        # Commit transaction
        conn.commit()
        print(f"✅ Successfully loaded {len(data)} NAICS codes into database")

        # Verify
        cur.execute("SELECT COUNT(*) FROM naics_lookup")
        count = cur.fetchone()[0]
        print(f"Total NAICS codes in database: {count}")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    load_naics_lookup()
