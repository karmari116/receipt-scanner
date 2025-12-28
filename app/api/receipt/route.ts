import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// DELETE a receipt by ID
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
        }

        // Find the receipt first to get the file path
        const receipt = await prisma.receipt.findUnique({
            where: { id: parseInt(id) }
        });

        if (!receipt) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
        }

        // Move the file to trash folder instead of deleting
        if (receipt.url && receipt.url.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), 'public', receipt.url);
            if (fs.existsSync(filePath)) {
                // Create trash folder if it doesn't exist
                const trashDir = path.join(process.cwd(), 'public', 'trash');
                if (!fs.existsSync(trashDir)) {
                    fs.mkdirSync(trashDir, { recursive: true });
                }

                // Move file to trash with timestamp prefix to avoid conflicts
                const fileName = path.basename(filePath);
                const trashPath = path.join(trashDir, `${Date.now()}_${fileName}`);
                fs.renameSync(filePath, trashPath);
                console.log("Moved to trash:", trashPath);
            }
        }

        // Delete from database
        await prisma.receipt.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: 'Receipt deleted' });
    } catch (error) {
        console.error('Error deleting receipt:', error);
        return NextResponse.json(
            { error: 'Failed to delete receipt' },
            { status: 500 }
        );
    }
}
