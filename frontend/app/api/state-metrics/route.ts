import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { StateMetric, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const state = searchParams.get('state');

    let sql = `
      SELECT
        worksite_state,
        total_applications,
        unique_employers,
        avg_annual_wage,
        total_annual_wages,
        fiscal_year
      FROM mv_state_metrics
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    // Add year filter if provided
    if (year) {
      sql += ` AND fiscal_year = $${paramCount}`;
      params.push(parseInt(year));
      paramCount++;
    }

    // Add state filter if provided
    if (state) {
      sql += ` AND worksite_state = $${paramCount}`;
      params.push(state);
      paramCount++;
    }

    sql += ` ORDER BY total_applications DESC`;

    const results = await query<StateMetric>(sql, params);

    // Ensure numeric fields are properly converted from strings
    const normalizedResults = results.map(row => ({
      ...row,
      total_applications: Number(row.total_applications),
      unique_employers: Number(row.unique_employers),
      avg_annual_wage: Number(row.avg_annual_wage),
      total_annual_wages: Number(row.total_annual_wages),
      fiscal_year: Number(row.fiscal_year),
    }));

    const response: ApiResponse<StateMetric[]> = {
      success: true,
      data: normalizedResults,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching state metrics:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
