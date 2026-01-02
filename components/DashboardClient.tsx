'use client';

import { useState, useMemo, useEffect } from 'react';
import { Receipt } from '@prisma/client';
import { Search, Filter, Calendar as CalendarIcon, DollarSign, X, PieChart } from 'lucide-react';
import ExpenseCharts from './ExpenseCharts';
import ManualEntryButton from './ManualEntryButton';
import ReceiptActions from './ReceiptActions';
import { ExternalLink, Download } from 'lucide-react';

interface DashboardClientProps {
    receipts: Receipt[];
}

const CATEGORY_COLORS: Record<string, string> = {
    'Meals & Entertainment': 'bg-orange-500',
    'Travel': 'bg-blue-500',
    'Office Supplies': 'bg-yellow-500',
    'Software & Subscriptions': 'bg-indigo-500',
    'Professional Services': 'bg-cyan-500',
    'Utilities': 'bg-green-500',
    'Equipment': 'bg-slate-500',
    'Fuel & Auto': 'bg-red-500',
    'Insurance': 'bg-teal-500',
    'Marketing': 'bg-pink-500',
    'Other': 'bg-gray-400'
};

// Standard accounts to ensure they always appear in filters
const STANDARD_ACCOUNTS = ['Karthik Business', 'Karrah Business', 'Karrah Personal', 'Cricket', 'Medicine'];

export default function DashboardClient({ receipts }: DashboardClientProps) {
    // -- State --
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // -- Derived State (Filtering) --
    const filteredReceipts = useMemo(() => {
        return receipts.filter(r => {
            // 1. Account Filter
            if (selectedAccount !== 'All' && r.account !== selectedAccount) return false;

            // 2. Search Text
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const merchant = r.merchant?.toLowerCase() || '';
                const category = r.category?.toLowerCase() || '';
                const amount = r.amount?.toString() || '';
                if (!merchant.includes(query) && !category.includes(query) && !amount.includes(query)) {
                    return false;
                }
            }

            // 3. Date Range
            if (dateRange.start && r.date && new Date(r.date) < new Date(dateRange.start)) return false;
            if (dateRange.end && r.date && new Date(r.date) > new Date(dateRange.end)) return false;

            // 4. Amount Range
            if (amountRange.min && r.amount! < parseFloat(amountRange.min)) return false;
            if (amountRange.max && r.amount! > parseFloat(amountRange.max)) return false;

            return true;
        });
    }, [receipts, selectedAccount, searchQuery, dateRange, amountRange]);

    // -- Calculated Stats --
    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Total Spent = Sum of what is currently visible in the list (Matches Date/Account/Amount filters)
        const total = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

        // 2. For MTD and YTD, we want to respect Account/Search/Amount filters BUT ignore the specific "Date Range" picker.
        //    This allows users to see "This Month" context even if looking at "Last Month's" data list.
        const contextReceipts = receipts.filter(r => {
            // Account Filter
            if (selectedAccount !== 'All' && r.account !== selectedAccount) return false;
            // Search Text
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const merchant = r.merchant?.toLowerCase() || '';
                const category = r.category?.toLowerCase() || '';
                const amount = r.amount?.toString() || '';
                if (!merchant.includes(query) && !category.includes(query) && !amount.includes(query)) return false;
            }
            // Amount Range
            if (amountRange.min && r.amount! < parseFloat(amountRange.min)) return false;
            if (amountRange.max && r.amount! > parseFloat(amountRange.max)) return false;

            return true;
        });

        const mtd = contextReceipts
            .filter(r => r.date && new Date(r.date).getMonth() === currentMonth && new Date(r.date).getFullYear() === currentYear)
            .reduce((sum, r) => sum + (r.amount || 0), 0);

        const ytd = contextReceipts
            .filter(r => r.date && new Date(r.date).getFullYear() === currentYear)
            .reduce((sum, r) => sum + (r.amount || 0), 0);

        return { total, mtd, ytd };
    }, [filteredReceipts, receipts, selectedAccount, searchQuery, amountRange]);

    // Unique Accounts for Dropdown (Standard + Existing)
    const accounts = useMemo(() => {
        const receiptAccounts = receipts.map(r => r.account).filter(Boolean) as string[];
        // Merge standard accounts with any custom legacy ones found in DB
        const unique = new Set([...STANDARD_ACCOUNTS, ...receiptAccounts]);
        return ['All', ...Array.from(unique)];
    }, [receipts]);

    if (!isMounted) return <div className="p-10 text-center text-gray-500">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            {/* Top Stats Cards (Global) */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Spent</p>
                    <p className="text-lg sm:text-2xl font-black text-gray-900">${stats.total.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">This Month</p>
                    <p className="text-lg sm:text-2xl font-black text-blue-600">${stats.mtd.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">This Year</p>
                    <p className="text-lg sm:text-2xl font-black text-green-600">${stats.ytd.toFixed(2)}</p>
                </div>
            </div>

            {/* Action Bar & Filters */}
            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search merchant, category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 border rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50'}`}
                        >
                            <Filter className="h-4 w-4" /> Filters
                        </button>
                        {(searchQuery || selectedAccount !== 'All' || dateRange.start || dateRange.end || amountRange.min || amountRange.max) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedAccount('All');
                                    setDateRange({ start: '', end: '' });
                                    setAmountRange({ min: '', max: '' });
                                }}
                                className="text-sm text-red-500 hover:text-red-700 px-2 font-medium"
                            >
                                Clear
                            </button>
                        )}
                        <ManualEntryButton />
                        <a
                            href="/api/export"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Download className="h-4 w-4" /> CSV
                        </a>
                    </div>
                </div>

                {/* Advanced Filters (Collapsible) */}
                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t animate-in fade-in slide-in-from-top-2">
                        {/* Account */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Account</label>
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                {accounts.map(acc => (
                                    <option key={acc} value={acc}>{acc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full p-2 border rounded-lg text-sm"
                                />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full p-2 border rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        {/* Amount Range */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Amount ($)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={amountRange.min}
                                    onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                                    className="w-full p-2 border rounded-lg text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={amountRange.max}
                                    onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                                    className="w-full p-2 border rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Charts (Responsive) */}
            <ExpenseCharts receipts={filteredReceipts} />

            {/* Category Breakdown */}
            {Object.keys(CATEGORY_COLORS).length > 0 && (
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-purple-600" /> Expenses by Category
                    </h2>
                    <div className="space-y-2">
                        {/* Calculate categories on the fly */}
                        {(() => {
                            const stats: Record<string, number> = {};
                            let total = 0;
                            filteredReceipts.forEach(r => {
                                const cat = r.category || 'Uncategorized';
                                stats[cat] = (stats[cat] || 0) + (r.amount || 0);
                                total += (r.amount || 0);
                            });

                            const sortedCats = Object.entries(stats)
                                .map(([name, value]) => ({ name, value, percentage: total > 0 ? (value / total * 100).toFixed(1) : '0' }))
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 6);

                            return sortedCats.map((cat) => {
                                const colorClass = CATEGORY_COLORS[cat.name] || 'bg-gray-400';
                                return (
                                    <div key={cat.name} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between text-sm">
                                                <span className="truncate text-gray-700">{cat.name}</span>
                                                <span className="font-medium text-gray-900">${cat.value.toFixed(2)}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full ${colorClass} transition-all`}
                                                    style={{ width: `${cat.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 w-12 text-right">{cat.percentage}%</span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* List */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-semibold text-gray-900">
                        {filteredReceipts.length} Transactions
                    </h2>
                    {filteredReceipts.length !== receipts.length && (
                        <span className="text-xs text-gray-500">
                            (Filtered from {receipts.length})
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    {filteredReceipts.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border">
                            No receipts match your search.
                        </div>
                    ) : (filteredReceipts.map((receipt) => {
                        const colorClass = CATEGORY_COLORS[receipt.category || ''] || 'bg-gray-400';
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
                                            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${receipt.account === 'Karrah' || receipt.account === 'Karrah Business' ? 'bg-pink-100 text-pink-700' :
                                                receipt.account === 'Karrah Personal' ? 'bg-rose-100 text-rose-700' :
                                                    receipt.account === 'Cricket' ? 'bg-green-100 text-green-700' :
                                                        receipt.account === 'Medicine' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-blue-100 text-blue-700'
                                                }`}>
                                                {receipt.account || 'Karthik Business'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                            ${receipt.amount?.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {receipt.date ? new Date(receipt.date).toLocaleDateString() : 'No date'}
                                        </p>
                                    </div>
                                    <ReceiptActions
                                        receiptId={receipt.id}
                                        merchant={receipt.merchant || 'Unknown'}
                                        amount={receipt.amount || 0}
                                        receipt={JSON.parse(JSON.stringify(receipt))}
                                    />
                                </div>
                                {receipt.url && receipt.url !== 'mock_url' && receipt.url !== 'manual_entry' && (
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
    );
}
