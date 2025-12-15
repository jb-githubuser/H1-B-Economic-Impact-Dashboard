import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const pool = getPool();

  try {
    const query = `
      SELECT
        m.industry,
        COALESCE(n.industry_name, m.industry) AS industry_name,
        m.app_count_change_2019_to_2020_pct,
        m.total_applications_2019,
        m.total_applications_2020
      FROM mv_covid_trend_analysis m
      LEFT JOIN naics_lookup n
        ON m.industry = n.naics_code
      WHERE m.app_count_change_2019_to_2020_pct IS NOT NULL
      ORDER BY m.app_count_change_2019_to_2020_pct ASC
      LIMIT 25;
    `;

    const { rows } = await pool.query(query);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('COVID trends API error:', err);
    return NextResponse.json(
      { error: 'Failed to load COVID trends' },
      { status: 500 }
    );
  }
}
