-- ============================================================================
-- FEATURE 3: EXPOSURE SCORE (POLICY SHOCK ANALYSIS)
-- ============================================================================
-- Purpose: Measure vulnerability of industries and states to a hypothetical
--          $100,000 increase in H-1B visa costs (policy simulation)
-- 
-- EXPOSURE SCORE FORMULA:
-- Exposure Score = (0.4 × Volume_Share) + (0.3 × Wage_Mass_Share) + (0.3 × HHI_Score)
--
-- Components:
-- 1. Volume_Share (40%): Application count as % of total (measures scale)
-- 2. Wage_Mass_Share (30%): Total wage mass as % of total (economic magnitude)
-- 3. HHI_Score (30%): Employer concentration within industry/state
--
-- NOTE ON HHI:
-- HHI measures reliance on a small number of sponsoring firms.
-- Higher concentration may amplify vulnerability if dominant firms
-- reduce hiring in response to higher visa costs.
--
-- Higher scores indicate greater relative exposure to a policy-induced cost shock.
-- ============================================================================

-- ============================================================================
-- PART A: EXPOSURE SCORE BY INDUSTRY
-- ============================================================================

CREATE MATERIALIZED VIEW mv_exposure_score_industry AS
WITH base_metrics AS (
  SELECT
    e.industry,
    a.emp_id,
    COUNT(*) AS app_count_by_employer,
    SUM(a.wage_offer) AS wage_mass_by_employer
  FROM application_info a
  JOIN employer_info e ON a.emp_id = e.emp_id
  GROUP BY e.industry, a.emp_id
),
industry_aggregates AS (
  SELECT
    industry,
    SUM(app_count_by_employer) AS total_applications,
    SUM(wage_mass_by_employer) AS total_wage_mass,
    COUNT(DISTINCT emp_id) AS employer_count,
    SUM(
      POWER(
        app_count_by_employer::numeric 
        / SUM(app_count_by_employer) OVER (PARTITION BY industry),
        2
      )
    ) AS hhi_concentration
  FROM base_metrics
  GROUP BY industry
),
global_totals AS (
  SELECT
    SUM(total_applications) AS global_app_count,
    SUM(total_wage_mass) AS global_wage_mass
  FROM industry_aggregates
),
scored_industries AS (
  SELECT
    ia.industry,
    ia.total_applications,
    ia.total_wage_mass,
    ia.employer_count,
    ROUND(ia.hhi_concentration::numeric, 4) AS hhi_concentration,
    ROUND(
      100.0 * ia.total_applications / gt.global_app_count,
      2
    ) AS volume_share_pct,
    ROUND(
      100.0 * ia.total_wage_mass / gt.global_wage_mass,
      2
    ) AS wage_mass_share_pct,
    ROUND(100.0 * ia.hhi_concentration::numeric, 2) AS hhi_score
  FROM industry_aggregates ia
  CROSS JOIN global_totals gt
)
SELECT
  industry,
  total_applications,
  ROUND(total_wage_mass::numeric, 2) AS total_wage_mass,
  employer_count,
  hhi_concentration,
  volume_share_pct,
  wage_mass_share_pct,
  hhi_score,
  ROUND(
    (0.4 * volume_share_pct) + 
    (0.3 * wage_mass_share_pct) + 
    (0.3 * hhi_score),
    2
  ) AS exposure_score,
  -- Policy simulation: total fee shock assuming $100K per approved application
  ROUND(
    (total_applications * 100000)::numeric / 1000000,
    2
  ) AS estimated_fee_shock_millions
FROM scored_industries
ORDER BY exposure_score DESC;

-- ============================================================================
-- PART B: EXPOSURE SCORE BY STATE
-- ============================================================================

CREATE MATERIALIZED VIEW mv_exposure_score_state AS
WITH base_metrics AS (
  SELECT
    l.state,
    a.emp_id,
    COUNT(*) AS app_count_by_employer,
    SUM(a.wage_offer) AS wage_mass_by_employer
  FROM application_info a
  JOIN location_info l ON a.site_id = l.site_id
  GROUP BY l.state, a.emp_id
),
state_aggregates AS (
  SELECT
    state,
    SUM(app_count_by_employer) AS total_applications,
    SUM(wage_mass_by_employer) AS total_wage_mass,
    COUNT(DISTINCT emp_id) AS employer_count,
    SUM(
      POWER(
        app_count_by_employer::numeric 
        / SUM(app_count_by_employer) OVER (PARTITION BY state),
        2
      )
    ) AS hhi_concentration
  FROM base_metrics
  GROUP BY state
),
global_totals AS (
  SELECT
    SUM(total_applications) AS global_app_count,
    SUM(total_wage_mass) AS global_wage_mass
  FROM state_aggregates
),
scored_states AS (
  SELECT
    sa.state,
    sa.total_applications,
    sa.total_wage_mass,
    sa.employer_count,
    ROUND(sa.hhi_concentration::numeric, 4) AS hhi_concentration,
    ROUND(
      100.0 * sa.total_applications / gt.global_app_count,
      2
    ) AS volume_share_pct,
    ROUND(
      100.0 * sa.total_wage_mass / gt.global_wage_mass,
      2
    ) AS wage_mass_share_pct,
    ROUND(100.0 * sa.hhi_concentration::numeric, 2) AS hhi_score
  FROM state_aggregates sa
  CROSS JOIN global_totals gt
)
SELECT
  state,
  total_applications,
  ROUND(total_wage_mass::numeric, 2) AS total_wage_mass,
  employer_count,
  hhi_concentration,
  volume_share_pct,
  wage_mass_share_pct,
  hhi_score,
  ROUND(
    (0.4 * volume_share_pct) + 
    (0.3 * wage_mass_share_pct) + 
    (0.3 * hhi_score),
    2
  ) AS exposure_score,
  ROUND(
    (total_applications * 100000)::numeric / 1000000,
    2
  ) AS estimated_fee_shock_millions
FROM scored_states
ORDER BY exposure_score DESC;

-- ============================================================================
-- INDEXES FOR FEATURE 3
-- ============================================================================

-- Index for sorting/filtering by exposure score (industry)
CREATE INDEX idx_exposure_industry_score 
  ON mv_exposure_score_industry(exposure_score DESC);

-- Index for filtering by industry name
CREATE INDEX idx_exposure_industry_name 
  ON mv_exposure_score_industry(industry);

-- Index for sorting/filtering by exposure score (state)
CREATE INDEX idx_exposure_state_score 
  ON mv_exposure_score_state(exposure_score DESC);

-- Index for filtering by state
CREATE INDEX idx_exposure_state_name 
  ON mv_exposure_score_state(state);

-- ============================================================================
-- REFRESH COMMANDS
-- ============================================================================
-- Run these after initial creation or when data updates occur:
-- REFRESH MATERIALIZED VIEW mv_exposure_score_industry;
-- REFRESH MATERIALIZED VIEW mv_exposure_score_state;

-- ============================================================================
-- SAMPLE QUERY USAGE
-- ============================================================================

-- Top 10 most exposed industries:
-- SELECT industry, exposure_score, total_applications, estimated_cost_impact_millions
-- FROM mv_exposure_score_industry
-- ORDER BY exposure_score DESC
-- LIMIT 10;

-- Top 10 most exposed states:
-- SELECT state, exposure_score, total_applications, estimated_cost_impact_millions
-- FROM mv_exposure_score_state
-- ORDER BY exposure_score DESC
-- LIMIT 10;

-- Industries with high concentration risk (HHI > 0.15):
-- SELECT industry, hhi_concentration, employer_count, exposure_score
-- FROM mv_exposure_score_industry
-- WHERE hhi_concentration > 0.15
-- ORDER BY hhi_concentration DESC;

-- Compare exposure components for a specific industry:
-- SELECT industry, volume_share_pct, wage_mass_share_pct, hhi_score, exposure_score
-- FROM mv_exposure_score_industry
-- WHERE industry = 'Technology';

-- ============================================================================
-- ECONOMIC INTERPRETATION NOTES
-- ============================================================================
-- 
-- EXPOSURE SCORE RANGES:
-- - 0-10:  Low exposure (minimal vulnerability to cost increase)
-- - 10-20: Moderate exposure (noticeable impact possible)
-- - 20-30: High exposure (significant vulnerability)
-- - 30+:   Critical exposure (severe impact likely)
--
-- HHI CONCENTRATION INTERPRETATION:
-- - < 0.01:  Highly competitive (many employers)
-- - 0.01-0.15: Moderate concentration
-- - 0.15-0.25: High concentration
-- - > 0.25:  Very high concentration (near-monopoly)
--
-- POLICY IMPLICATIONS:
-- High exposure scores suggest an industry/state would face:
-- - Substantial direct cost increases
-- - Reduced competitiveness in H-1B hiring
-- - Potential wage inflation or hiring shifts
-- - Greater political pressure to oppose fee increases
-- ============================================================================