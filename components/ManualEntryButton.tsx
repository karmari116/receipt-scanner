'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import EditReceiptModal from './EditReceiptModal';

export default function ManualEntryButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
            >
                <Plus className="h-4 w-4" /> Add Expense
            </button>

            <EditReceiptModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isNew={true}
                receipt={null}
            />
        </>
    );
}
