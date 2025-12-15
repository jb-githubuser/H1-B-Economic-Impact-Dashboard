import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT *
    FROM mv_covid_state_impact
    ORDER BY pct_change_2019_2020 ASC
  `);

  return NextResponse.json(rows);
}
