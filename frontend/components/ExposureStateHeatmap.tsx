'use client';
import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
// @ts-ignore
} from 'react-simple-maps';

interface ExposureStateRow {
  worksite_state: string;
  exposure_score: number;
  estimated_fee_shock_millions: number;
  total_applications: number;
  hhi_concentration: number;
}

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const STATE_NAME_TO_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
  'Puerto Rico': 'PR'
};

export default function ExposureStateHeatmap({ data }: { data: ExposureStateRow[] }) {
  const [tooltipContent, setTooltipContent] = useState<string>('');

  const stateMap = useMemo(() => {
    const map = new Map<string, ExposureStateRow>();
    data.forEach(d => {
      if (d.worksite_state) {
        map.set(d.worksite_state, d);
      }
    });
    return map;
  }, [data]);

  const scores = data.map(d => d.exposure_score).filter(s => s > 0);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore;

  const getColor = (stateName: string) => {
    const stateCode = STATE_NAME_TO_ABBR[stateName];
    const stateData = stateCode ? stateMap.get(stateCode) : null;
    const score = stateData?.exposure_score || 0;
    
    if (score === 0) return '#e2e8f0';
    
    const normalized = (score - minScore) / range;
    
    if (normalized >= 0.8) return '#dc2626';
    if (normalized >= 0.6) return '#ea580c';
    if (normalized >= 0.4) return '#f59e0b';
    if (normalized >= 0.2) return '#fbbf24';
    return '#10b981';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        State Exposure Map
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Policy vulnerability by state. Hover for details. Range: {minScore.toFixed(1)} - {maxScore.toFixed(1)}
      </p>

      {tooltipContent && (
        <div className="mb-2 text-center">
          <div className="inline-block bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {tooltipContent}
          </div>
        </div>
      )}

      <div className="w-full">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{
            scale: 1000,
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }: any) =>
              geographies.map((geo: any) => {
                const stateName = geo.properties.name;
                const stateCode = STATE_NAME_TO_ABBR[stateName];
                const stateData = stateCode ? stateMap.get(stateCode) : null;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(stateName)}
                    stroke="#fff"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      if (stateData) {
                        setTooltipContent(
                          `${stateName} (${stateCode}): Score ${Number(stateData.exposure_score).toFixed(1)} | ${Number(stateData.total_applications).toLocaleString()} apps | $${Number(stateData.estimated_fee_shock_millions).toFixed(1)}M impact`
                        );
                      } else {
                        setTooltipContent(`${stateName}: No data`);
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipContent('');
                    }}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: '#6366f1',
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      <div className="mt-4 flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-600" />
          High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-600" />
          
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          Low
        </span>
      </div>
    </div>
  );
}
