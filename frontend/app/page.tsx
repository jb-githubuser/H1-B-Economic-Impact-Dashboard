'use client';

import { useEffect, useState } from 'react';
import { IndustryMetric, StateMetric, ApiResponse } from '@/lib/types';

import IndustryCharts from '@/components/IndustryCharts';
import StateCharts from '@/components/StateCharts';
import StateHeatmap from '@/components/StateHeatmap';
import DashboardFilters from '@/components/DashboardFilters';

import CovidImpactBarCharts from '@/components/CovidImpactBarCharts';

export default function Dashboard() {
  // ---------------------------
  // State
  // ---------------------------
  const [industryData, setIndustryData] = useState<IndustryMetric[]>([]);
  const [stateData, setStateData] = useState<StateMetric[]>([]);
  const [covidData, setCovidData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'covid'>('overview');

  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');

  // ---------------------------
  // Fetch overview data (filters apply)
  // ---------------------------
  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);

    try {
      const industryParams = new URLSearchParams();
      if (selectedYear) industryParams.append('year', selectedYear.toString());
      if (selectedIndustry) industryParams.append('industry', selectedIndustry);

      const stateParams = new URLSearchParams();
      if (selectedYear) stateParams.append('year', selectedYear.toString());
      if (selectedState) stateParams.append('state', selectedState);

      const [industryRes, stateRes] = await Promise.all([
        fetch(`/api/industry-metrics?${industryParams.toString()}`),
        fetch(`/api/state-metrics?${stateParams.toString()}`),
      ]);

      if (!industryRes.ok || !stateRes.ok) {
        throw new Error('Failed to fetch overview data');
      }

      const industryJson: ApiResponse<IndustryMetric[]> = await industryRes.json();
      const stateJson: ApiResponse<StateMetric[]> = await stateRes.json();

      setIndustryData(industryJson.data || []);
      setStateData(stateJson.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Fetch COVID data (ONCE)
  // ---------------------------
  const fetchCovidData = async () => {
    try {
      const res = await fetch('/api/covid-trends');
      if (!res.ok) throw new Error('Failed to fetch COVID trends');
  
      const json = await res.json();
  
      if (Array.isArray(json)) {
        setCovidData(json);
      } else if (Array.isArray(json.data)) {
        setCovidData(json.data);
      } else {
        console.error('Unexpected covid-trends response:', json);
        setCovidData([]);
      }
    } catch (err) {
      console.error(err);
      setCovidData([]);
    }
  };



  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    fetchOverviewData();
  }, [selectedYear, selectedIndustry, selectedState]);

  useEffect(() => {
    fetchCovidData();
  }, []);

  // ---------------------------
  // Render
  // ---------------------------
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

        {/* Filters (Overview only) */}
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

        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {!loading && !error && activeTab === 'overview' && (
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

        {/* COVID Tab */}
        {!loading && activeTab === 'covid' && (
          <div className="space-y-10">
            <CovidImpactBarCharts data={covidData} />
          </div>
        )}
      </main>
    </div>
  );
}
