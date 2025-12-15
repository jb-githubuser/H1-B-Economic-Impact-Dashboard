import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  const pool = getPool();
  
  const industryQuery = `
    SELECT
      c.industry,
      n.industry_name,
      c.app_count_change_2019_to_2020_pct,
      c.worksite_state,
      ROUND(
        (c.app_count_2020 - c.app_count_2019)::numeric
        / NULLIF(c.app_count_2019, 0) * 100,
        2
      ) AS pct_change_2019_2020
    FROM mv_covid_trend_analysis c
    LEFT JOIN naics_lookup n
      ON c.industry = n.naics_code
    WHERE c.app_count_change_2019_to_2020_pct IS NOT NULL
       OR (c.app_count_2019 > 0 AND c.app_count_2020 IS NOT NULL)
    ORDER BY c.app_count_change_2019_to_2020_pct ASC NULLS LAST
    LIMIT 200;
  `;

  try {
    const { rows } = await pool.query(industryQuery);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('COVID trends error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch covid trends' },
      { status: 500 }
    );
  }
}
