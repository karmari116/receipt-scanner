'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteButtonProps {
    receiptId: number;
}

export default function DeleteButton({ receiptId }: DeleteButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this receipt?')) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/receipt?id=${receiptId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.refresh(); // Refresh the page to show updated list
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
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete receipt"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
