-- ============================================================================
-- FEATURE 3: EXPOSURE SCORE (POLICY SHOCK ANALYSIS) - FIXED
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
  FROM applications a
  JOIN employers e ON a.emp_id = e.emp_id
  GROUP BY e.industry, a.emp_id
),
industry_totals AS (
  SELECT
    industry,
    SUM(app_count_by_employer) AS total_apps_in_industry
  FROM base_metrics
  GROUP BY industry
),
industry_aggregates AS (
  SELECT
    bm.industry,
    SUM(bm.app_count_by_employer) AS total_applications,
    SUM(bm.wage_mass_by_employer) AS total_wage_mass,
    COUNT(DISTINCT bm.emp_id) AS employer_count,
    SUM(
      POWER(
        bm.app_count_by_employer::numeric / it.total_apps_in_industry,
        2
      )
    ) AS hhi_concentration
  FROM base_metrics bm
  JOIN industry_totals it ON bm.industry = it.industry
  GROUP BY bm.industry
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
    l.worksite_state,
    a.emp_id,
    COUNT(*) AS app_count_by_employer,
    SUM(a.wage_offer) AS wage_mass_by_employer
  FROM applications a
  JOIN worksite_locations l ON a.site_id = l.site_id
  GROUP BY l.worksite_state, a.emp_id
),
state_totals AS (
  SELECT
    worksite_state,
    SUM(app_count_by_employer) AS total_apps_in_state
  FROM base_metrics
  GROUP BY worksite_state
),
state_aggregates AS (
  SELECT
    bm.worksite_state,
    SUM(bm.app_count_by_employer) AS total_applications,
    SUM(bm.wage_mass_by_employer) AS total_wage_mass,
    COUNT(DISTINCT bm.emp_id) AS employer_count,
    SUM(
      POWER(
        bm.app_count_by_employer::numeric / st.total_apps_in_state,
        2
      )
    ) AS hhi_concentration
  FROM base_metrics bm
  JOIN state_totals st ON bm.worksite_state = st.worksite_state
  GROUP BY bm.worksite_state
),
global_totals AS (
  SELECT
    SUM(total_applications) AS global_app_count,
    SUM(total_wage_mass) AS global_wage_mass
  FROM state_aggregates
),
scored_states AS (
  SELECT
    sa.worksite_state,
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
  worksite_state,
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
-- INDEXES
-- ============================================================================

CREATE INDEX idx_exposure_industry_score 
  ON mv_exposure_score_industry(exposure_score DESC);

CREATE INDEX idx_exposure_industry_name 
  ON mv_exposure_score_industry(industry);

CREATE INDEX idx_exposure_state_score 
  ON mv_exposure_score_state(exposure_score DESC);

CREATE INDEX idx_exposure_state_name 
  ON mv_exposure_score_state(worksite_state);

-- ============================================================================
-- VERIFY DATA
-- ============================================================================

SELECT 'Industry view created with ' || COUNT(*) || ' rows' AS status
FROM mv_exposure_score_industry;

SELECT 'State view created with ' || COUNT(*) || ' rows' AS status
FROM mv_exposure_score_state;

-- Show top 5 industries
SELECT industry, exposure_score, total_applications, estimated_fee_shock_millions
FROM mv_exposure_score_industry
ORDER BY exposure_score DESC
LIMIT 5;

-- Show top 5 states
SELECT worksite_state, exposure_score, total_applications, estimated_fee_shock_millions
FROM mv_exposure_score_state
ORDER BY exposure_score DESC
LIMIT 5;
