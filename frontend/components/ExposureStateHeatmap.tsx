'use client';
import { useMemo } from 'react';

interface ExposureStateRow {
  worksite_state: string;
  exposure_score: number;
  estimated_fee_shock_millions: number;
  total_applications: number;
  hhi_concentration: number;
}

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

  const scores = data.map(d => d.exposure_score).filter(s => s > 0);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore;

  const getColor = (score: number | undefined) => {
    if (!score || score === 0) return '#e2e8f0';
    
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
        Policy vulnerability by state. Hover for details. Scale: {minScore.toFixed(1)} - {maxScore.toFixed(1)}
      </p>
      
      <svg viewBox="0 0 960 600" className="w-full h-auto">
        {/* Alaska */}
        <g transform="translate(50, 500)">
          {stateMap.has('AK') && (
            <>
              <path d="M 0,0 L 20,10 L 15,25 L -5,20 Z" fill={getColor(stateMap.get('AK')?.exposure_score)} stroke="#fff" strokeWidth="1" />
              <text x="7" y="15" className="text-xs fill-white" style={{fontSize: '8px'}}>AK</text>
              <title>AK: {Number(stateMap.get('AK')?.exposure_score).toFixed(1)}</title>
            </>
          )}
        </g>
        
        {/* Hawaii */}
        <g transform="translate(200, 520)">
          {stateMap.has('HI') && (
            <>
              <circle cx="0" cy="0" r="8" fill={getColor(stateMap.get('HI')?.exposure_score)} stroke="#fff" strokeWidth="1" />
              <text x="0" y="2" textAnchor="middle" className="text-xs fill-white" style={{fontSize: '7px'}}>HI</text>
              <title>HI: {Number(stateMap.get('HI')?.exposure_score).toFixed(1)}</title>
            </>
          )}
        </g>

        {/* West Coast */}
        <path d="M 100,50 L 110,100 L 105,150 L 95,200 L 100,250 L 110,300 L 105,350 L 95,400 L 90,450 L 100,500 L 120,490 L 130,440 L 140,390 L 145,340 L 140,290 L 145,240 L 150,190 L 155,140 L 150,90 L 140,40 Z" 
          fill={getColor(stateMap.get('WA')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="115" y="120" className="text-xs fill-white font-semibold">WA</text>
        
        <path d="M 105,350 L 115,350 L 125,400 L 135,450 L 125,500 L 100,500 L 90,450 L 95,400 Z"
          fill={getColor(stateMap.get('OR')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="110" y="425" className="text-xs fill-white font-semibold">OR</text>
        
        <path d="M 60,450 L 80,400 L 95,350 L 115,350 L 125,400 L 135,450 L 125,500 L 100,550 L 75,540 L 65,500 Z"
          fill={getColor(stateMap.get('CA')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="95" y="450" className="text-xs fill-white font-semibold">CA</text>

        {/* Mountain */}
        <path d="M 150,90 L 200,80 L 210,130 L 200,180 L 155,140 Z"
          fill={getColor(stateMap.get('MT')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="180" y="130" className="text-xs fill-white font-semibold">MT</text>
        
        <path d="M 140,190 L 190,190 L 195,240 L 145,240 Z"
          fill={getColor(stateMap.get('ID')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="165" y="220" className="text-xs fill-white font-semibold">ID</text>
        
        <path d="M 200,180 L 250,170 L 245,220 L 200,230 Z"
          fill={getColor(stateMap.get('WY')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="220" y="205" className="text-xs fill-white font-semibold">WY</text>
        
        <path d="M 145,240 L 195,240 L 200,290 L 150,290 Z"
          fill={getColor(stateMap.get('NV')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="170" y="270" className="text-xs fill-white font-semibold">NV</text>
        
        <path d="M 195,240 L 245,230 L 240,280 L 200,290 Z"
          fill={getColor(stateMap.get('UT')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="218" y="265" className="text-xs fill-white font-semibold">UT</text>
        
        <path d="M 245,220 L 295,210 L 290,260 L 240,270 Z"
          fill={getColor(stateMap.get('CO')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="265" y="245" className="text-xs fill-white font-semibold">CO</text>
        
        <path d="M 150,290 L 200,290 L 205,350 L 155,350 Z"
          fill={getColor(stateMap.get('AZ')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="175" y="325" className="text-xs fill-white font-semibold">AZ</text>
        
        <path d="M 200,290 L 250,280 L 245,340 L 205,350 Z"
          fill={getColor(stateMap.get('NM')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="222" y="320" className="text-xs fill-white font-semibold">NM</text>

        {/* Plains */}
        <path d="M 250,50 L 300,45 L 295,95 L 250,90 Z"
          fill={getColor(stateMap.get('ND')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="270" y="75" className="text-xs fill-white font-semibold">ND</text>
        
        <path d="M 250,90 L 295,95 L 290,145 L 245,140 Z"
          fill={getColor(stateMap.get('SD')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="265" y="120" className="text-xs fill-white font-semibold">SD</text>
        
        <path d="M 245,140 L 290,145 L 285,195 L 240,190 Z"
          fill={getColor(stateMap.get('NE')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="260" y="170" className="text-xs fill-white font-semibold">NE</text>
        
        <path d="M 240,190 L 285,195 L 280,245 L 245,240 Z"
          fill={getColor(stateMap.get('KS')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="258" y="220" className="text-xs fill-white font-semibold">KS</text>
        
        <path d="M 245,240 L 290,245 L 285,295 L 250,290 Z"
          fill={getColor(stateMap.get('OK')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="263" y="270" className="text-xs fill-white font-semibold">OK</text>
        
        <path d="M 250,290 L 295,295 L 310,390 L 280,390 L 265,350 Z"
          fill={getColor(stateMap.get('TX')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="278" y="340" className="text-xs fill-white font-semibold">TX</text>

        {/* Midwest */}
        <path d="M 300,45 L 350,40 L 370,90 L 345,95 L 295,95 Z"
          fill={getColor(stateMap.get('MN')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="325" y="75" className="text-xs fill-white font-semibold">MN</text>
        
        <path d="M 295,95 L 345,95 L 340,145 L 290,145 Z"
          fill={getColor(stateMap.get('IA')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="313" y="125" className="text-xs fill-white font-semibold">IA</text>
        
        <path d="M 290,145 L 340,145 L 335,195 L 285,195 Z"
          fill={getColor(stateMap.get('MO')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="308" y="175" className="text-xs fill-white font-semibold">MO</text>
        
        <path d="M 285,195 L 335,195 L 330,245 L 280,245 Z"
          fill={getColor(stateMap.get('AR')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="303" y="225" className="text-xs fill-white font-semibold">AR</text>
        
        <path d="M 285,295 L 330,295 L 335,345 L 310,390 L 280,390 Z"
          fill={getColor(stateMap.get('LA')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="305" y="335" className="text-xs fill-white font-semibold">LA</text>
        
        <path d="M 370,90 L 420,85 L 425,135 L 375,135 L 345,95 Z"
          fill={getColor(stateMap.get('WI')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="390" y="115" className="text-xs fill-white font-semibold">WI</text>
        
        <path d="M 340,145 L 375,135 L 425,135 L 420,185 L 335,195 Z"
          fill={getColor(stateMap.get('IL')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="370" y="170" className="text-xs fill-white font-semibold">IL</text>
        
        <path d="M 425,85 L 475,80 L 480,130 L 425,135 Z"
          fill={getColor(stateMap.get('MI')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="445" y="110" className="text-xs fill-white font-semibold">MI</text>
        
        <path d="M 420,185 L 470,180 L 465,230 L 415,235 Z"
          fill={getColor(stateMap.get('IN')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="440" y="210" className="text-xs fill-white font-semibold">IN</text>
        
        <path d="M 415,235 L 465,230 L 460,280 L 410,285 Z"
          fill={getColor(stateMap.get('KY')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="435" y="260" className="text-xs fill-white font-semibold">KY</text>
        
        <path d="M 410,285 L 460,280 L 455,330 L 405,335 Z"
          fill={getColor(stateMap.get('TN')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="430" y="310" className="text-xs fill-white font-semibold">TN</text>
        
        <path d="M 330,245 L 375,240 L 370,290 L 330,295 Z"
          fill={getColor(stateMap.get('MS')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="348" y="270" className="text-xs fill-white font-semibold">MS</text>
        
        <path d="M 375,240 L 420,235 L 415,285 L 370,290 Z"
          fill={getColor(stateMap.get('AL')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="393" y="265" className="text-xs fill-white font-semibold">AL</text>

        {/* Southeast */}
        <path d="M 465,230 L 515,225 L 510,275 L 460,280 Z"
          fill={getColor(stateMap.get('OH')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="485" y="255" className="text-xs fill-white font-semibold">OH</text>
        
        <path d="M 510,275 L 555,270 L 550,320 L 505,325 Z"
          fill={getColor(stateMap.get('WV')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="528" y="300" className="text-xs fill-white font-semibold">WV</text>
        
        <path d="M 550,320 L 595,315 L 590,365 L 545,370 Z"
          fill={getColor(stateMap.get('VA')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="568" y="345" className="text-xs fill-white font-semibold">VA</text>
        
        <path d="M 545,370 L 590,365 L 585,415 L 540,420 Z"
          fill={getColor(stateMap.get('NC')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="563" y="395" className="text-xs fill-white font-semibold">NC</text>
        
        <path d="M 540,420 L 585,415 L 580,465 L 535,470 Z"
          fill={getColor(stateMap.get('SC')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="558" y="445" className="text-xs fill-white font-semibold">SC</text>
        
        <path d="M 405,335 L 455,330 L 460,380 L 455,430 L 410,435 Z"
          fill={getColor(stateMap.get('GA')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="430" y="385" className="text-xs fill-white font-semibold">GA</text>
        
        <path d="M 455,430 L 500,425 L 535,470 L 545,520 L 500,530 L 460,500 Z"
          fill={getColor(stateMap.get('FL')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="495" y="480" className="text-xs fill-white font-semibold">FL</text>

        {/* Northeast */}
        <path d="M 510,225 L 560,220 L 555,270 Z"
          fill={getColor(stateMap.get('PA')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="535" y="245" className="text-xs fill-white font-semibold">PA</text>
        
        <path d="M 560,220 L 610,215 L 605,265 L 555,270 Z"
          fill={getColor(stateMap.get('NY')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="580" y="245" className="text-xs fill-white font-semibold">NY</text>
        
        <path d="M 610,180 L 630,175 L 625,195 L 615,200 Z"
          fill={getColor(stateMap.get('VT')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="618" y="190" className="text-xs fill-white" style={{fontSize: '7px'}}>VT</text>
        
        <path d="M 630,175 L 650,170 L 648,190 L 625,195 Z"
          fill={getColor(stateMap.get('NH')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="638" y="185" className="text-xs fill-white" style={{fontSize: '7px'}}>NH</text>
        
        <path d="M 650,170 L 670,165 L 668,185 L 648,190 Z"
          fill={getColor(stateMap.get('ME')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="658" y="180" className="text-xs fill-white" style={{fontSize: '7px'}}>ME</text>
        
        <path d="M 625,195 L 648,190 L 655,210 L 630,215 Z"
          fill={getColor(stateMap.get('MA')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="638" y="205" className="text-xs fill-white" style={{fontSize: '7px'}}>MA</text>
        
        <path d="M 655,210 L 665,208 L 663,218 L 652,220 Z"
          fill={getColor(stateMap.get('RI')?.exposure_score)} stroke="#fff" strokeWidth="1" />
        <text x="658" y="215" className="text-xs fill-white" style={{fontSize: '6px'}}>RI</text>
        
        <path d="M 630,215 L 655,210 L 650,230 L 625,235 Z"
          fill={getColor(stateMap.get('CT')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="638" y="225" className="text-xs fill-white" style={{fontSize: '7px'}}>CT</text>
        
        <path d="M 605,265 L 625,260 L 620,280 L 600,285 Z"
          fill={getColor(stateMap.get('NJ')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="610" y="275" className="text-xs fill-white" style={{fontSize: '7px'}}>NJ</text>
        
        <path d="M 600,285 L 620,280 L 615,295 L 595,300 Z"
          fill={getColor(stateMap.get('DE')?.exposure_score)} stroke="#fff" strokeWidth="1" />
        <text x="605" y="290" className="text-xs fill-white" style={{fontSize: '6px'}}>DE</text>
        
        <path d="M 595,300 L 615,295 L 610,315 L 590,320 Z"
          fill={getColor(stateMap.get('MD')?.exposure_score)} stroke="#fff" strokeWidth="2" />
        <text x="602" y="310" className="text-xs fill-white" style={{fontSize: '7px'}}>MD</text>
      </svg>

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
