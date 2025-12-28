import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Export receipts as CSV
export async function GET() {
    try {
        const receipts = await prisma.receipt.findMany({
            orderBy: { date: 'desc' }
        });

        // CSV Header
        const header = 'Date,Merchant,Amount,Currency,Category,Status,URL\n';

        // CSV Rows
        const rows = receipts.map(r => {
            const date = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
            const merchant = (r.merchant || '').replace(/,/g, ' '); // Remove commas
            const amount = r.amount?.toFixed(2) || '0.00';
            const currency = r.currency || 'USD';
            const category = (r.category || 'Other').replace(/,/g, ' ');
            const status = r.status || 'completed';
            const url = r.url || '';

            return `${date},"${merchant}",${amount},${currency},"${category}",${status},${url}`;
        }).join('\n');

        const csv = header + rows;

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="expenses_export_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error) {
        console.error('Error exporting CSV:', error);
        return NextResponse.json(
            { error: 'Failed to export' },
            { status: 500 }
        );
    }
}
