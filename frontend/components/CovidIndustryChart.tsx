'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CovidIndustryRow {
  industry_name: string;
  app_count_change_2019_to_2020_pct: number | string;
}

export default function CovidIndustryChart({
  data,
}: {
  data: CovidIndustryRow[];
}) {
  const chartData = data
    .filter(d => d.industry_name && d.app_count_change_2019_to_2020_pct !== null)
    .map(d => ({
      industry_name: d.industry_name,
      pct_change: Number(d.app_count_change_2019_to_2020_pct),
    }))
    .sort((a, b) => a.pct_change - b.pct_change)
    .slice(0, 15);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-slate-500">
        No industry-level COVID impact data.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        COVID Impact by Industry
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
              dataKey="industry_name"
              width={260}
            />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Bar dataKey="pct_change" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
