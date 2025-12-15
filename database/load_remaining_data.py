"""
Load remaining H-1B data (2015-2023) year by year with progress tracking
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from pathlib import Path
import os
from dotenv import load_dotenv
import time

# Load from parent .env file
load_dotenv(Path(__file__).parent.parent / '.env')

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT', 5432),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )

class YearByYearLoader:
    def __init__(self, data_dir='../data/avery'):
        self.data_dir = Path(data_dir)
        self.conn = get_db_connection()
        self.cur = self.conn.cursor()

    def get_loaded_years(self):
        """Check which years are already loaded"""
        self.cur.execute("""
            SELECT fiscal_year, COUNT(*)
            FROM applications
            GROUP BY fiscal_year
            ORDER BY fiscal_year
        """)
        return {row[0]: row[1] for row in self.cur.fetchall()}

    def find_files_for_year(self, year):
        """Find all CSV files for a specific year"""
        patterns = [
            f'cleaned_*h1b{year % 100}*.csv',  # e.g., h1b15, h1b22
            f'cleaned_h1b_{year}.csv',          # e.g., cleaned_h1b_2015.csv
            f'cleaned_*{year}q*.csv',           # e.g., 2022q1, 2022q2
        ]

        files = []
        for pattern in patterns:
            files.extend(self.data_dir.glob(pattern))

        # Remove duplicates
        return list(set(files))

    def standardize_columns(self, df):
        """Standardize column names"""
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

        # Add missing columns
        defaults = {
            'emp_id': lambda x: str(hash(x['emp_name']))[:15] if pd.notna(x.get('emp_name')) else None,
            'worksite_city': lambda x: x.get('emp_city'),
            'worksite_state': lambda x: x.get('emp_state'),
            'worksite_zip': lambda x: x.get('emp_zip'),
            'wage_unit': 'Year',
            'visa_class': 'H-1B',
            'full_time': 'Y',
            'employer_address': None,
            'industry': None  # Not available in all years
        }

        for col, default in defaults.items():
            if col not in df.columns:
                if callable(default):
                    df[col] = df.apply(default, axis=1)
                else:
                    df[col] = default

        # Normalize case_status
        if 'case_status' in df.columns:
            df['case_status'] = df['case_status'].str.title()

        return df

    def standardize_wages(self, df):
        """Convert all wages to annual"""
        wage_multipliers = {
            'Hour': 2080, 'Week': 52, 'Bi-Weekly': 26, 'Month': 12, 'Year': 1
        }

        # Handle missing wage_offer column - some years don't have wage data
        if 'wage_offer' not in df.columns:
            print("  ⚠️  No wage_offer column found, setting to None")
            df['wage_offer'] = None
            df['annual_wage'] = None
        else:
            df['wage_offer'] = pd.to_numeric(df['wage_offer'], errors='coerce')
            df['annual_wage'] = df.apply(
                lambda row: row['wage_offer'] * wage_multipliers.get(row.get('wage_unit', 'Year'), 1)
                if pd.notna(row.get('wage_offer')) else None, axis=1
            )
        return df

    def load_dimension_tables(self, df):
        """Load occupations, employers, and worksites"""
        print("  Loading occupations...", end='')
        occupations = df[['soc_code', 'soc_title', 'major_group']].drop_duplicates()
        occupations = occupations[occupations['soc_code'].notna()]

        insert_query = """
            INSERT INTO occupations (soc_code, soc_title, major_group)
            VALUES (%s, %s, %s)
            ON CONFLICT (soc_code) DO UPDATE
            SET soc_title = EXCLUDED.soc_title, major_group = EXCLUDED.major_group
        """
        data = [(row['soc_code'], row['soc_title'], row['major_group'])
                for _, row in occupations.iterrows()]
        execute_batch(self.cur, insert_query, data, page_size=1000)
        self.conn.commit()
        print(f" {len(data):,} ✓")

        print("  Loading employers...", end='')
        employers = df[['emp_id', 'emp_name', 'industry', 'employer_address',
                       'emp_city', 'emp_state', 'emp_zip']].drop_duplicates(subset=['emp_id'])
        employers = employers[employers['emp_id'].notna()]

        insert_query = """
            INSERT INTO employers (emp_id, emp_name, industry, emp_address, emp_city, emp_state, emp_zip)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (emp_id) DO UPDATE
            SET emp_name = EXCLUDED.emp_name, industry = EXCLUDED.industry
        """
        data = [
            (row['emp_id'], row['emp_name'],
             str(row['industry']) if pd.notna(row['industry']) else None,
             row['employer_address'] if pd.notna(row['employer_address']) else None,
             row['emp_city'] if pd.notna(row['emp_city']) else None,
             row['emp_state'] if pd.notna(row['emp_state']) else None,
             row['emp_zip'] if pd.notna(row['emp_zip']) else None)
            for _, row in employers.iterrows()
        ]
        execute_batch(self.cur, insert_query, data, page_size=1000)
        self.conn.commit()
        print(f" {len(data):,} ✓")

        print("  Loading worksites...", end='')
        worksites = df[['worksite_city', 'worksite_state', 'worksite_zip']].drop_duplicates()
        worksites = worksites.dropna(subset=['worksite_state'])

        insert_query = """
            INSERT INTO worksite_locations (worksite_city, worksite_state, worksite_zip)
            VALUES (%s, %s, %s)
            ON CONFLICT (worksite_city, worksite_state, worksite_zip) DO NOTHING
        """
        data = [
            (row['worksite_city'] if pd.notna(row['worksite_city']) else None,
             row['worksite_state'],
             row['worksite_zip'] if pd.notna(row['worksite_zip']) else None)
            for _, row in worksites.iterrows()
        ]
        execute_batch(self.cur, insert_query, data, page_size=1000)
        self.conn.commit()
        print(f" {len(data):,} ✓")

    def get_site_mapping(self):
        """Get site_id mapping"""
        print("  Building site_id mapping...", end='')
        self.cur.execute("""
            SELECT site_id, worksite_city, worksite_state, worksite_zip
            FROM worksite_locations
        """)
        site_map = {}
        for site_id, city, state, zip_code in self.cur.fetchall():
            site_map[(city, state, zip_code)] = site_id
        print(f" {len(site_map):,} ✓")
        return site_map

    def load_applications(self, df, site_map):
        """Load applications in batches"""
        print("  Loading applications...")

        # Map site_ids
        df['site_id'] = df.apply(
            lambda row: site_map.get((
                row['worksite_city'] if pd.notna(row['worksite_city']) else None,
                row['worksite_state'] if pd.notna(row['worksite_state']) else None,
                row['worksite_zip'] if pd.notna(row['worksite_zip']) else None
            )), axis=1
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

        batch_size = 5000
        total_loaded = 0

        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i+batch_size]
            data = []

            for _, row in batch.iterrows():
                if pd.isna(row['app_id']) or pd.isna(row['emp_id']) or pd.isna(row['soc_code']):
                    continue

                data.append((
                    row['app_id'], row['emp_id'], row['soc_code'],
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

            try:
                execute_batch(self.cur, insert_query, data, page_size=1000)
                self.conn.commit()
                total_loaded += len(data)
                progress = (i + batch_size) / len(df) * 100
                print(f"    Progress: {total_loaded:,}/{len(df):,} ({progress:.1f}%)")
            except Exception as e:
                print(f"    ⚠️  Batch {i//batch_size + 1} error: {e}")
                self.conn.rollback()
                continue

        print(f"  ✅ Loaded {total_loaded:,} applications")
        return total_loaded

    def load_year(self, year):
        """Load all data for a specific year"""
        print(f"\n{'='*70}")
        print(f"Loading Year {year}")
        print(f"{'='*70}")

        start_time = time.time()

        # Find files
        files = self.find_files_for_year(year)
        if not files:
            print(f"❌ No files found for {year}")
            return False

        print(f"Found {len(files)} file(s): {[f.name for f in files]}")

        # Load CSVs
        dfs = []
        for file in files:
            print(f"  Reading {file.name}...", end='')
            try:
                df = pd.read_csv(file, low_memory=False)
                df = self.standardize_columns(df)
                dfs.append(df)
                print(f" {len(df):,} rows ✓")
            except Exception as e:
                print(f" ❌ Error: {e}")
                return False

        df = pd.concat(dfs, ignore_index=True)
        df = self.standardize_wages(df)

        print(f"\nTotal records for {year}: {len(df):,}")

        # Load data
        try:
            self.load_dimension_tables(df)
            site_map = self.get_site_mapping()
            loaded = self.load_applications(df, site_map)

            elapsed = time.time() - start_time
            print(f"\n✅ Year {year} complete in {elapsed:.1f}s ({loaded/elapsed:.0f} records/sec)")
            return True

        except Exception as e:
            print(f"\n❌ Error loading {year}: {e}")
            self.conn.rollback()
            return False

    def refresh_views(self):
        """Refresh materialized views"""
        print(f"\n{'='*70}")
        print("Refreshing Materialized Views")
        print(f"{'='*70}")

        views = ['mv_industry_metrics', 'mv_state_metrics', 'mv_occupation_metrics']
        for view in views:
            print(f"  {view}...", end='')
            self.cur.execute(f"REFRESH MATERIALIZED VIEW {view}")
            self.conn.commit()
            print(" ✓")
        print("✅ Views refreshed")

    def close(self):
        self.cur.close()
        self.conn.close()

def main():
    print("="*70)
    print("H-1B DATA LOADER - Year by Year")
    print("="*70)

    loader = YearByYearLoader()

    try:
        # Check what's already loaded
        loaded_years = loader.get_loaded_years()
        print("\nCurrently loaded years:")
        for year, count in sorted(loaded_years.items()):
            print(f"  {year}: {count:,} records")

        # Define target years (missing 2015-2023)
        target_years = list(range(2015, 2024))  # 2015-2023

        print(f"\nWill load years: {target_years}")
        print("="*70)
        print("\nStarting in 3 seconds...")
        time.sleep(3)

        success_count = 0
        fail_count = 0

        for year in target_years:
            if year in loaded_years:
                print(f"\n⏭️  Skipping {year} (already loaded)")
                continue

            if loader.load_year(year):
                success_count += 1
            else:
                fail_count += 1
                print(f"⚠️  Failed to load {year}, continuing to next year...")
                continue

        # Refresh views if any data was loaded
        if success_count > 0:
            loader.refresh_views()

        print(f"\n{'='*70}")
        print(f"SUMMARY")
        print(f"{'='*70}")
        print(f"Successfully loaded: {success_count} years")
        print(f"Failed: {fail_count} years")

        # Final verification
        print(f"\n{'='*70}")
        print("Final Database State")
        print(f"{'='*70}")
        loaded_years = loader.get_loaded_years()
        total = 0
        for year, count in sorted(loaded_years.items()):
            print(f"  {year}: {count:,} records")
            total += count
        print(f"\nTotal: {total:,} records")
        print(f"{'='*70}")

    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        raise
    finally:
        loader.close()

if __name__ == "__main__":
    main()
