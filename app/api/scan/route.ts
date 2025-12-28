import { NextRequest, NextResponse } from 'next/server';
import { extractReceiptData } from '@/lib/anthropic';
import { prisma } from '@/lib/prisma';
import { uploadReceiptImage } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Generate a hash of the image for exact-file duplicate detection
function getImageHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 1. Prepare file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        // 2. Generate image hash for exact-file duplicate detection
        const imageHash = getImageHash(buffer);

        // 3. Check for EXACT FILE duplicates first (same image file uploaded twice)
        const exactDuplicate = await prisma.receipt.findFirst({
            where: { driveId: imageHash }
        });

        if (exactDuplicate) {
            return NextResponse.json({
                success: false,
                duplicate: true,
                reason: 'exact_file',
                message: 'This exact image was already uploaded',
                existingReceipt: exactDuplicate
            }, { status: 200 });
        }

        // 4. Extract Data using Claude (Haiku) FIRST to check for smart duplicates
        let extractedData: any = {};
        console.log("Extracting with Anthropic...");
        try {
            if (process.env.ANTHROPIC_API_KEY) {
                extractedData = await extractReceiptData(base64Image);
                console.log("Extracted:", extractedData);
            } else {
                throw new Error("No Anthropic Key");
            }
        } catch (e) {
            console.error("Extraction failed:", e);
            extractedData = {
                merchant: "Scan Error",
                date: new Date().toISOString().split('T')[0],
                amount: 0
            };
        }

        // 5. TRANSACTION ID DUPLICATE CHECK (BEST METHOD)
        if (extractedData.transactionId) {
            const transIdDuplicate = await prisma.receipt.findFirst({
                where: { transactionId: extractedData.transactionId }
            });

            if (transIdDuplicate) {
                return NextResponse.json({
                    success: false,
                    duplicate: true,
                    reason: 'transaction_id',
                    message: `Duplicate: Transaction ID ${extractedData.transactionId} already exists`,
                    existingReceipt: transIdDuplicate
                }, { status: 200 });
            }
        }

        // 6. SMART DUPLICATE CHECK: Same merchant + date + amount = likely duplicate
        if (extractedData.merchant && extractedData.date && extractedData.amount) {
            const receiptDate = new Date(extractedData.date);
            const smartDuplicate = await prisma.receipt.findFirst({
                where: {
                    merchant: extractedData.merchant,
                    amount: extractedData.amount,
                    date: receiptDate
                }
            });

            if (smartDuplicate) {
                return NextResponse.json({
                    success: false,
                    duplicate: true,
                    reason: 'smart_match',
                    message: `Duplicate found: ${extractedData.merchant} - $${extractedData.amount} on ${extractedData.date}`,
                    existingReceipt: smartDuplicate
                }, { status: 200 });
            }
        }

        // 7. Date-based folder organization: uploads/YYYY/MM/
        // Note: File storage only works locally, not on Vercel serverless
        const receiptDate = extractedData.date ? new Date(extractedData.date) : new Date();
        const year = receiptDate.getFullYear().toString();
        const month = (receiptDate.getMonth() + 1).toString().padStart(2, '0');

        let publicUrl = 'no-image'; // Default if upload fails

        // Generate filename for storage
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
        const fileName = `${extractedData.merchant?.replace(/[^a-zA-Z0-9]/g, '_') || 'receipt'}_${Date.now()}_${safeFileName}`;

        // Try Supabase Storage first (cloud - works everywhere)
        const supabaseUrl = await uploadReceiptImage(buffer, fileName, year, month);
        if (supabaseUrl) {
            publicUrl = supabaseUrl;
            console.log("Uploaded to Supabase Storage:", publicUrl);
        } else {
            // Fallback to local storage (development only)
            const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
            if (!isVercel) {
                try {
                    const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, month);
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    const filePath = path.join(uploadDir, fileName);
                    await writeFile(filePath, buffer);
                    publicUrl = `/uploads/${year}/${month}/${fileName}`;
                    console.log("Saved locally:", publicUrl);
                } catch (fileError) {
                    console.error("Local file save failed:", fileError);
                }
            }
        }

        // 8. Save to Database
        const receipt = await prisma.receipt.create({
            data: {
                url: publicUrl,
                driveId: imageHash,
                transactionId: extractedData.transactionId || null,
                merchant: extractedData.merchant || 'Unknown',
                date: extractedData.date ? new Date(extractedData.date) : null,
                amount: extractedData.amount || 0,
                currency: extractedData.currency || 'USD',
                category: extractedData.category || 'Other',
                status: 'completed',
            },
        });

        return NextResponse.json({ success: true, receipt });
    } catch (error) {
        console.error('Error processing receipt FULL DETAILS:', error);
        return NextResponse.json(
            { error: 'Failed to process receipt' },
            { status: 500 }
        );
    }
}
