import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { IndustryMetric, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const industry = searchParams.get('industry');

    let sql = `
      SELECT
        m.industry,
        COALESCE(n.industry_name, m.industry) as industry_name,
        m.total_applications,
        m.unique_employers,
        m.avg_annual_wage,
        m.median_annual_wage,
        m.total_annual_wages,
        m.fiscal_year
      FROM mv_industry_metrics m
      LEFT JOIN naics_lookup n ON m.industry = n.naics_code
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

    // Add industry filter if provided
    if (industry) {
      sql += ` AND industry = $${paramCount}`;
      params.push(industry);
      paramCount++;
    }

    sql += ` ORDER BY total_applications DESC`;

    const results = await query<IndustryMetric>(sql, params);

    // Ensure numeric fields are properly converted from strings
    const normalizedResults = results.map(row => ({
      ...row,
      total_applications: Number(row.total_applications),
      unique_employers: Number(row.unique_employers),
      avg_annual_wage: Number(row.avg_annual_wage),
      median_annual_wage: Number(row.median_annual_wage),
      total_annual_wages: Number(row.total_annual_wages),
      fiscal_year: Number(row.fiscal_year),
    }));

    const response: ApiResponse<IndustryMetric[]> = {
      success: true,
      data: normalizedResults,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching industry metrics:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
