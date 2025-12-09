-- Comprehensive fix for all data type constraints
-- Run this on existing database before loading data

-- Drop materialized views that depend on the tables we're modifying
DROP MATERIALIZED VIEW IF EXISTS mv_state_metrics;
DROP MATERIALIZED VIEW IF EXISTS mv_occupation_metrics;
DROP MATERIALIZED VIEW IF EXISTS mv_industry_metrics;

-- Fix worksite_zip column length
ALTER TABLE worksite_locations ALTER COLUMN worksite_zip TYPE VARCHAR(20);

-- Fix employer zip column length
ALTER TABLE employers ALTER COLUMN emp_zip TYPE VARCHAR(20);

-- Fix applications.soc_code to match occupations.soc_code
ALTER TABLE applications ALTER COLUMN soc_code TYPE VARCHAR(50);

-- Recreate all materialized views
CREATE MATERIALIZED VIEW mv_industry_metrics AS
SELECT
    e.industry,
    COUNT(*) as total_applications,
    COUNT(DISTINCT a.emp_id) as unique_employers,
    AVG(a.annual_wage) as avg_annual_wage,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY a.annual_wage) as median_annual_wage,
    SUM(a.annual_wage) as total_annual_wages,
    a.fiscal_year
FROM applications a
JOIN employers e ON a.emp_id = e.emp_id
WHERE a.case_status = 'Certified'
GROUP BY e.industry, a.fiscal_year;

CREATE INDEX idx_mv_industry_metrics_industry ON mv_industry_metrics(industry);
CREATE INDEX idx_mv_industry_metrics_year ON mv_industry_metrics(fiscal_year);

CREATE MATERIALIZED VIEW mv_state_metrics AS
SELECT
    w.worksite_state,
    COUNT(*) as total_applications,
    COUNT(DISTINCT a.emp_id) as unique_employers,
    AVG(a.annual_wage) as avg_annual_wage,
    SUM(a.annual_wage) as total_annual_wages,
    a.fiscal_year
FROM applications a
JOIN worksite_locations w ON a.site_id = w.site_id
WHERE a.case_status = 'Certified'
GROUP BY w.worksite_state, a.fiscal_year;

CREATE INDEX idx_mv_state_metrics_state ON mv_state_metrics(worksite_state);
CREATE INDEX idx_mv_state_metrics_year ON mv_state_metrics(fiscal_year);

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
