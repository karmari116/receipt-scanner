import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Update all 'Karrah' accounts to 'Karrah Business'
        const result = await prisma.receipt.updateMany({
            where: { account: 'Karrah' },
            data: { account: 'Karrah Business' }
        });

        return NextResponse.json({
            success: true,
            message: `Migrated ${result.count} receipts from 'Karrah' to 'Karrah Business'.`,
            count: result.count
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Migration failed', details: error.message },
            { status: 500 }
        );
    }
}
