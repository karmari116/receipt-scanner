'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Receipt } from '@prisma/client';
import { format, parseISO, startOfDay, startOfMonth, eachDayOfInterval, eachMonthOfInterval, min, max, addDays } from 'date-fns';

interface ExpenseChartsProps {
    receipts: Receipt[];
}

export default function ExpenseCharts({ receipts }: ExpenseChartsProps) {
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

    const chartData = useMemo(() => {
        if (receipts.length === 0) return [];

        // Filter out receipts without dates
        const validReceipts = receipts.filter(r => r.date);
        if (validReceipts.length === 0) return [];

        const dates = validReceipts.map(r => new Date(r.date!));
        const minDate = min(dates);
        const maxDate = max(dates);

        // Determine aggregation
        // If viewing Monthly or span > 60 days, default to monthly?
        // Let's stick to explicit toggle for now, but auto-fill gaps.

        const dataMap = new Map<string, number>();

        if (viewMode === 'daily') {
            // Fill all days in interval
            const days = eachDayOfInterval({ start: minDate, end: maxDate });
            days.forEach(day => {
                dataMap.set(format(day, 'yyyy-MM-dd'), 0);
            });

            validReceipts.forEach(r => {
                const key = format(new Date(r.date!), 'yyyy-MM-dd');
                if (dataMap.has(key)) {
                    dataMap.set(key, (dataMap.get(key) || 0) + (r.amount || 0));
                }
            });

            return Array.from(dataMap.entries()).map(([date, amount]) => ({
                label: format(parseISO(date), 'MMM d'),
                fullDate: date,
                amount: amount
            }));
        } else {
            // Monthly
            const months = eachMonthOfInterval({ start: minDate, end: maxDate });
            months.forEach(month => {
                dataMap.set(format(month, 'yyyy-MM'), 0);
            });

            validReceipts.forEach(r => {
                const key = format(new Date(r.date!), 'yyyy-MM');
                if (dataMap.has(key)) {
                    dataMap.set(key, (dataMap.get(key) || 0) + (r.amount || 0));
                }
            });

            return Array.from(dataMap.entries()).map(([month, amount]) => ({
                label: format(parseISO(month + '-01'), 'MMM yyyy'),
                fullDate: month,
                amount: amount
            }));
        }

    }, [receipts, viewMode]);

    if (receipts.length === 0) return null;

    return (
        <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Spending Trends</h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'daily' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Daily
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 10 }}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 10 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                        />
                        <Bar
                            dataKey="amount"
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.amount > 1000 ? '#EF4444' : '#3B82F6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
