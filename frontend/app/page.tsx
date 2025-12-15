'use client';

import { useEffect, useState } from 'react';
import { IndustryMetric, StateMetric, ApiResponse } from '@/lib/types';
import IndustryCharts from '@/components/IndustryCharts';
import StateCharts from '@/components/StateCharts';
import StateHeatmap from '@/components/StateHeatmap';
import DashboardFilters from '@/components/DashboardFilters';

export default function Dashboard() {
  const [industryData, setIndustryData] = useState<IndustryMetric[]>([]);
  const [stateData, setStateData] = useState<StateMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedIndustry, selectedState]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const industryParams = new URLSearchParams();
      if (selectedYear) industryParams.append('year', selectedYear.toString());
      if (selectedIndustry) industryParams.append('industry', selectedIndustry);

      const stateParams = new URLSearchParams();
      if (selectedYear) stateParams.append('year', selectedYear.toString());
      if (selectedState) stateParams.append('state', selectedState);

      // Fetch both datasets in parallel
      const [industryRes, stateRes] = await Promise.all([
        fetch(`/api/industry-metrics?${industryParams.toString()}`),
        fetch(`/api/state-metrics?${stateParams.toString()}`),
      ]);

      if (!industryRes.ok || !stateRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const industryJson: ApiResponse<IndustryMetric[]> = await industryRes.json();
      const stateJson: ApiResponse<StateMetric[]> = await stateRes.json();

      if (!industryJson.success || !stateJson.success) {
        throw new Error(industryJson.error || stateJson.error || 'Unknown error');
      }

      setIndustryData(industryJson.data || []);
      setStateData(stateJson.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">
            H1-B Economic Impact Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Analyzing the economic impact of H1-B visa holders on U.S. industries and states
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <DashboardFilters
          selectedYear={selectedYear}
          selectedIndustry={selectedIndustry}
          selectedState={selectedState}
          onYearChange={setSelectedYear}
          onIndustryChange={setSelectedIndustry}
          onStateChange={setSelectedState}
          industries={Array.from(new Map(industryData.filter(d => d.industry && d.industry_name).map(d => [d.industry, d.industry_name])
          ).entries()).map(([value, label]) => ({ value, label }))}

          states={Array.from(new Set(stateData.map(d => d.worksite_state))).filter(Boolean)}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && (
          <>
            {/* Geographic Heatmap - Full Width */}
            <div className="mb-8">
              <StateHeatmap data={stateData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Industry Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-800">
                  Industry Analysis
                </h2>
                <IndustryCharts data={industryData} />
              </div>

              {/* State Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-800">
                  State Analysis
                </h2>
                <StateCharts data={stateData} />
              </div>
            </div>
          </>
        )}

        {/* Summary Stats */}
        {!loading && !error && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-slate-600">Total Applications</h3>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {industryData.reduce((sum, d) => sum + Number(d.total_applications), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-slate-600">Average Wage</h3>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                $
                {Math.round(
                  industryData.reduce((sum, d) => sum + Number(d.avg_annual_wage), 0) /
                    (industryData.length || 1)
                ).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-slate-600">Unique Employers</h3>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {industryData.reduce((sum, d) => sum + Number(d.unique_employers), 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
