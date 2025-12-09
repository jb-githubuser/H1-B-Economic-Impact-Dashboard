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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
