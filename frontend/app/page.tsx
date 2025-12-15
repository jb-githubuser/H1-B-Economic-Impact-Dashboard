'use client';

import { useEffect, useState } from 'react';
import { IndustryMetric, StateMetric, ApiResponse } from '@/lib/types';

// ---------- EXISTING OVERVIEW COMPONENTS ----------
import IndustryCharts from '@/components/IndustryCharts';
import StateCharts from '@/components/StateCharts';
import StateHeatmap from '@/components/StateHeatmap';
import DashboardFilters from '@/components/DashboardFilters';

// ---------- NEW COVID COMPONENTS ----------
import CovidIndustryChart from '@/components/CovidIndustryChart';
import CovidStateChart from '@/components/CovidStateChart';

export default function Dashboard() {
  // ---------------------------
  // STATE (UNCHANGED)
  // ---------------------------
  const [industryData, setIndustryData] = useState<IndustryMetric[]>([]);
  const [stateData, setStateData] = useState<StateMetric[]>([]);
  const [covidIndustryData, setCovidIndustryData] = useState<any[]>([]);
  const [covidStateData, setCovidStateData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'covid'>('overview');

  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');

  // ---------------------------
  // FETCH OVERVIEW DATA (UNCHANGED)
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
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // FETCH COVID DATA (SEPARATE, SIMPLE)
  // ---------------------------
  const fetchCovidData = async () => {
    try {
      const [industryRes, stateRes] = await Promise.all([
        fetch('/api/covid-industry-impact'),
        fetch('/api/covid-state-impact'),
      ]);

      setCovidIndustryData(await industryRes.json());
      setCovidStateData(await stateRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------
  // EFFECTS
  // ---------------------------
  useEffect(() => {
    fetchOverviewData();
  }, [selectedYear, selectedIndustry, selectedState]);

  useEffect(() => {
    fetchCovidData();
  }, []);

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900">
            H1-B Economic Impact Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600 pb-2' : 'pb-2 text-slate-500'}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('covid')}
              className={activeTab === 'covid' ? 'border-b-2 border-blue-600 text-blue-600 pb-2' : 'pb-2 text-slate-500'}
            >
              COVID Trends
            </button>
          </nav>
        </div>

        {/* ---------------- OVERVIEW TAB (UNTOUCHED) ---------------- */}
        {!loading && !error && activeTab === 'overview' && (
          <>
            <DashboardFilters
              selectedYear={selectedYear}
              selectedIndustry={selectedIndustry}
              selectedState={selectedState}
              onYearChange={setSelectedYear}
              onIndustryChange={setSelectedIndustry}
              onStateChange={setSelectedState}
              industries={industryData.map(d => ({
                value: d.industry_name,
                label: d.industry_name,
              }))}
              states={stateData.map(d => d.worksite_state)}
            />

            <div className="mb-8">
              <StateHeatmap data={stateData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <IndustryCharts data={industryData} />
              <StateCharts data={stateData} />
            </div>
          </>
        )}

        {/* ---------------- COVID TAB (ONLY NEW CODE) ---------------- */}
        {activeTab === 'covid' && (
          <div className="space-y-12">
            <CovidIndustryChart data={covidIndustryData} />
            <CovidStateChart data={covidStateData} />
          </div>
        )}
      </main>
    </div>
  );
}
