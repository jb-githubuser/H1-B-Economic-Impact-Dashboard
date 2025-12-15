'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CovidRow {
  industry: string;
  app_count_change_2019_to_2020_pct: number | string;
}

export default function CovidImpactBarChart({ data }: { data: CovidRow[] }) {
  const chartData = data
    .filter(d => d.app_count_change_2019_to_2020_pct !== null)
    .map(d => ({
      industry: d.industry,
      change: Number(d.app_count_change_2019_to_2020_pct),
    }))
    .sort((a, b) => a.change - b.change)
    .slice(0, 10);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        Industries Most Impacted by COVID
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        % change in H-1B applications (2019 → 2020)
      </p>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis
              type="number"
              tickFormatter={v => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="industry"
              width={90}
            />
            <Tooltip
              formatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Bar dataKey="change">
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.change < -80 ? '#dc2626' : '#f97316'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
