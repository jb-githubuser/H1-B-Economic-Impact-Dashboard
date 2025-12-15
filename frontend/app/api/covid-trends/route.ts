import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  const pool = getPool();

  const query = `
    SELECT
      industry_name,
      app_count_change_2019_to_2020_pct
    FROM mv_covid_trend_analysis
    WHERE industry_name IS NOT NULL
      AND app_count_change_2019_to_2020_pct IS NOT NULL
    ORDER BY app_count_change_2019_to_2020_pct ASC
    LIMIT 15;
  `;

  const { rows } = await pool.query(query);
  return NextResponse.json(rows);
}
