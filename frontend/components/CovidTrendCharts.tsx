'use client';

import { useEffect, useState } from 'react';

interface CovidTrendRow {
  industry: string;
  worksite_state: string;
  app_count_2019: number | null;
  app_count_2020: number | null;
  app_count_2021: number | null;
  app_count_change_2019_to_2020_pct: number | null;
  app_count_change_2020_to_2021_pct: number | null;
}

export default function CovidTrendCharts() {
  const [data, setData] = useState<CovidTrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCovidTrends();
  }, []);

  const fetchCovidTrends = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/covid-trends');

      if (!res.ok) {
        throw new Error('Failed to fetch COVID trends');
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-600">Loading COVID trends…</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  const topDrops = data
    .filter(d => d.app_count_change_2019_to_2020_pct !== null)
    .sort(
      (a, b) =>
        (a.app_count_change_2019_to_2020_pct ?? 0) -
        (b.app_count_change_2019_to_2020_pct ?? 0)
    )
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">
        COVID Impact on H-1B Applications
      </h2>

      <p className="text-sm text-slate-600">
        Top 10 industries with the largest decline in applications from 2019 to 2020.
      </p>

      <table className="w-full border border-slate-200 rounded-md">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">Industry</th>
            <th className="p-2 text-right">% Change (2019 → 2020)</th>
          </tr>
        </thead>
        <tbody>
          {topDrops.map((row, i) => (
            <tr key={`${row.industry}-${i}`} className="border-t">
              <td className="p-2">{row.industry}</td>
              <td className="p-2 text-right">
                {row.app_count_change_2019_to_2020_pct?.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
