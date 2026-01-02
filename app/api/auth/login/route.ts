import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        // Get the secret password from env or fallback
        const SITE_PASSWORD = process.env.SITE_PASSWORD || 'receipts2025';

        if (password === SITE_PASSWORD) {
            const response = NextResponse.json({ success: true });

            // Set a secure cookie that lasts 30 days
            response.cookies.set('auth-token', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
