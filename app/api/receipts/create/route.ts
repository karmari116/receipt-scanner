import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { merchant, date, amount, category, account } = body;

        if (!merchant || !amount || !category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newReceipt = await prisma.receipt.create({
            data: {
                merchant,
                date: date ? new Date(date) : new Date(),
                amount: parseFloat(amount),
                category,
                account: account || 'Karthik Business',
                status: 'completed',
                url: 'manual_entry', // Placeholder for manual entries
                driveId: 'manual_' + Date.now(),
                transactionId: 'MANUAL_' + Date.now(),
            }
        });

        return NextResponse.json(newReceipt);
    } catch (error) {
        console.error('Error creating manual receipt:', error);
        return NextResponse.json(
            { error: 'Failed to create receipt' },
            { status: 500 }
        );
    }
}
