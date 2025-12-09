-- ============================================================================
-- DATABASE VERIFICATION QUERIES
-- Run these to ensure all tables, joins, and data are working correctly
-- ============================================================================

-- QUERY 1: Basic Table Counts (verify all data loaded)
-- Should show ~1.6M applications, 38K employers, 700 occupations, 12K worksites
SELECT
    'applications' as table_name, COUNT(*) as record_count FROM applications
UNION ALL
SELECT 'employers', COUNT(*) FROM employers
UNION ALL
SELECT 'occupations', COUNT(*) FROM occupations
UNION ALL
SELECT 'worksite_locations', COUNT(*) FROM worksite_locations
UNION ALL
SELECT 'naics_lookup', COUNT(*) FROM naics_lookup
ORDER BY record_count DESC;

-- QUERY 2: Test Foreign Key Relationships (ensure no orphaned records)
-- All should return 0 if data integrity is good
SELECT 'Orphaned Applications (bad emp_id)' as check_name,
       COUNT(*) as problem_count
FROM applications a
WHERE NOT EXISTS (SELECT 1 FROM employers e WHERE e.emp_id = a.emp_id)

UNION ALL

SELECT 'Orphaned Applications (bad soc_code)',
       COUNT(*)
FROM applications a
WHERE NOT EXISTS (SELECT 1 FROM occupations o WHERE o.soc_code = a.soc_code)

UNION ALL

SELECT 'Orphaned Applications (bad site_id)',
       COUNT(*)
FROM applications a
WHERE a.site_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM worksite_locations w WHERE w.site_id = a.site_id);

-- QUERY 3: Data Quality Checks (verify fields are populated correctly)
SELECT
    'Total Applications' as metric,
    COUNT(*) as count,
    NULL::numeric as avg_value,
    NULL::text as sample_value
FROM applications

UNION ALL

SELECT
    'Applications with Wages',
    COUNT(*),
    AVG(annual_wage),
    NULL
FROM applications
WHERE annual_wage IS NOT NULL

UNION ALL

SELECT
    'Applications with Valid Dates',
    COUNT(*),
    NULL,
    NULL
FROM applications
WHERE decision_date IS NOT NULL AND received_date IS NOT NULL

UNION ALL

SELECT
    'Certified Applications',
    COUNT(*),
    NULL,
    NULL
FROM applications
WHERE case_status = 'Certified'

UNION ALL

SELECT
    'Applications with Worksite',
    COUNT(*),
    NULL,
    NULL
FROM applications
WHERE site_id IS NOT NULL;

-- QUERY 4: Feature 1 - Industry Analysis (test NAICS lookup join)
-- Top 10 industries by H-1B count with economic impact
SELECT
    n.industry_category,
    n.sector,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT e.emp_id) as unique_employers,
    COUNT(DISTINCT a.soc_code) as unique_occupations,
    ROUND(AVG(a.annual_wage)::numeric, 2) as avg_annual_wage,
    ROUND(SUM(a.annual_wage)::numeric / 1000000000, 2) as total_wages_billions,
    ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM applications) * 100), 2) as pct_of_total
FROM applications a
JOIN employers e ON a.emp_id = e.emp_id
LEFT JOIN naics_lookup n ON e.industry = n.naics_code
WHERE a.case_status = 'Certified'
GROUP BY n.industry_category, n.sector
ORDER BY total_applications DESC
LIMIT 10;

-- QUERY 5: Geographic Analysis (test worksite_locations join)
-- Top 10 states by H-1B concentration
SELECT
    w.worksite_state,
    COUNT(DISTINCT a.app_id) as total_applications,
    COUNT(DISTINCT e.emp_id) as unique_employers,
    COUNT(DISTINCT w.worksite_city) as unique_cities,
    ROUND(AVG(a.annual_wage)::numeric, 2) as avg_annual_wage,
    ROUND(SUM(a.annual_wage)::numeric / 1000000000, 2) as total_wages_billions,
    ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM applications WHERE site_id IS NOT NULL) * 100), 2) as pct_of_total
FROM applications a
JOIN employers e ON a.emp_id = e.emp_id
JOIN worksite_locations w ON a.site_id = w.site_id
WHERE a.case_status = 'Certified'
GROUP BY w.worksite_state
ORDER BY total_applications DESC
LIMIT 10;

-- QUERY 6: Time Series Analysis (test fiscal_year distribution)
-- Applications by year (should show data for 2022, 2023, 2024)
SELECT
    fiscal_year,
    COUNT(*) as total_applications,
    COUNT(DISTINCT emp_id) as unique_employers,
    ROUND(AVG(annual_wage)::numeric, 2) as avg_wage,
    ROUND(SUM(annual_wage)::numeric / 1000000000, 2) as total_wages_billions
FROM applications
WHERE fiscal_year IS NOT NULL
GROUP BY fiscal_year
ORDER BY fiscal_year;

-- QUERY 7: Occupation Analysis (test SOC code joins)
-- Top 10 occupations by application count
SELECT
    o.major_group,
    o.soc_title,
    COUNT(*) as total_applications,
    COUNT(DISTINCT e.emp_id) as unique_employers,
    ROUND(AVG(a.annual_wage)::numeric, 2) as avg_wage,
    MIN(a.annual_wage) as min_wage,
    MAX(a.annual_wage) as max_wage
FROM applications a
JOIN occupations o ON a.soc_code = o.soc_code
JOIN employers e ON a.emp_id = e.emp_id
WHERE a.annual_wage IS NOT NULL
GROUP BY o.major_group, o.soc_title
ORDER BY total_applications DESC
LIMIT 10;

-- QUERY 8: Materialized View Test (verify views were refreshed)
-- Test pre-computed industry metrics
SELECT
    industry,
    fiscal_year,
    total_applications,
    unique_employers,
    ROUND(avg_annual_wage::numeric, 2) as avg_wage,
    ROUND(total_annual_wages::numeric / 1000000000, 2) as total_wages_billions
FROM mv_industry_metrics
ORDER BY total_applications DESC
LIMIT 10;

-- QUERY 9: Complex Join Test (all tables together)
-- Full data integration test
SELECT
    e.emp_name,
    n.industry_category,
    w.worksite_state,
    w.worksite_city,
    o.soc_title,
    a.fiscal_year,
    a.annual_wage
FROM applications a
JOIN employers e ON a.emp_id = e.emp_id
JOIN occupations o ON a.soc_code = o.soc_code
LEFT JOIN worksite_locations w ON a.site_id = w.site_id
LEFT JOIN naics_lookup n ON e.industry = n.naics_code
WHERE a.case_status = 'Certified'
  AND a.fiscal_year = 2024
ORDER BY a.annual_wage DESC
LIMIT 20;

-- QUERY 10: Edge Cases & Data Validation
-- Check for potential data quality issues
SELECT
    'Negative Wages' as issue,
    COUNT(*) as count
FROM applications
WHERE annual_wage < 0

UNION ALL

SELECT 'Unrealistic Wages (>$1M)',
       COUNT(*)
FROM applications
WHERE annual_wage > 1000000

UNION ALL

SELECT 'Missing Fiscal Year',
       COUNT(*)
FROM applications
WHERE fiscal_year IS NULL

UNION ALL

SELECT 'Future Dates',
       COUNT(*)
FROM applications
WHERE decision_date > CURRENT_DATE

UNION ALL

SELECT 'Applications without Industry Classification',
       COUNT(*)
FROM applications a
JOIN employers e ON a.emp_id = e.emp_id
WHERE e.industry IS NULL
  OR NOT EXISTS (SELECT 1 FROM naics_lookup n WHERE n.naics_code = e.industry);
