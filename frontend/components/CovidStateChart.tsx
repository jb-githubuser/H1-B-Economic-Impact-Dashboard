'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CovidStateRow {
  worksite_state: string;
  pct_change_2019_2020: number | string;
}

export default function CovidStateChart({
  data,
}: {
  data: CovidStateRow[];
}) {
  const chartData = data
    .filter(d => d.worksite_state && d.pct_change_2019_2020 !== null)
    .map(d => ({
      worksite_state: d.worksite_state,
      pct_change_2019_2020: Number(d.pct_change_2019_2020),
    }))
    .sort((a, b) => a.pct_change_2019_2020 - b.pct_change_2019_2020)
    .slice(0, 15);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-slate-500">
        No state-level COVID impact data.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        COVID Impact by State
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        % change in H-1B applications (2019 → 2020)
      </p>

      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" tickFormatter={v => `${v}%`} />
            <YAxis
              type="category"
              dataKey="worksite_state"
              width={80}
            />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Bar dataKey="pct_change_2019_2020" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
