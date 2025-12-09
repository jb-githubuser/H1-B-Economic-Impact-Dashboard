'use client';

import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
// @ts-ignore - react-simple-maps doesn't have TypeScript types for React 19
} from 'react-simple-maps';
import { StateMetric } from '@/lib/types';

interface StateHeatmapProps {
  data: StateMetric[];
}

// GeoJSON URL for US states
const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// Color scale from light to dark blue
const COLOR_SCALE = [
  '#f0f9ff', // Very light blue (0-20%)
  '#bae6fd', // Light blue (20-40%)
  '#7dd3fc', // Medium-light blue (40-60%)
  '#38bdf8', // Medium blue (60-80%)
  '#0284c7', // Dark blue (80-100%)
];

// Map state names to abbreviations
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

export default function StateHeatmap({ data }: StateHeatmapProps) {
  const [tooltipContent, setTooltipContent] = useState<string>('');

  // Create a map of state code to total applications
  const stateDataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((item) => {
      const existing = map.get(item.worksite_state) || 0;
      // Convert to number to handle cases where DB returns strings
      const applications = Number(item.total_applications);
      map.set(item.worksite_state, existing + applications);
    });
    return map;
  }, [data]);

  // Find max value for color scaling
  const maxApplications = useMemo(() => {
    return Math.max(...Array.from(stateDataMap.values()), 1);
  }, [stateDataMap]);

  // Get color based on application count
  const getColor = (stateName: string) => {
    // Convert state name to abbreviation to look up in our data
    const stateCode = STATE_NAME_TO_ABBR[stateName];
    const count = stateCode ? stateDataMap.get(stateCode) || 0 : 0;
    if (count === 0) return '#e5e7eb'; // Gray for no data

    const percentage = count / maxApplications;
    if (percentage < 0.2) return COLOR_SCALE[0];
    if (percentage < 0.4) return COLOR_SCALE[1];
    if (percentage < 0.6) return COLOR_SCALE[2];
    if (percentage < 0.8) return COLOR_SCALE[3];
    return COLOR_SCALE[4];
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">
        H-1B Applications by State - Geographic Heatmap
      </h2>

      {/* Tooltip Display */}
      {tooltipContent && (
        <div className="mb-2 text-center">
          <div className="inline-block bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {tooltipContent}
          </div>
        </div>
      )}

      <div className="w-full" style={{ maxWidth: '100%', height: 'auto' }}>
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{
            scale: 1000,
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }: any) =>
              geographies.map((geo: any) => {
                const stateName = geo.properties.name; // State name from topojson
                const stateCode = STATE_NAME_TO_ABBR[stateName];
                const applications = stateCode ? stateDataMap.get(stateCode) || 0 : 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(stateName)}
                    stroke="#fff"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      setTooltipContent(
                        `${stateName}${stateCode ? ` (${stateCode})` : ''}: ${formatNumber(applications)} applications`
                      );
                    }}
                    onMouseLeave={() => {
                      setTooltipContent('');
                    }}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: '#f97316',
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

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Fewer Applications</span>
          <div className="flex gap-1">
            {COLOR_SCALE.map((color, i) => (
              <div
                key={i}
                className="w-8 h-4 border border-gray-300"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">More Applications</span>
        </div>
        <div className="text-sm text-gray-600">
          Max: {formatNumber(maxApplications)} applications
        </div>
      </div>
    </div>
  );
}
