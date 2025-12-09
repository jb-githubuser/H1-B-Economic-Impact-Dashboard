-- Fix worksite_zip column length constraint
-- Drop dependent materialized view, alter column, then recreate view

DROP MATERIALIZED VIEW IF EXISTS mv_state_metrics;

-- Increase worksite_zip column length to handle longer ZIP codes
ALTER TABLE worksite_locations ALTER COLUMN worksite_zip TYPE VARCHAR(20);

-- Also update employer zip to be consistent
ALTER TABLE employers ALTER COLUMN emp_zip TYPE VARCHAR(20);

-- Recreate the materialized view
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
