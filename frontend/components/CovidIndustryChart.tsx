'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Row {
  industry_name: string;
  app_count_change_2019_to_2020_pct: number;
}

export default function CovidIndustryChart({ data }: { data: Row[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        COVID Impact by Industry (2019 → 2020)
      </h3>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis
              type="number"
              tickFormatter={v => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="industry_name"
              width={280}
            />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Bar dataKey="app_count_change_2019_to_2020_pct" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
