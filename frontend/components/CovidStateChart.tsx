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
  worksite_state: string;
  pct_change_2019_2020: number;
}

export default function CovidStateChart({ data }: { data: Row[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        COVID Impact by State (2019 → 2020)
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
              dataKey="worksite_state"
              width={80}
            />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Bar dataKey="pct_change_2019_2020" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
