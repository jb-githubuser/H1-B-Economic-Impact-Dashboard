'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

interface Row {
  worksite_state: string;
  pct_change_2019_2020: number;
}

export default function CovidImpactStateBarCharts({ data }: { data: Row[] }) {
  if (!data.length) {
    return <p className="text-slate-500">No state-level COVID impact data.</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        COVID Impact by State
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        % change in H-1B applications (2019 → 2020)
      </p>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 15)} layout="vertical">
            <XAxis type="number" tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="worksite_state" width={80} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Bar dataKey="pct_change_2019_2020" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
