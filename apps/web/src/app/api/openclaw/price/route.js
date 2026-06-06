/**
 * apps/web/src/app/api/openclaw/price/route.ts
 * Quick price lookup — used by OpenClaw for fast responses
 */
import { NextResponse } from 'next/server';
import { getTicker } from '@lbrain/lbank-skills';
export const dynamic = 'force-dynamic';
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const symbol = (searchParams.get('symbol') ?? 'BTC').toUpperCase();
    const pair = `${symbol.toLowerCase()}_usdt`;
    try {
        const ticker = await getTicker(pair);
        return NextResponse.json({
            success: true,
            symbol,
            pair,
            price: ticker.price,
            changePct: ticker.changePct,
            formatted: `$${ticker.price.toLocaleString('en', { maximumFractionDigits: 6 })}`,
        });
    }
    catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map