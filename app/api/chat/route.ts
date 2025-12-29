import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';

// System prompt for the expense assistant
const SYSTEM_PROMPT = `You are an intelligent expense assistant for a Receipt Scanner app. You help users:

1. **Answer expense questions** - Query their spending data and provide insights
2. **Receipt help** - Guide them on how to use the app features
3. **General conversation** - Be friendly and helpful

When answering expense questions, you'll be provided with relevant expense data in the context. Use this data to give accurate, specific answers.

**App Features you can explain:**
- Scan receipts using the camera
- Automatic extraction of merchant, date, amount, and category
- Multi-account tracking (Karthik Business, Karrah, Cricket, Medicine)
- CSV export for tax purposes
- Category-based expense tracking

**Response Style:**
- Be concise but friendly
- Use emojis sparingly for warmth 💰
- Format currency as $X.XX
- When listing expenses, use bullet points
- If asked about data you don't have, say so honestly

**Current date context:** ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

// Helper to build expense context based on user query
async function buildExpenseContext(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        let context = '\n\n---\n**EXPENSE DATA CONTEXT:**\n';
        
        // Check if asking about specific time periods
        const isMonthQuery = lowerMessage.includes('month') || lowerMessage.includes('mtd');
        const isYearQuery = lowerMessage.includes('year') || lowerMessage.includes('ytd');
        const isTotalQuery = lowerMessage.includes('total') || lowerMessage.includes('all');
        
        // Check for category queries
        const categories = [
            'meals & entertainment', 'travel', 'office supplies', 
            'software & subscriptions', 'professional services', 'utilities',
            'equipment', 'fuel & auto', 'insurance', 'marketing', 'other'
        ];
        const matchedCategory = categories.find(cat => lowerMessage.includes(cat.toLowerCase()));
        
        // Check for account queries
        const accounts = ['karthik business', 'karrah', 'cricket', 'medicine'];
        const matchedAccount = accounts.find(acc => lowerMessage.includes(acc.toLowerCase()));
        
        // Build appropriate query
        let whereClause: any = {};
        
        if (isMonthQuery) {
            whereClause.date = { gte: startOfMonth };
            context += `**Time Period:** This month (${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()})\n`;
        } else if (isYearQuery) {
            whereClause.date = { gte: startOfYear };
            context += `**Time Period:** Year-to-Date (${now.getFullYear()})\n`;
        }
        
        if (matchedCategory) {
            // Find the properly cased category name
            const properCategory = categories.find(c => c.toLowerCase() === matchedCategory);
            whereClause.category = { contains: properCategory, mode: 'insensitive' };
            context += `**Category Filter:** ${properCategory}\n`;
        }
        
        if (matchedAccount) {
            whereClause.account = { contains: matchedAccount, mode: 'insensitive' };
            context += `**Account Filter:** ${matchedAccount}\n`;
        }
        
        // Get aggregated stats
        const stats = await prisma.receipt.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            _avg: { amount: true },
            where: whereClause
        });
        
        context += `\n**Summary:**\n`;
        context += `- Total Amount: $${(stats._sum.amount || 0).toFixed(2)}\n`;
        context += `- Number of Receipts: ${stats._count.id || 0}\n`;
        context += `- Average per Receipt: $${(stats._avg.amount || 0).toFixed(2)}\n`;
        
        // Get category breakdown if not filtering by category
        if (!matchedCategory) {
            const categoryBreakdown = await prisma.receipt.groupBy({
                by: ['category'],
                _sum: { amount: true },
                _count: { id: true },
                where: whereClause,
                orderBy: { _sum: { amount: 'desc' } }
            });
            
            if (categoryBreakdown.length > 0) {
                context += `\n**By Category:**\n`;
                categoryBreakdown.forEach(cat => {
                    context += `- ${cat.category || 'Uncategorized'}: $${(cat._sum.amount || 0).toFixed(2)} (${cat._count.id} receipts)\n`;
                });
            }
        }
        
        // Get account breakdown if not filtering by account
        if (!matchedAccount) {
            const accountBreakdown = await prisma.receipt.groupBy({
                by: ['account'],
                _sum: { amount: true },
                _count: { id: true },
                where: whereClause,
                orderBy: { _sum: { amount: 'desc' } }
            });
            
            if (accountBreakdown.length > 0) {
                context += `\n**By Account:**\n`;
                accountBreakdown.forEach(acc => {
                    context += `- ${acc.account}: $${(acc._sum.amount || 0).toFixed(2)} (${acc._count.id} receipts)\n`;
                });
            }
        }
        
        // Get recent transactions if asking about specific items
        if (lowerMessage.includes('recent') || lowerMessage.includes('last') || lowerMessage.includes('show')) {
            const recentReceipts = await prisma.receipt.findMany({
                where: whereClause,
                orderBy: { date: 'desc' },
                take: 5
            });
            
            if (recentReceipts.length > 0) {
                context += `\n**Recent Transactions:**\n`;
                recentReceipts.forEach(r => {
                    const dateStr = r.date ? new Date(r.date).toLocaleDateString() : 'No date';
                    context += `- ${r.merchant || 'Unknown'}: $${(r.amount || 0).toFixed(2)} on ${dateStr} (${r.category || 'Uncategorized'})\n`;
                });
            }
        }
        
        return context;
        
    } catch (error) {
        console.error('Error building expense context:', error);
        return '\n\n---\n**Note:** Unable to fetch expense data at this time.\n';
    }
}

export async function POST(request: NextRequest) {
    try {
        const { message, history = [] } = await request.json();
        
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }
        
        // Check if this is an expense-related query
        const expenseKeywords = ['spend', 'spent', 'expense', 'receipt', 'cost', 'money', 'dollar', 'amount', 'total', 'category', 'account', 'month', 'year', 'ytd', 'mtd', 'biggest', 'most', 'show', 'list'];
        const isExpenseQuery = expenseKeywords.some(keyword => message.toLowerCase().includes(keyword));
        
        // Build expense context if relevant
        let contextualMessage = message;
        if (isExpenseQuery) {
            const expenseContext = await buildExpenseContext(message);
            contextualMessage = message + expenseContext;
        }
        
        // Initialize Anthropic client
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        
        // Build messages array with history
        const messages: Anthropic.MessageParam[] = [
            ...history.map((msg: { role: string; content: string }) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            })),
            { role: 'user', content: contextualMessage }
        ];
        
        // Create streaming response
        const stream = await anthropic.messages.stream({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: messages,
        });
        
        // Create a readable stream for the response
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of stream) {
                        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                            const text = event.delta.text;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });
        
        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
        
    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process chat request' },
            { status: 500 }
        );
    }
}
