'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CovidRow {
  fiscal_year: number | string;
  total_applications: number | string;
}

export default function CovidRecoveryLineChart({ data }: { data: CovidRow[] }) {
  const chartData = data
    .map(d => ({
      year: Number(d.fiscal_year),
      apps: Number(d.total_applications),
    }))
    .filter(d => d.year >= 2019 && d.year <= 2022)
    .sort((a, b) => a.year - b.year);

  if (chartData.length === 0) {
    return <p className="text-slate-500">No recovery data available.</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        H-1B Application Recovery
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Total applications by year
      </p>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="apps"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
