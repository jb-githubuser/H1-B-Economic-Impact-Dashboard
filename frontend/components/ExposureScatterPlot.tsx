'use client';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  Legend,
} from 'recharts';

interface ExposureRow {
  industry: string;
  industry_name: string;
  exposure_score: number;
  hhi_concentration: number;
  total_applications: number;
  volume_share_pct: number;
}

export default function ExposureScatterPlot({ data }: { data: ExposureRow[] }) {
  const chartData = data
    .filter(d => d.industry_name && d.exposure_score && d.hhi_concentration)
    .map(d => ({
      industry: d.industry_name,
      exposure: Number(d.exposure_score),
      hhi: Number(d.hhi_concentration) * 100,
      apps: Number(d.total_applications),
      volumeShare: Number(d.volume_share_pct),
    }))
    .slice(0, 30);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-slate-500">
        No exposure data available.
      </div>
    );
  }

  const getColor = (exposure: number) => {
    if (exposure >= 30) return '#dc2626';
    if (exposure >= 20) return '#ea580c';
    if (exposure >= 10) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        Industry Exposure vs. Employer Concentration
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Bubble size represents application volume. Higher HHI = fewer dominant employers.
      </p>
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <XAxis
              type="number"
              dataKey="hhi"
              name="HHI Concentration"
              label={{
                value: 'Employer Concentration (HHI %)',
                position: 'insideBottom',
                offset: -10,
              }}
              tickFormatter={v => `${v.toFixed(1)}%`}
            />
            <YAxis
              type="number"
              dataKey="exposure"
              name="Exposure Score"
              label={{
                value: 'Exposure Score',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <ZAxis
              type="number"
              dataKey="apps"
              range={[100, 2000]}
              name="Applications"
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }: any) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-slate-200 rounded shadow-lg p-3">
                    <p className="font-semibold text-sm mb-1">{d.industry}</p>
                    <p className="text-xs text-slate-600">
                      Exposure: <span className="font-medium">{d.exposure.toFixed(1)}</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      HHI: <span className="font-medium">{d.hhi.toFixed(2)}%</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      Apps: <span className="font-medium">{d.apps.toLocaleString()}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              content={() => (
                <div className="flex justify-center gap-4 text-xs mb-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-600" />
                    Critical (30+)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-orange-600" />
                    High (20-30)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Moderate (10-20)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    Low (0-10)
                  </span>
                </div>
              )}
            />
            <Scatter data={chartData}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.exposure)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
