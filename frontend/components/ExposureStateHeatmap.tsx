'use client';
import { useMemo } from 'react';

interface ExposureStateRow {
  worksite_state: string;
  exposure_score: number;
  estimated_fee_shock_millions: number;
  total_applications: number;
  hhi_concentration: number;
}

const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  AK: { x: 10, y: 450 }, HI: { x: 180, y: 450 }, 
  WA: { x: 70, y: 50 }, OR: { x: 70, y: 120 }, CA: { x: 50, y: 200 },
  ID: { x: 140, y: 100 }, NV: { x: 110, y: 170 }, UT: { x: 160, y: 170 },
  AZ: { x: 140, y: 240 }, MT: { x: 200, y: 60 }, WY: { x: 200, y: 130 },
  CO: { x: 220, y: 200 }, NM: { x: 200, y: 270 }, ND: { x: 310, y: 50 },
  SD: { x: 310, y: 120 }, NE: { x: 310, y: 170 }, KS: { x: 320, y: 220 },
  OK: { x: 330, y: 280 }, TX: { x: 300, y: 350 }, MN: { x: 380, y: 80 },
  IA: { x: 380, y: 160 }, MO: { x: 400, y: 210 }, AR: { x: 400, y: 280 },
  LA: { x: 410, y: 350 }, WI: { x: 470, y: 100 }, IL: { x: 470, y: 180 },
  MI: { x: 540, y: 120 }, IN: { x: 520, y: 190 }, KY: { x: 530, y: 240 },
  TN: { x: 520, y: 280 }, MS: { x: 470, y: 330 }, AL: { x: 510, y: 330 },
  OH: { x: 590, y: 180 }, WV: { x: 620, y: 230 }, VA: { x: 660, y: 240 },
  NC: { x: 660, y: 290 }, SC: { x: 640, y: 330 }, GA: { x: 600, y: 350 },
  FL: { x: 650, y: 400 }, PA: { x: 650, y: 170 }, NY: { x: 710, y: 130 },
  VT: { x: 730, y: 80 }, NH: { x: 750, y: 90 }, ME: { x: 770, y: 60 },
  MA: { x: 760, y: 110 }, RI: { x: 770, y: 125 }, CT: { x: 750, y: 140 },
  NJ: { x: 720, y: 160 }, DE: { x: 710, y: 185 }, MD: { x: 690, y: 200 },
};

export default function ExposureStateHeatmap({ data }: { data: ExposureStateRow[] }) {
  const stateMap = useMemo(() => {
    const map = new Map<string, ExposureStateRow>();
    data.forEach(d => {
      if (d.worksite_state) {
        map.set(d.worksite_state, d);
      }
    });
    return map;
  }, [data]);

  const getColor = (score: number | undefined) => {
    if (!score) return '#e2e8f0';
    if (score >= 30) return '#dc2626';
    if (score >= 20) return '#ea580c';
    if (score >= 10) return '#f59e0b';
    if (score >= 5) return '#fbbf24';
    return '#10b981';
  };

  const maxScore = Math.max(...data.map(d => d.exposure_score || 0));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        State Exposure Map
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Policy vulnerability by state. Hover for details.
      </p>
      
      <svg viewBox="0 0 800 500" className="w-full h-auto">
        {Object.entries(STATE_POSITIONS).map(([state, pos]) => {
          const stateData = stateMap.get(state);
          const score = stateData?.exposure_score || 0;
          const color = getColor(score);
          
          return (
            <g key={state}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                fill={color}
                stroke="#fff"
                strokeWidth={2}
                className="transition-all hover:r-24 cursor-pointer"
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-semibold fill-white pointer-events-none"
                style={{ fontSize: '11px' }}
              >
                {state}
              </text>
              <title>
                {state}
                {stateData ? `
Exposure Score: ${score.toFixed(1)}
Applications: ${stateData.total_applications.toLocaleString()}
Fee Impact: $${stateData.estimated_fee_shock_millions}M
HHI: ${(stateData.hhi_concentration * 100).toFixed(2)}%` : '\nNo data'}
              </title>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-600" />
          30+
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-600" />
          20-30
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          10-20
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          5-10
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          0-5
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-slate-300" />
          No data
        </span>
      </div>
    </div>
  );
}
