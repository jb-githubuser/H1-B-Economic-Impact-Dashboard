-- H1-B Economic Impact Dashboard - PostgreSQL Schema
-- Based on Project Milestone 2 design

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS worksite_locations CASCADE;
DROP TABLE IF EXISTS employers CASCADE;
DROP TABLE IF EXISTS occupations CASCADE;

-- ==============================================================================
-- 1. OCCUPATIONS TABLE
-- Stores SOC (Standard Occupational Classification) codes and titles
-- ==============================================================================
CREATE TABLE occupations (
    soc_code VARCHAR(50) PRIMARY KEY,  -- Increased from VARCHAR(20) to handle longer/corrupted codes
    soc_title VARCHAR(255) NOT NULL,
    major_group VARCHAR(10)  -- Increased from VARCHAR(2) to handle corrupted data (e.g., "Nov" instead of "11")
    -- Note: No constraint - older data has Excel-corrupted values like "Nov-51" instead of "11-51"
);

CREATE INDEX idx_occupations_major_group ON occupations(major_group);

-- ==============================================================================
-- 2. EMPLOYERS TABLE
-- Stores unique employer information
-- ==============================================================================
CREATE TABLE employers (
    emp_id VARCHAR(20) PRIMARY KEY,  -- FEIN (Federal Employer ID Number)
    emp_name VARCHAR(500) NOT NULL,
    industry VARCHAR(10),  -- NAICS code
    emp_address VARCHAR(500),
    emp_city VARCHAR(100),
    emp_state VARCHAR(2),
    emp_zip VARCHAR(20)  -- Increased from VARCHAR(10) to handle longer ZIP codes
);

CREATE INDEX idx_employers_industry ON employers(industry);
CREATE INDEX idx_employers_state ON employers(emp_state);
CREATE INDEX idx_employers_name ON employers(emp_name);

-- ==============================================================================
-- 3. WORKSITE LOCATIONS TABLE
-- Stores worksite information (where H-1B workers will be placed)
-- Note: Multiple applications can have the same worksite
-- ==============================================================================
CREATE TABLE worksite_locations (
    site_id SERIAL PRIMARY KEY,
    worksite_city VARCHAR(100),
    worksite_state VARCHAR(2),
    worksite_zip VARCHAR(20),  -- Increased from VARCHAR(10) to handle longer ZIP codes
    UNIQUE(worksite_city, worksite_state, worksite_zip)
);

CREATE INDEX idx_worksite_state ON worksite_locations(worksite_state);
CREATE INDEX idx_worksite_city ON worksite_locations(worksite_city);

-- ==============================================================================
-- 4. APPLICATIONS TABLE
-- Main table storing H-1B application information
-- ==============================================================================
CREATE TABLE applications (
    app_id VARCHAR(50) PRIMARY KEY,
    emp_id VARCHAR(20) NOT NULL REFERENCES employers(emp_id),
    soc_code VARCHAR(50) NOT NULL REFERENCES occupations(soc_code),  -- Increased from VARCHAR(20) to match occupations table
    site_id INTEGER REFERENCES worksite_locations(site_id),

    -- Application status and dates
    case_status VARCHAR(30) NOT NULL,
    decision_date DATE,
    received_date DATE,
    fiscal_year INTEGER,
    visa_class VARCHAR(20),

    -- Job details
    job_title VARCHAR(500),
    full_time BOOLEAN,
    begin_date DATE,
    end_date DATE,

    -- Wage information
    wage_offer NUMERIC(12, 2),
    wage_unit VARCHAR(20),
    annual_wage NUMERIC(12, 2),  -- Standardized annual wage

    CONSTRAINT check_case_status CHECK (case_status IN ('Certified', 'Certified-Withdrawn', 'Denied', 'Withdrawn')),
    CONSTRAINT check_visa_class CHECK (visa_class LIKE 'H-1B%' OR visa_class = 'E-3'),  -- Allow H-1B1 Chile, H-1B1 Singapore variants
    CONSTRAINT check_wage_unit CHECK (wage_unit IN ('Hour', 'Week', 'Bi-Weekly', 'Month', 'Year')),
    CONSTRAINT check_fiscal_year CHECK (fiscal_year >= 2000 AND fiscal_year <= 2100)
);

-- Indexes for common queries
CREATE INDEX idx_applications_emp_id ON applications(emp_id);
CREATE INDEX idx_applications_soc_code ON applications(soc_code);
CREATE INDEX idx_applications_site_id ON applications(site_id);
CREATE INDEX idx_applications_fiscal_year ON applications(fiscal_year);
CREATE INDEX idx_applications_case_status ON applications(case_status);
CREATE INDEX idx_applications_decision_date ON applications(decision_date);
CREATE INDEX idx_applications_annual_wage ON applications(annual_wage);

-- ==============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- Pre-compute common aggregations for dashboard queries
-- ==============================================================================

-- Industry metrics (for Feature 1)
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

-- State metrics (for Feature 1)
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

-- Occupation metrics
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

-- ==============================================================================
-- NAICS LOOKUP TABLE (for industry classification)
-- ==============================================================================
CREATE TABLE naics_lookup (
    naics_code VARCHAR(10) PRIMARY KEY,
    industry_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    industry_category VARCHAR(100)
);

CREATE INDEX idx_naics_category ON naics_lookup(industry_category);

-- ==============================================================================
-- HELPER FUNCTIONS
-- ==============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_industry_metrics;
    REFRESH MATERIALIZED VIEW mv_state_metrics;
    REFRESH MATERIALIZED VIEW mv_occupation_metrics;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- COMMENTS (Documentation)
-- ==============================================================================

COMMENT ON TABLE employers IS 'Stores unique employer information including FEIN, name, and NAICS industry code';
COMMENT ON TABLE occupations IS 'Standard Occupational Classification (SOC) codes and job titles';
COMMENT ON TABLE worksite_locations IS 'Geographic locations where H-1B workers will be placed';
COMMENT ON TABLE applications IS 'Main H-1B application data with status, wages, and dates';
COMMENT ON TABLE naics_lookup IS 'NAICS code to industry name mapping for human-readable labels';

COMMENT ON MATERIALIZED VIEW mv_industry_metrics IS 'Pre-aggregated metrics by industry and fiscal year for Feature 1';
COMMENT ON MATERIALIZED VIEW mv_state_metrics IS 'Pre-aggregated metrics by state and fiscal year for Feature 1';
COMMENT ON MATERIALIZED VIEW mv_occupation_metrics IS 'Pre-aggregated metrics by occupation for analysis';
