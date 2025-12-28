'use client';

import { Trash2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ReceiptActionsProps {
    receiptId: number;
    merchant: string;
    amount: number;
}

export default function ReceiptActions({ receiptId, merchant, amount }: ReceiptActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this receipt?')) {
            return;
        }
        await deleteReceipt();
    };

    const handleFlagDuplicate = async () => {
        if (!confirm(`Flag "${merchant} - $${amount}" as a duplicate and remove it?`)) {
            return;
        }
        await deleteReceipt();
        alert('✅ Marked as duplicate and removed!');
    };

    const deleteReceipt = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/receipt?id=${receiptId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to delete receipt');
            }
        } catch (error) {
            alert('Error deleting receipt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-1">
            <button
                onClick={handleFlagDuplicate}
                disabled={loading}
                className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                title="Flag as duplicate"
            >
                <Copy className="h-4 w-4" />
            </button>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete receipt"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}
