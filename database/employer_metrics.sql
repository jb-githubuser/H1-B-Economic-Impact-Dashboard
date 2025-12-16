

DROP MATERIALIZED VIEW IF EXISTS mv_employer_metrics;

CREATE MATERIALIZED VIEW mv_employer_metrics AS
SELECT
  e.emp_id,
  e.emp_name,
  e.industry,
  COUNT(*) AS total_applications,
  COUNT(DISTINCT w.worksite_state) AS states_covered,
  AVG(a.annual_wage) AS avg_annual_wage,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY a.annual_wage) AS median_annual_wage,
  SUM(a.annual_wage) AS total_annual_wages,
  a.fiscal_year
FROM applications a
JOIN employers e ON a.emp_id = e.emp_id
LEFT JOIN worksite_locations w ON a.site_id = w.site_id
WHERE a.case_status = 'Certified'
GROUP BY
  e.emp_id, e.emp_name, e.industry, a.fiscal_year;

-- Indexes for typical dashboard filters
CREATE INDEX IF NOT EXISTS idx_mv_employer_metrics_year ON mv_employer_metrics(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_mv_employer_metrics_industry ON mv_employer_metrics(industry);
CREATE INDEX IF NOT EXISTS idx_mv_employer_metrics_emp_id ON mv_employer_metrics(emp_id);
CREATE INDEX IF NOT EXISTS idx_mv_employer_metrics_apps ON mv_employer_metrics(total_applications);
