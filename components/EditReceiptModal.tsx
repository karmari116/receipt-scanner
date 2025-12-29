'use client';

import { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, Tag, Briefcase, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receipt?: {
        id: number;
        merchant: string | null;
        date: string | null;
        amount: number | null;
        category: string | null;
        account: string;
    } | null;
    isNew?: boolean; // True if creating a new manual entry
}

const CATEGORIES = [
    'Meals & Entertainment',
    'Travel',
    'Office Supplies',
    'Software & Subscriptions',
    'Professional Services',
    'Utilities',
    'Equipment',
    'Fuel & Auto',
    'Insurance',
    'Marketing',
    'Other'
];

const ACCOUNTS = [
    'Karthik Business',
    'Karrah',
    'Cricket',
    'Medicine'
];

export default function EditReceiptModal({ isOpen, onClose, receipt, isNew = false }: EditReceiptModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        merchant: '',
        amount: '',
        date: '',
        category: '',
        account: 'Karthik Business'
    });

    // Initialize form when receipt changes
    useEffect(() => {
        if (isOpen) {
            if (receipt && !isNew) {
                setFormData({
                    merchant: receipt.merchant || '',
                    amount: receipt.amount?.toString() || '',
                    date: receipt.date ? new Date(receipt.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    category: receipt.category || 'Other',
                    account: receipt.account || 'Karthik Business'
                });
            } else if (isNew) {
                setFormData({
                    merchant: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    category: 'Other',
                    account: 'Karthik Business'
                });
            }
        }
    }, [isOpen, receipt, isNew]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = isNew
                ? '/api/receipts/create'
                : `/api/receipts/${receipt?.id}`;

            const method = isNew ? 'POST' : 'PATCH';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save');

            router.refresh(); // Refresh page data
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">
                        {isNew ? 'New Manual Entry' : 'Edit Receipt'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Merchant */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                            Merchant
                        </label>
                        <div className="relative">
                            <Store className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                required
                                type="text"
                                name="merchant"
                                value={formData.merchant}
                                onChange={handleChange}
                                placeholder="e.g. Walmart"
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Amount & Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Amount ($)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    required
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                            Category
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none"
                            >
                                <option value="" disabled>Select category</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Account */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                            Account
                        </label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <select
                                name="account"
                                value={formData.account}
                                onChange={handleChange}
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none"
                            >
                                {ACCOUNTS.map(acc => (
                                    <option key={acc} value={acc}>{acc}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Save
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
