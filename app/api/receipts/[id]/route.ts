import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const idString = (await params).id;
        const id = parseInt(idString);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const { merchant, date, amount, category, account, status } = body;

        const updatedReceipt = await prisma.receipt.update({
            where: { id },
            data: {
                merchant,
                date: date ? new Date(date) : undefined,
                amount: amount ? parseFloat(amount) : undefined,
                category,
                account,
                status
            }
        });

        return NextResponse.json(updatedReceipt);
    } catch (error) {
        console.error('Error updating receipt:', error);
        return NextResponse.json(
            { error: 'Failed to update receipt' },
            { status: 500 }
        );
    }
}
