'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

interface Props {
  data: any[];
}

export default function CovidTrendCharts({ data }: Props) {
  const topIndustries = data
    .filter(d => d.app_count_change_2019_to_2020_pct !== null)
    .sort((a, b) =>
      a.app_count_change_2019_to_2020_pct -
      b.app_count_change_2019_to_2020_pct
    )
    .slice(0, 10);

  return (
    <div className="space-y-12">
      {/* Application Change Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Largest Application Declines (2019 → 2020)
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={topIndustries} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="industry" width={180} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Bar
              dataKey="app_count_change_2019_to_2020_pct"
              fill="#ef4444"
              name="Application Change (%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Wage Trend Line Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Average Wage Trends Across COVID Periods
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="industry" hide />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Legend />
            <Line
              dataKey="avg_wage_2019"
              stroke="#2563eb"
              name="2019"
              strokeWidth={2}
            />
            <Line
              dataKey="avg_wage_2020"
              stroke="#f59e0b"
              name="2020"
              strokeWidth={2}
            />
            <Line
              dataKey="avg_wage_2021"
              stroke="#16a34a"
              name="2021"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
