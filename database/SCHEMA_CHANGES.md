# Schema Changes & Fixes

This document tracks all modifications made to the original schema to handle real-world data issues.

## Changes Made

### 1. **Occupations Table - major_group Column**
**Original:** `VARCHAR(2)` with constraint `CHECK (major_group ~ '^[0-9]{2}$')`

**Updated:** `VARCHAR(10)` with NO constraint

**Reason:** Older Excel files corrupted SOC codes during export:
- Example: `"11-51"` → `"Nov-51"` (Excel auto-converted to date format)
- These corrupted values are 3+ characters and contain letters

**Impact:** Allows all data to load. Can filter out corrupted values in queries if needed.

### 2. **Applications Table - visa_class Constraint**
**Original:** `CHECK (visa_class IN ('H-1B', 'H-1B1', 'E-3'))`

**Updated:** `CHECK (visa_class LIKE 'H-1B%' OR visa_class = 'E-3')`

**Reason:** Data contains specific H-1B variants:
- `H-1B1 Chile`
- `H-1B1 Singapore`
- etc.

**Impact:** Accepts all H-1B variants while still validating the format.

## Files Updated

1. **`schema.sql`** - Main schema file with corrected constraints
2. **`fix_constraints.sql`** - One-time fix for existing databases
3. **`fix_soc_constraint.sql`** - One-time fix for SOC major_group

## Fresh Install Instructions

If someone is setting up the database from scratch:

```bash
# 1. Create Cloud SQL instance on GCP
# 2. Create database: h1b_economic_impact
# 3. Run the updated schema
psql -h YOUR_IP -U postgres -d h1b_economic_impact -f schema.sql

# 4. Load NAICS lookup
python load_naics_lookup.py

# 5. Load H-1B data
python load_data_fast.py --years 2022 2023 2024
# or for all years:
python load_data_fast.py --all
```

**No additional fixes needed** - the schema.sql now has all corrections baked in!

## Upgrading Existing Database

If you already have the old schema running:

```sql
-- Fix 1: Update major_group column
DROP MATERIALIZED VIEW mv_occupation_metrics;
ALTER TABLE occupations ALTER COLUMN major_group TYPE VARCHAR(10);

-- Recreate occupation metrics view
CREATE MATERIALIZED VIEW mv_occupation_metrics AS
SELECT
    o.major_group,
    o.soc_title,
    COUNT(*) as total_applications,
    AVG(a.annual_wage) as avg_annual_wage,
    a.fiscal_year
FROM applications a
JOIN occupations o ON a.soc_code = o.soc_code
WHERE a.case_status = 'Certified'
GROUP BY o.major_group, o.soc_title, a.fiscal_year;

CREATE INDEX idx_mv_occupation_metrics_major_group ON mv_occupation_metrics(major_group);
CREATE INDEX idx_mv_occupation_metrics_year ON mv_occupation_metrics(fiscal_year);

-- Fix 2: Update visa_class constraint
ALTER TABLE applications DROP CONSTRAINT check_visa_class;
ALTER TABLE applications ADD CONSTRAINT check_visa_class
    CHECK (visa_class LIKE 'H-1B%' OR visa_class = 'E-3');
```

## Known Data Quality Issues

### 1. **Corrupted SOC Codes** (older data)
- Excel converted codes like `"11-51"` to `"Nov-51"`, `"15-11"` to `"Mar-11"`, etc.
- Affects pre-2020 data
- Can be filtered in queries: `WHERE major_group ~ '^[0-9]{2}$'`

### 2. **Unrealistic Wages** (~317 records)
- Some wages > $1M/year (likely data entry errors)
- Examples: $832M, $790M, $561M
- Can be filtered: `WHERE annual_wage < 1000000`

### 3. **Missing Industry Classifications** (~23% of records)
- NAICS lookup table only has 53 codes
- Real data has 1000+ unique NAICS codes
- 23% of records don't match lookup table
- **Solution:** Either expand NAICS lookup or group as "Other"

## Recommendations for Production

1. **Add data validation layer** in ETL to flag obvious errors
2. **Expand NAICS lookup table** to cover all industry codes
3. **Add data quality monitoring** queries to track issues
4. **Consider cleaning corrupted SOC codes** at load time (map "Nov" → "11", "Mar" → "15", etc.)
