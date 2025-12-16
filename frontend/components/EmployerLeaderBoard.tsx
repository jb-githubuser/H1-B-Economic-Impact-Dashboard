'use client';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

type Props = { data: any[] };

function formatMoney(n: number) {
    if (!Number.isFinite(n)) return '$0';
    return `$${Math.round(n).toLocaleString()}`;
}

function formatNumber(n: number) {
    if (!Number.isFinite(n)) return '0';
    return Math.round(n).toLocaleString();
}

export default function EmployerLeaderboard({ data }: Props) {
    const rows = (Array.isArray(data) ? data : [])
        .slice(0, 15)
        .map((d) => ({
            emp_name: d.emp_name ?? '—',
            total_applications: Number(d.total_applications ?? 0),
            avg_annual_wage: Number(d.avg_annual_wage ?? 0),
            total_annual_wages: Number(d.total_annual_wages ?? 0),
        }));

    return (
        <div className="mt-8 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900">
                Top Employers by Applications
            </h3>
            <p className="text-sm text-slate-500 mt-1">
                Certified applications for the selected filters (showing top {rows.length}).
            </p>

            <div className="mt-4 h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={rows}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            type="number"
                            tickFormatter={(v) => formatNumber(Number(v))}
                        />
                        <YAxis
                            type="category"
                            dataKey="emp_name"
                            width={220}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            formatter={(value: any, name?: string) => {
                                if (name === 'total_applications') {
                                    return [formatNumber(Number(value)), 'Applications'];
                                }
                                return [value, name ?? ''];
                            }}
                            labelFormatter={(label) => `Employer: ${label}`}
                            contentStyle={{ borderRadius: 8 }}
                        />

                        <Bar dataKey="total_applications" fill="#800080" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-3 text-xs text-slate-500">
                Tip: Hover bars to see exact application counts.
            </div>
        </div>
    );
}
