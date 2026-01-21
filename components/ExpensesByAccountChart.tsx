'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Receipt } from '@prisma/client';

interface ExpensesByAccountChartProps {
    receipts: Receipt[];
}

export default function ExpensesByAccountChart({ receipts }: ExpensesByAccountChartProps) {
    const chartData = useMemo(() => {
        if (!receipts || receipts.length === 0) return [];

        const accountMap = new Map<string, number>();

        receipts.forEach(r => {
            const account = r.account || 'Karthik Business'; // Default fallback
            accountMap.set(account, (accountMap.get(account) || 0) + (r.amount || 0));
        });

        // Convert to array and sort by amount descending
        return Array.from(accountMap.entries())
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [receipts]);

    if (!receipts || receipts.length === 0) return null;

    // Define colors for specific accounts if desired, or use a palette
    const getBarColor = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('karthik')) return '#3B82F6'; // Blue
        if (lower.includes('karrah business')) return '#EC4899'; // Pink
        if (lower.includes('karrah personal')) return '#BE185D'; // Dark Pink
        if (lower.includes('cricket')) return '#10B981'; // Green
        if (lower.includes('medicine')) return '#8B5CF6'; // Purple
        return '#9CA3AF'; // Gray
    };

    return (
        <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Expenses by Account</h3>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 10 }}
                            interval={0} // Show all labels
                            minTickGap={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 10 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number | undefined) => [value ? `$${value.toFixed(2)}` : '$0.00', 'Spent']}
                        />
                        <Bar
                            dataKey="amount"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={60}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
