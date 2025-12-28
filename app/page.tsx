import { prisma } from '@/lib/prisma';
import CameraCapture from '@/components/CameraCapture';
import ReceiptActions from '@/components/ReceiptActions';
import { Receipt } from '@prisma/client';
import { ExternalLink, TrendingUp, Calendar, PieChart, Download } from 'lucide-react';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get all receipts for display
async function getReceipts() {
    try {
        return await prisma.receipt.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    } catch (e) {
        return [];
    }
}

// Calculate comprehensive stats
async function getStats() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // All-time totals
        const allTime = await prisma.receipt.aggregate({
            _sum: { amount: true },
            _count: { id: true }
        });

        // Month-to-Date
        const mtd = await prisma.receipt.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            where: {
                date: { gte: startOfMonth }
            }
        });

        // Year-to-Date
        const ytd = await prisma.receipt.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            where: {
                date: { gte: startOfYear }
            }
        });

        // Category breakdown
        const categoryData = await prisma.receipt.groupBy({
            by: ['category'],
            _sum: { amount: true },
            _count: { id: true },
            orderBy: { _sum: { amount: 'desc' } }
        });

        // Account-based MTD breakdown
        const accountMtd = await prisma.receipt.groupBy({
            by: ['account'],
            _sum: { amount: true },
            _count: { id: true },
            where: {
                date: { gte: startOfMonth }
            },
            orderBy: { _sum: { amount: 'desc' } }
        });

        // Account-based YTD breakdown
        const accountYtd = await prisma.receipt.groupBy({
            by: ['account'],
            _sum: { amount: true },
            _count: { id: true },
            where: {
                date: { gte: startOfYear }
            },
            orderBy: { _sum: { amount: 'desc' } }
        });

        return {
            allTime: {
                total: allTime._sum.amount || 0,
                count: allTime._count.id || 0
            },
            mtd: {
                total: mtd._sum.amount || 0,
                count: mtd._count.id || 0
            },
            ytd: {
                total: ytd._sum.amount || 0,
                count: ytd._count.id || 0
            },
            categories: categoryData.map(c => ({
                name: c.category || 'Uncategorized',
                total: c._sum.amount || 0,
                count: c._count.id || 0
            })),
            accounts: {
                mtd: accountMtd.map(a => ({
                    name: a.account,
                    total: a._sum.amount || 0,
                    count: a._count.id || 0
                })),
                ytd: accountYtd.map(a => ({
                    name: a.account,
                    total: a._sum.amount || 0,
                    count: a._count?.id || 0
                }))
            }
        };
    } catch (e) {
        console.error("Stats error:", e);
        return {
            allTime: { total: 0, count: 0 },
            mtd: { total: 0, count: 0 },
            ytd: { total: 0, count: 0 },
            categories: [],
            accounts: { mtd: [], ytd: [] }
        };
    }
}

// Category colors for visual distinction
const categoryColors: Record<string, string> = {
    'Meals & Entertainment': 'bg-orange-500',
    'Travel': 'bg-blue-500',
    'Office Supplies': 'bg-green-500',
    'Software & Subscriptions': 'bg-purple-500',
    'Professional Services': 'bg-indigo-500',
    'Utilities': 'bg-yellow-500',
    'Equipment': 'bg-red-500',
    'Fuel & Auto': 'bg-cyan-500',
    'Insurance': 'bg-pink-500',
    'Marketing': 'bg-teal-500',
    'Other': 'bg-gray-500',
    'Uncategorized': 'bg-gray-400',
};

export default async function Home() {
    const receipts = await getReceipts();
    const stats = await getStats();

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">📊 Receipt Scanner</h1>
                    <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        YTD: ${stats.ytd.total.toFixed(2)}
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* MTD Card */}
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <p className="text-xs text-gray-500 uppercase font-medium">{currentMonth}</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">${stats.mtd.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{stats.mtd.count} receipts</p>
                    </div>

                    {/* YTD Card */}
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <p className="text-xs text-gray-500 uppercase font-medium">YTD {currentYear}</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">${stats.ytd.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{stats.ytd.count} receipts</p>
                    </div>

                    {/* All Time Card */}
                    <div className="bg-white p-4 rounded-xl border shadow-sm col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-2">
                            <PieChart className="h-4 w-4 text-purple-500" />
                            <p className="text-xs text-gray-500 uppercase font-medium">All Time</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">${stats.allTime.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{stats.allTime.count} receipts</p>
                    </div>
                </div>

                {/* Category Breakdown */}
                {stats.categories.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <PieChart className="h-4 w-4" /> Expenses by Category
                        </h2>
                        <div className="space-y-2">
                            {stats.categories.slice(0, 6).map((cat) => {
                                const percentage = stats.allTime.total > 0
                                    ? ((cat.total / stats.allTime.total) * 100).toFixed(1)
                                    : '0';
                                const colorClass = categoryColors[cat.name] || 'bg-gray-400';

                                return (
                                    <div key={cat.name} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between text-sm">
                                                <span className="truncate text-gray-700">{cat.name}</span>
                                                <span className="font-medium text-gray-900">${cat.total.toFixed(2)}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full ${colorClass} transition-all`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 w-12 text-right">{percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Capture Action */}
                <CameraCapture />

                {/* CSV Export Button */}
                <div className="flex justify-end">
                    <a
                        href="/api/export"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Download className="h-4 w-4" /> Export CSV
                    </a>
                </div>

                {/* Recent List */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Transactions</h2>
                    <div className="space-y-3">
                        {receipts.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border">
                                No receipts scanned yet. Tap "Scan Receipt" to start!
                            </div>
                        ) : (receipts.map((receipt) => {
                            const colorClass = categoryColors[receipt.category || ''] || 'bg-gray-400';
                            return (
                                <div key={receipt.id} className="bg-white p-4 rounded-xl border shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-10 rounded-full ${colorClass}`}></div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    {receipt.merchant || 'Unknown Merchant'}
                                                </h3>
                                                <p className="text-sm text-gray-500">{receipt.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                ${receipt.amount?.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {receipt.date ? new Date(receipt.date).toISOString().split('T')[0] : 'No date'}
                                            </p>
                                        </div>
                                        <ReceiptActions
                                            receiptId={receipt.id}
                                            merchant={receipt.merchant || 'Unknown'}
                                            amount={receipt.amount || 0}
                                        />
                                    </div>
                                    {receipt.url && receipt.url !== 'mock_url' && (
                                        <a
                                            href={receipt.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 mt-2 inline-flex items-center gap-1 hover:underline"
                                        >
                                            View Receipt <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            );
                        }))}
                    </div>
                </div>
            </div>
        </main>
    );
}
