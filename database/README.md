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

```bash
# Load NAICS lookup table
python load_naics_lookup.py

# Load H-1B data (2022-2024 for quick start)
python load_data.py --years 2022 2023 2024

# Or load all years
python load_data.py --all
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

**2022-2024 data (~1.6M records):**
- Load time: ~5-10 minutes
- Storage: ~500MB

**All years (2009-2024, ~7.5M records):**
- Load time: ~30-45 minutes
- Storage: ~2GB

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
