'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CameraCapture() {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

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
                alert(`✅ Receipt scanned successfully!\n\nMerchant: ${data.receipt?.merchant}\nAmount: $${data.receipt?.amount}\nCategory: ${data.receipt?.category}`);
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
                Takes a photo, uploads to Drive, and extracts data with AI.
            </p>
        </div>
    );
}
