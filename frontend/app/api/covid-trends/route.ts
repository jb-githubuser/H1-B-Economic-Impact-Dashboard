import { NextRequest, NextResponse } from "next/server";
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) { 
  const { searchParams } = new URL(req.url);

  const industry = searchParams.get("industry");
  const state = searchParams.get("state");

  const conditions: string[] = [];
  const values: any[] = [];

  if (industry) {
    values.push(industry);
    conditions.push(`industry = $${values.length}`);
  }

  if (state) {
    values.push(state);
    conditions.push(`state = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT *
    FROM mv_covid_trend_analysis
    ${whereClause}
    ORDER BY industry, state;
  `;

  const { rows } = await pool.query(query, values);
  return NextResponse.json(rows);
}
