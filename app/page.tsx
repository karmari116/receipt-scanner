import { prisma } from '@/lib/prisma';
import CameraCapture from '@/components/CameraCapture';
import ChatWidget from '@/components/ChatWidget';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getReceipts() {
    try {
        return await prisma.receipt.findMany({
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take: 1000,
        });
    } catch (e) {
        return [];
    }
}

export default async function Home() {
    const receipts = await getReceipts();
    const serializedReceipts = JSON.parse(JSON.stringify(receipts));

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
            <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">📊 Receipt Scanner</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                <CameraCapture />
                <DashboardClient receipts={serializedReceipts} />
            </div>

            <ChatWidget />
        </main>
    );
}
