// API Response Types for Feature 1

export interface IndustryMetric {
  industry: string;
  industry_name: string;
  total_applications: number;
  unique_employers: number;
  avg_annual_wage: number;
  median_annual_wage: number;
  total_annual_wages: number;
  fiscal_year: number;
}

export interface StateMetric {
  worksite_state: string;
  total_applications: number;
  unique_employers: number;
  avg_annual_wage: number;
  total_annual_wages: number;
  fiscal_year: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CovidTrendMetric {
  industry: string;
  state: string;

  app_count_2019: number | null;
  app_count_2020: number | null;
  app_count_2021: number | null;

  app_count_change_2019_to_2020_pct: number | null;
  app_count_change_2020_to_2021_pct: number | null;
  app_count_change_2019_to_2021_pct: number | null;

  avg_wage_2019: number | null;
  avg_wage_2020: number | null;
  avg_wage_2021: number | null;

  median_wage_2019: number | null;
  median_wage_2020: number | null;
  median_wage_2021: number | null;
}


export interface ExposureMetric {
  industry?: string;
  state?: string;

  total_applications: number;
  total_wage_mass: number;
  employer_count: number;

  volume_share_pct: number;
  wage_mass_share_pct: number;
  hhi_score: number;

  exposure_score: number;
  estimated_fee_shock_millions: number;
}

export interface EmployerMetric {
  emp_id: string;
  emp_name: string;
  industry: string | null;
  industry_name?: string;
  total_applications: number;
  states_covered: number;
  avg_annual_wage: number;
  median_annual_wage: number;
  total_annual_wages: number;
  fiscal_year: number;
}