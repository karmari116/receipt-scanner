'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, XCircle, User, Briefcase, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ACCOUNTS = [
    { id: 'Karthik Business', label: 'Karthik Business', icon: Briefcase, color: 'text-blue-600' },
    { id: 'Karrah', label: 'Karrah', icon: User, color: 'text-pink-600' },
    { id: 'Cricket', label: 'Cricket', icon: Trophy, color: 'text-green-600' },
];

export default function CameraCapture() {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState('Karthik Business');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('account', selectedAccount);

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            // Handle duplicate detection
            if (data.duplicate) {
                alert(`⚠️ Duplicate Receipt!\n\n${data.message}`);
            } else if (data.success) {
                alert(`✅ Receipt scanned for ${selectedAccount}!\n\nMerchant: ${data.receipt?.merchant}\nAmount: $${data.receipt?.amount}\nCategory: ${data.receipt?.category}`);
            }

            router.refresh(); // Refresh server components to show new receipt
        } catch (error) {
            console.error(error);
            alert('❌ Failed to process receipt');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border p-4 mb-4">
            {/* Account Selector */}
            <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Account</label>
                <div className="flex gap-2">
                    {ACCOUNTS.map((account) => {
                        const Icon = account.icon;
                        const isSelected = selectedAccount === account.id;
                        return (
                            <button
                                key={account.id}
                                onClick={() => setSelectedAccount(account.id)}
                                className={`flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-1 text-sm font-medium transition-all ${isSelected
                                    ? `border-blue-500 bg-blue-50 ${account.color}`
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="text-xs sm:text-sm">{account.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Upload Button */}
            <div className="flex gap-2">
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50"
                >
                    {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Camera className="h-5 w-5" />
                    )}
                    {isUploading ? 'Processing...' : 'Scan Receipt'}
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
                Select account, then scan. AI extracts data automatically.
            </p>
        </div>
    );
}
