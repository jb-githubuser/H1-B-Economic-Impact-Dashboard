'use client';

import { useEffect, useState } from 'react';
import CovidTrendCharts from '@/components/CovidTrendCharts';

interface CovidTrendRow {
  industry: string;
  worksite_state: string;
  app_count_2019: number;
  app_count_2020: number;
  app_count_2021: number;
  app_count_change_2019_to_2020_pct: number | null;
  app_count_change_2020_to_2021_pct: number | null;
  avg_wage_2019: number | null;
  avg_wage_2020: number | null;
  avg_wage_2021: number | null;
}

export default function CovidTrendsPage() {
  const [data, setData] = useState<CovidTrendRow[]>([]);
  const [industry, setIndustry] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [industry, state]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (industry) params.append('industry', industry);
    if (state) params.append('state', state);

    const res = await fetch(`/api/covid-trends?${params.toString()}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        COVID-Era H-1B Labor Market Shifts
      </h1>
      <p className="text-slate-600 mb-6">
        Comparing application volume and wage trends before, during, and after COVID-19.
      </p>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          placeholder="Filter by Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          placeholder="Filter by State (e.g. CA)"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading COVID trends…</div>
      ) : (
        <CovidTrendCharts data={data} />
      )}
    </div>
  );
}
