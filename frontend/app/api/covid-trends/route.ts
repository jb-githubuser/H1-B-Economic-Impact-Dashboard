import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  const pool = getPool();

  const query = `
    SELECT
      c.industry,
      n.industry_name,
      c.app_count_change_2019_to_2020_pct
    FROM mv_covid_trend_analysis c
    LEFT JOIN naics_lookup n
      ON c.industry = n.naics_code
    WHERE c.app_count_change_2019_to_2020_pct IS NOT NULL
    ORDER BY c.app_count_change_2019_to_2020_pct ASC
    LIMIT 50;
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
