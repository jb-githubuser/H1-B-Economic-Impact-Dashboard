import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const pool = getPool();
  
  try {
    const [industryResult, stateResult] = await Promise.all([
      pool.query(`
        SELECT *
        FROM mv_exposure_score_industry
        ORDER BY exposure_score DESC
      `),
      pool.query(`
        SELECT *
        FROM mv_exposure_score_state
        ORDER BY exposure_score DESC
      `)
    ]);

    return NextResponse.json({
      industries: industryResult.rows,
      states: stateResult.rows,
    });
  } catch (err) {
    console.error('Exposure scores error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch exposure scores' },
      { status: 500 }
    );
  }
}
