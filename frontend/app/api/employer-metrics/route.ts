import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { ApiResponse, EmployerMetric } from "@/lib/types";

export async function GET(request: NextRequest) {
    try {
        const sp = request.nextUrl.searchParams;

        const year = sp.get("year");
        const industry = sp.get("industry");
        const limit = Math.min(parseInt(sp.get("limit") || "20", 10), 100);

        let sql = `
      SELECT
        m.emp_id,
        m.emp_name,
        m.industry,
        COALESCE(n.industry_name, m.industry) AS industry_name,
        m.total_applications,
        m.states_covered,
        m.avg_annual_wage,
        m.median_annual_wage,
        m.total_annual_wages,
        m.fiscal_year
      FROM mv_employer_metrics m
      LEFT JOIN naics_lookup n ON m.industry = n.naics_code
      WHERE 1=1
    `;

        const params: any[] = [];
        let i = 1;

        if (year) {
            sql += ` AND m.fiscal_year = $${i++}`;
            params.push(parseInt(year, 10));
        }

        if (industry) {
            sql += ` AND m.industry = $${i++}`;
            params.push(industry);
        }

        sql += ` ORDER BY m.total_applications DESC LIMIT $${i++}`;
        params.push(limit);

        const rows = await query(sql, params);

        const normalized: EmployerMetric[] = rows.map((r: any) => ({
            ...r,
            total_applications: Number(r.total_applications),
            states_covered: Number(r.states_covered),
            avg_annual_wage: Number(r.avg_annual_wage),
            median_annual_wage: Number(r.median_annual_wage),
            total_annual_wages: Number(r.total_annual_wages),
            fiscal_year: Number(r.fiscal_year),
        }));

        const response: ApiResponse<EmployerMetric[]> = { success: true, data: normalized };
        return NextResponse.json(response);
    } catch (err) {
        const response: ApiResponse = {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        };
        return NextResponse.json(response, { status: 500 });
    }
}
