# Database Setup

This folder contains everything needed to set up the PostgreSQL database on Google Cloud SQL.

## Files

- `schema.sql` - Database schema (tables, indexes, materialized views)
- `GCP_SETUP_GUIDE.md` - Step-by-step guide to create GCP Cloud SQL instance
- `load_naics_lookup.py` - Load NAICS industry codes
- `load_data.py` - ETL script to load H-1B CSV data
- `requirements.txt` - Python dependencies

## Quick Start

### 1. Set Up GCP Cloud SQL

Follow the detailed guide in [GCP_SETUP_GUIDE.md](GCP_SETUP_GUIDE.md)

Summary:
1. Create PostgreSQL 16 instance on GCP
2. Apply your class GCP credits
3. Get connection details (IP, password)
4. Create `.env` file with connection info

### 2. Install Dependencies

```bash
cd database
pip install -r requirements.txt
```

### 3. Create Database Schema

```bash
# Set your connection details
export DB_HOST=YOUR_IP
export DB_PASSWORD=YOUR_PASSWORD

# Run schema file
psql -h $DB_HOST -U postgres -d h1b_economic_impact -f schema.sql
```

### 4. Load Data

**Simple one-step method to load all data (2009-2024):**

```bash
python3 load_remaining_data.py
```

This script will:
- Automatically load all H-1B data from 2009-2024
- Skip years already in the database (safe to re-run)
- Handle different CSV formats across years
- Run in the background - you can monitor progress by checking record counts

**To monitor progress:**
```bash
# Check how many records have been loaded
python3 -c "
import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path('.env'))
conn = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    database=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD')
)
cur = conn.cursor()
cur.execute('SELECT fiscal_year, COUNT(*) FROM applications GROUP BY fiscal_year ORDER BY fiscal_year')
for year, count in cur.fetchall():
    print(f'{year}: {count:,} records')
cur.close()
conn.close()
"
```

### 5. Verify

```bash
psql -h $DB_HOST -U postgres -d h1b_economic_impact

# Check counts
SELECT COUNT(*) FROM applications;
SELECT COUNT(*) FROM employers;

# Test Feature 1 query
SELECT
    n.industry_category,
    COUNT(*) as total_apps,
    SUM(a.annual_wage) as total_wages,
    AVG(a.annual_wage) as avg_wage
FROM applications a
JOIN employers e ON a.emp_id = e.emp_id
JOIN naics_lookup n ON e.industry = n.naics_code
WHERE a.fiscal_year = 2024
GROUP BY n.industry_category
ORDER BY total_apps DESC
LIMIT 10;
```

## Environment Variables

Create `.env` file in project root:

```bash
DB_HOST=your.gcp.ip.address
DB_PORT=5432
DB_NAME=h1b_economic_impact
DB_USER=postgres
DB_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:password@host:5432/h1b_economic_impact
```

## Database Schema

### Main Tables
- **employers** - Employer information (FEIN, name, NAICS industry)
- **occupations** - SOC codes and job titles
- **worksite_locations** - Geographic locations of H-1B positions
- **applications** - H-1B application records (main table)
- **naics_lookup** - Industry code to name mapping

### Materialized Views (for fast queries)
- **mv_industry_metrics** - Pre-aggregated metrics by industry
- **mv_state_metrics** - Pre-aggregated metrics by state
- **mv_occupation_metrics** - Pre-aggregated metrics by occupation

## Data Loading Performance

**All years (2009-2024, ~5.9M records):**
- Load time: ~45-60 minutes
- Storage: ~1.5GB
- Final count: 5,873,631 records across all years

## Troubleshooting

### Connection Issues
- Verify IP is whitelisted in GCP Console
- Check `.env` file has correct credentials
- Test with `psql` before running scripts

### Data Loading Errors
- Ensure `schema.sql` was run first
- Load NAICS lookup before main data
- Check CSV files exist in `../data/avery/`

### Slow Queries
- Refresh materialized views: `SELECT refresh_all_views();`
- Check indexes: `\di` in psql
- Use EXPLAIN ANALYZE for query optimization

## Next Steps

After database is set up:
1. Test queries for Feature 1 analysis
2. Build Next.js API routes
3. Create dashboard frontend
4. Set up automated view refresh (cron job)
