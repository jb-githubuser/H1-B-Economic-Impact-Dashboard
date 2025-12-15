'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CovidRow {
  worksite_state: string;
  pct_change_2019_2020: number | string | null;
}

export default function CovidImpactStateBarCharts({ data }: { data: Row[] }) {
  const chartData = data
    .filter(
      d =>
        d.worksite_state &&
        d.pct_change_2019_2020 !== null
    )
    .map(d => ({
      state: d.worksite_state,
      change: Number(d.pct_change_2019_2020),
    }))
    .sort((a, b) => a.change - b.change)
    .slice(0, 10);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-slate-500">
        No state-level COVID impact data.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">COVID Impact by State</h3>
      <p className="text-sm text-slate-500 mb-4">% change in H-1B applications (2019 → 2020)</p>

      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="state" width={70} />
            <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
            <Bar dataKey="change" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
