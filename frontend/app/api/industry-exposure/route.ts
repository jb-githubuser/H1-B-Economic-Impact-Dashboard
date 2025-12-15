import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const query = `
    SELECT *
    FROM mv_exposure_score_industry
    ORDER BY exposure_score DESC;
  `;

  const { rows } = await pool.query(query);
  return NextResponse.json(rows);
}
