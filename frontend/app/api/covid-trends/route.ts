import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  const pool = getPool();

  const query = `
    SELECT
      worksite_state,
      ROUND(
        (SUM(app_count_2020) - SUM(app_count_2019))::numeric
        / NULLIF(SUM(app_count_2019), 0) * 100,
        2
      ) AS pct_change_2019_2020
    FROM mv_covid_trend_analysis
    WHERE worksite_state IS NOT NULL
    GROUP BY worksite_state
    ORDER BY pct_change_2019_2020 ASC;
  `;


  try {
    const { rows } = await pool.query(query);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to fetch covid trends' },
      { status: 500 }
    );
  }
}
