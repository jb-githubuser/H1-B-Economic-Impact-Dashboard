'use client';

import { useEffect, useState } from 'react';
import { IndustryMetric, StateMetric, ApiResponse } from '@/lib/types';

import IndustryCharts from '@/components/IndustryCharts';
import StateCharts from '@/components/StateCharts';
import StateHeatmap from '@/components/StateHeatmap';
import DashboardFilters from '@/components/DashboardFilters';

import CovidImpactBarCharts from '@/components/CovidImpactBarCharts';
import CovidImpactStateBarCharts from '@/components/CovidImpactStateBarCharts';

export default function Dashboard() {
  // =====================================================
  // OVERVIEW STATE (DO NOT TOUCH LOGIC)
  // =====================================================
  const [industryData, setIndustryData] = useState<IndustryMetric[]>([]);
  const [stateData, setStateData] = useState<StateMetric[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');

  // =====================================================
  // COVID STATE (COMPLETELY SEPARATE)
  // =====================================================
  const [covidIndustryData, setCovidIndustryData] = useState<any[]>([]);
  const [covidStateData, setCovidStateData] = useState<any[]>([]);
  const [covidLoading, setCovidLoading] = useState(true);

  // =====================================================
  // UI STATE
  // =====================================================
  const [activeTab, setActiveTab] = useState<'overview' | 'covid'>('overview');

  // =====================================================
  // OVERVIEW FETCH (UNCHANGED BEHAVIOR)
  // =====================================================
  const fetchOverviewData = async () => {
    setOverviewLoading(true);
    setOverviewError(null);

    try {
      const industryParams = new URLSearchParams();
      if (selectedYear) industryParams.append('year', selectedYear.toString());
      if (selectedIndustry) industryParams.append('industry', selectedIndustry);

      const stateParams = new URLSearchParams();
      if (selectedYear) stateParams.append('year', selectedYear.toString());
      if (selectedState) stateParams.append('state', selectedState);

      const [industryRes, stateRes] = await Promise.all([
        fetch(`/api/industry-metrics?${industryParams}`),
        fetch(`/api/state-metrics?${stateParams}`),
      ]);

      if (!industryRes.ok || !stateRes.ok) {
        throw new Error('Failed to fetch overview data');
      }

      const industryJson: ApiResponse<IndustryMetric[]> = await industryRes.json();
      const stateJson: ApiResponse<StateMetric[]> = await stateRes.json();

      setIndustryData(industryJson.data || []);
      setStateData(stateJson.data || []);
    } catch {
      setOverviewError('Failed to load dashboard data');
    } finally {
      setOverviewLoading(false);
    }
  };

  // =====================================================
  // COVID FETCH (ONCE, ISOLATED)
  // =====================================================
  const fetchCovidData = async () => {
    try {
      const [industryRes, stateRes] = await Promise.all([
        fetch('/api/covid-trends'),
        fetch('/api/covid-state-impact'),
      ]);

      const industryJson = await industryRes.json();
      const stateJson = await stateRes.json();

      setCovidIndustryData(industryJson);
      setCovidStateData(stateJson);
    } catch (err) {
      console.error('COVID fetch failed', err);
    } finally {
      setCovidLoading(false);
    }
  };

  // =====================================================
  // EFFECTS (STRICTLY SEPARATED)
  // =====================================================
  useEffect(() => {
    fetchOverviewData();
  }, [selectedYear, selectedIndustry, selectedState]);

  useEffect(() => {
    fetchCovidData();
  }, []);

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900">
            H1-B Economic Impact Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Analyzing the economic impact of H1-B visa holders on U.S. industries and states
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('covid')}
              className={`pb-2 font-medium ${
                activeTab === 'covid'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500'
              }`}
            >
              COVID Trends
            </button>
          </nav>
        </div>

        {/* Filters — OVERVIEW ONLY */}
        {activeTab === 'overview' && (
          <DashboardFilters
            selectedYear={selectedYear}
            selectedIndustry={selectedIndustry}
            selectedState={selectedState}
            onYearChange={setSelectedYear}
            onIndustryChange={setSelectedIndustry}
            onStateChange={setSelectedState}
            industries={Array.from(
              new Map(
                industryData
                  .filter(
                    d =>
                      typeof d.industry_name === 'string' &&
                      d.industry_name.trim() !== '' &&
                      d.industry_name !== d.industry
                  )
                  .map(d => [d.industry_name, d.industry_name])
              ).entries()
            ).map(([value, label]) => ({ value, label }))}
            states={Array.from(new Set(stateData.map(d => d.worksite_state))).filter(Boolean)}
          />
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {overviewLoading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
              </div>
            )}

            {overviewError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{overviewError}</p>
              </div>
            )}

            {!overviewLoading && !overviewError && (
              <>
                <div className="mb-8">
                  <StateHeatmap data={stateData} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <IndustryCharts data={industryData} />
                  <StateCharts data={stateData} />
                </div>
              </>
            )}
          </>
        )}

        {/* COVID — ADDITIVE ONLY */}
        {activeTab === 'covid' && (
          <>
            {covidLoading ? (
              <div className="text-slate-500">Loading COVID data…</div>
            ) : (
              <div className="space-y-10">
                <CovidImpactBarCharts data={covidIndustryData} />
                <CovidImpactStateBarCharts data={covidStateData} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
