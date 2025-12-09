"""
ETL Script: Load H-1B CSV data into PostgreSQL
Loads employers, occupations, worksite_locations, and applications tables
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from pathlib import Path
import os
from dotenv import load_dotenv
import argparse
from datetime import datetime

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT', 5432),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )

class H1BDataLoader:
    def __init__(self, data_dir='../data/avery'):
        self.data_dir = Path(data_dir)
        self.conn = get_db_connection()
        self.cur = self.conn.cursor()

    def load_csv_files(self, years=None):
        """Load CSV files for specified years"""
        if years:
            # Load specific years
            files = []
            for year in years:
                year_files = list(self.data_dir.glob(f'cleaned_*{year}*.csv'))
                files.extend(year_files)
        else:
            # Load all cleaned files (except combined.csv)
            files = [f for f in self.data_dir.glob('cleaned_*.csv') if f.name != 'combined.csv']

        print(f"Found {len(files)} CSV files to load")

        dfs = []
        for file in sorted(files):
            print(f"  Reading {file.name}...", end='')
            df = pd.read_csv(file, low_memory=False)

            # Standardize column names (handle different naming conventions)
            df = self.standardize_column_names(df)

            dfs.append(df)
            print(f" ✓ ({len(df):,} rows)")

        df = pd.concat(dfs, ignore_index=True)
        print(f"\nTotal records: {len(df):,}")
        return df

    def standardize_column_names(self, df):
        """Standardize column names across different CSV formats"""
        rename_map = {
            'case_number': 'app_id',
            'employer_fein': 'emp_id',
            'employer_name': 'emp_name',
            'employer_city': 'emp_city',
            'employer_state': 'emp_state',
            'employer_zip': 'emp_zip',
            'full_time_position': 'full_time'
        }

        df = df.rename(columns=rename_map)
        return df

    def standardize_wages(self, df):
        """Standardize all wages to annual"""
        print("Standardizing wages to annual...")

        wage_multipliers = {
            'Hour': 2080,
            'Week': 52,
            'Bi-Weekly': 26,
            'Month': 12,
            'Year': 1
        }

        df['wage_offer'] = pd.to_numeric(df['wage_offer'], errors='coerce')
        df['annual_wage'] = df.apply(
            lambda row: row['wage_offer'] * wage_multipliers.get(row['wage_unit'], 1)
            if pd.notna(row['wage_offer']) else None,
            axis=1
        )

        return df

    def load_occupations(self, df):
        """Load unique occupations into occupations table"""
        print("\n=== Loading Occupations ===")

        # Get unique SOC codes
        occupations = df[['soc_code', 'soc_title', 'major_group']].drop_duplicates()
        occupations = occupations[occupations['soc_code'].notna()]

        print(f"Found {len(occupations)} unique occupations")

        insert_query = """
            INSERT INTO occupations (soc_code, soc_title, major_group)
            VALUES (%s, %s, %s)
            ON CONFLICT (soc_code) DO UPDATE
            SET soc_title = EXCLUDED.soc_title,
                major_group = EXCLUDED.major_group
        """

        data = [
            (row['soc_code'], row['soc_title'], row['major_group'])
            for _, row in occupations.iterrows()
        ]

        execute_batch(self.cur, insert_query, data, page_size=1000)
        self.conn.commit()
        print(f"✅ Loaded {len(data)} occupations")

    def load_employers(self, df):
        """Load unique employers into employers table"""
        print("\n=== Loading Employers ===")

        # Get unique employers
        employers = df[[
            'emp_id', 'emp_name', 'industry',
            'employer_address', 'emp_city', 'emp_state', 'emp_zip'
        ]].drop_duplicates(subset=['emp_id'])

        employers = employers[employers['emp_id'].notna()]

        print(f"Found {len(employers)} unique employers")

        insert_query = """
            INSERT INTO employers (
                emp_id, emp_name, industry,
                emp_address, emp_city, emp_state, emp_zip
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (emp_id) DO UPDATE
            SET emp_name = EXCLUDED.emp_name,
                industry = EXCLUDED.industry,
                emp_address = EXCLUDED.emp_address,
                emp_city = EXCLUDED.emp_city,
                emp_state = EXCLUDED.emp_state,
                emp_zip = EXCLUDED.emp_zip
        """

        data = [
            (
                row['emp_id'],
                row['emp_name'],
                str(row['industry']) if pd.notna(row['industry']) else None,
                row['employer_address'] if pd.notna(row['employer_address']) else None,
                row['emp_city'] if pd.notna(row['emp_city']) else None,
                row['emp_state'] if pd.notna(row['emp_state']) else None,
                row['emp_zip'] if pd.notna(row['emp_zip']) else None
            )
            for _, row in employers.iterrows()
        ]

        execute_batch(self.cur, insert_query, data, page_size=1000)
        self.conn.commit()
        print(f"✅ Loaded {len(data)} employers")

    def load_worksite_locations(self, df):
        """Load unique worksite locations"""
        print("\n=== Loading Worksite Locations ===")

        # Get unique worksites
        worksites = df[['worksite_city', 'worksite_state', 'worksite_zip']].drop_duplicates()
        worksites = worksites.dropna(subset=['worksite_state'])

        print(f"Found {len(worksites)} unique worksites")

        insert_query = """
            INSERT INTO worksite_locations (worksite_city, worksite_state, worksite_zip)
            VALUES (%s, %s, %s)
            ON CONFLICT (worksite_city, worksite_state, worksite_zip) DO NOTHING
            RETURNING site_id
        """

        for _, row in worksites.iterrows():
            self.cur.execute(insert_query, (
                row['worksite_city'] if pd.notna(row['worksite_city']) else None,
                row['worksite_state'],
                row['worksite_zip'] if pd.notna(row['worksite_zip']) else None
            ))

        self.conn.commit()
        print(f"✅ Loaded worksite locations")

    def get_site_id(self, city, state, zip_code):
        """Get site_id for a worksite location"""
        query = """
            SELECT site_id FROM worksite_locations
            WHERE
                (worksite_city = %s OR (worksite_city IS NULL AND %s IS NULL))
                AND worksite_state = %s
                AND (worksite_zip = %s OR (worksite_zip IS NULL AND %s IS NULL))
        """
        self.cur.execute(query, (city, city, state, zip_code, zip_code))
        result = self.cur.fetchone()
        return result[0] if result else None

    def load_applications(self, df):
        """Load applications into applications table"""
        print("\n=== Loading Applications ===")
        print(f"Total applications to load: {len(df):,}")

        # Create site_id mapping
        print("Creating site_id mapping...")
        df['site_id'] = df.apply(
            lambda row: self.get_site_id(
                row['worksite_city'] if pd.notna(row['worksite_city']) else None,
                row['worksite_state'] if pd.notna(row['worksite_state']) else None,
                row['worksite_zip'] if pd.notna(row['worksite_zip']) else None
            ) if pd.notna(row['worksite_state']) else None,
            axis=1
        )

        insert_query = """
            INSERT INTO applications (
                app_id, emp_id, soc_code, site_id,
                case_status, decision_date, received_date, fiscal_year, visa_class,
                job_title, full_time, begin_date, end_date,
                wage_offer, wage_unit, annual_wage
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (app_id) DO NOTHING
        """

        # Process in batches
        batch_size = 5000
        total_loaded = 0

        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i+batch_size]

            data = []
            for _, row in batch.iterrows():
                # Skip if missing required fields
                if pd.isna(row['app_id']) or pd.isna(row['emp_id']) or pd.isna(row['soc_code']):
                    continue

                data.append((
                    row['app_id'],
                    row['emp_id'],
                    row['soc_code'],
                    int(row['site_id']) if pd.notna(row['site_id']) else None,
                    row['case_status'] if pd.notna(row['case_status']) else 'Certified',
                    pd.to_datetime(row['decision_date']).date() if pd.notna(row['decision_date']) else None,
                    pd.to_datetime(row['received_date']).date() if pd.notna(row['received_date']) else None,
                    int(row['fiscal_year']) if pd.notna(row['fiscal_year']) else None,
                    row['visa_class'] if pd.notna(row['visa_class']) else 'H-1B',
                    row['job_title'] if pd.notna(row['job_title']) else None,
                    row['full_time'] == 'Y' if pd.notna(row['full_time']) else True,
                    pd.to_datetime(row['begin_date']).date() if pd.notna(row['begin_date']) else None,
                    pd.to_datetime(row['end_date']).date() if pd.notna(row['end_date']) else None,
                    float(row['wage_offer']) if pd.notna(row['wage_offer']) else None,
                    row['wage_unit'] if pd.notna(row['wage_unit']) else None,
                    float(row['annual_wage']) if pd.notna(row['annual_wage']) else None
                ))

            execute_batch(self.cur, insert_query, data, page_size=1000)
            self.conn.commit()

            total_loaded += len(data)
            print(f"  Loaded batch {i//batch_size + 1}: {total_loaded:,}/{len(df):,} ({total_loaded/len(df)*100:.1f}%)")

        print(f"✅ Loaded {total_loaded:,} applications")

    def refresh_materialized_views(self):
        """Refresh materialized views for fast queries"""
        print("\n=== Refreshing Materialized Views ===")

        views = ['mv_industry_metrics', 'mv_state_metrics', 'mv_occupation_metrics']

        for view in views:
            print(f"  Refreshing {view}...", end='')
            self.cur.execute(f"REFRESH MATERIALIZED VIEW {view}")
            self.conn.commit()
            print(" ✓")

        print("✅ All views refreshed")

    def verify_data(self):
        """Verify loaded data"""
        print("\n=== Verifying Data ===")

        tables = [
            ('occupations', 'soc_code'),
            ('employers', 'emp_id'),
            ('worksite_locations', 'site_id'),
            ('applications', 'app_id')
        ]

        for table, pk in tables:
            self.cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = self.cur.fetchone()[0]
            print(f"  {table}: {count:,} records")

    def close(self):
        """Close database connection"""
        self.cur.close()
        self.conn.close()

def main():
    parser = argparse.ArgumentParser(description='Load H-1B data into PostgreSQL')
    parser.add_argument('--years', nargs='+', type=int, help='Years to load (e.g., 2022 2023 2024)')
    parser.add_argument('--all', action='store_true', help='Load all available data')
    args = parser.parse_args()

    print("="*70)
    print("H1-B DATA LOADER")
    print("="*70)

    loader = H1BDataLoader()

    try:
        # Load CSV data
        df = loader.load_csv_files(years=args.years if not args.all else None)

        # Standardize wages
        df = loader.standardize_wages(df)

        # Load into database
        loader.load_occupations(df)
        loader.load_employers(df)
        loader.load_worksite_locations(df)
        loader.load_applications(df)

        # Refresh views
        loader.refresh_materialized_views()

        # Verify
        loader.verify_data()

        print("\n" + "="*70)
        print("✅ DATA LOAD COMPLETE!")
        print("="*70)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        loader.close()

if __name__ == "__main__":
    main()
