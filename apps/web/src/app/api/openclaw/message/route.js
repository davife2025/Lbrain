/**
 * apps/web/src/app/api/openclaw/message/route.ts
 * Receives messages from OpenClaw gateway (Telegram, WhatsApp, Discord)
 * Routes them through LBrain AI and returns a response.
 */
import { NextResponse } from 'next/server';
import { getTicker, getTopMovers, getMarketSummary } from '@lbrain/lbank-skills';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// Verify request comes from OpenClaw gateway
function verifyAuth(req) {
    const token = req.headers.get('x-openclaw-token') ?? req.headers.get('authorization')?.replace('Bearer ', '');
    return token === process.env.OPENCLAW_SECRET;
}
// Parse natural language commands
function parseCommand(text) {
    const t = text.trim().toLowerCase();
    if (t.startsWith('/price') || t.includes('price of') || t.includes('how much is'))
        return { cmd: 'price', args: text.replace(/\/price/i, '').trim() };
    if (t.startsWith('/movers') || t.includes('top movers') || t.includes('gainers'))
        return { cmd: 'movers', args: '' };
    if (t.startsWith('/summary') || t.includes('market summary'))
        return { cmd: 'summary', args: text.replace(/\/summary/i, '').trim() };
    if (t.startsWith('/help'))
        return { cmd: 'help', args: '' };
    return { cmd: 'ai', args: text };
}
async function handleCommand(cmd, args) {
    switch (cmd) {
        case 'price': {
            const symbol = args.toUpperCase().replace(/[^A-Z]/g, '') || 'BTC';
            const pair = `${symbol.toLowerCase()}_usdt`;
            try {
                const ticker = await getTicker(pair);
                const dir = ticker.changePct >= 0 ? '↑' : '↓';
                return `💰 *${symbol}/USDT*\n$${ticker.price.toLocaleString('en', { maximumFractionDigits: 6 })}\n${dir} ${ticker.changePct >= 0 ? '+' : ''}${ticker.changePct.toFixed(2)}% (24h)\nHigh: $${ticker.high.toLocaleString()} · Low: $${ticker.low.toLocaleString()}\n\n_via LBrain · lbrain.ai_`;
            }
            catch {
                return `❌ Could not find price for ${symbol}. Make sure it's listed on LBank.`;
            }
        }
        case 'movers': {
            try {
                const { gainers, losers } = await getTopMovers(5);
                const g = gainers.slice(0, 3).map(m => `🟢 ${m.symbol.replace('_usdt', '').toUpperCase()} +${m.changePct.toFixed(2)}%`).join('\n');
                const l = losers.slice(0, 3).map(m => `🔴 ${m.symbol.replace('_usdt', '').toUpperCase()} ${m.changePct.toFixed(2)}%`).join('\n');
                return `📊 *Top Movers (24h) — LBank*\n\n*Gainers*\n${g}\n\n*Losers*\n${l}\n\n_via LBrain · lbrain.ai_`;
            }
            catch {
                return `❌ Failed to fetch movers. Try again.`;
            }
        }
        case 'summary': {
            const symbol = args.toUpperCase().replace(/[^A-Z]/g, '') || 'BTC';
            const pair = `${symbol.toLowerCase()}_usdt`;
            try {
                const s = await getMarketSummary(pair);
                const emoji = s.sentiment === 'bullish' ? '🟢' : s.sentiment === 'bearish' ? '🔴' : '🟡';
                return `${emoji} *${s.symbol} Market Summary*\nPrice: $${s.price.toLocaleString()}\nChange: ${s.change}\nHigh: $${s.high.toLocaleString()} · Low: $${s.low.toLocaleString()}\nVolume: ${s.volume.toLocaleString()}\nSentiment: ${s.sentiment.toUpperCase()}\n\n_via LBrain · lbrain.ai_`;
            }
            catch {
                return `❌ Could not get summary for ${symbol}.`;
            }
        }
        case 'help':
            return `🤖 *LBrain Commands*\n\n/price BTC — get live price\n/movers — top 24h gainers & losers\n/summary ETH — full market summary\n\nOr just ask anything naturally!\n\n_LBrain · The AI brain for LBank_`;
        case 'ai':
        default: {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: args }],
                        mode: 'assistant',
                    }),
                });
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let full = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    const lines = decoder.decode(value).split('\n');
                    for (const line of lines) {
                        if (!line.startsWith('data: '))
                            continue;
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'text')
                                full += data.text;
                        }
                        catch { }
                    }
                }
                return `${full}\n\n_via LBrain · lbrain.ai_`;
            }
            catch {
                return `❌ AI response failed. Try /help for available commands.`;
            }
        }
    }
}
export async function POST(req) {
    if (!verifyAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { message, channel, sender } = body;
        if (!message) {
            return NextResponse.json({ error: 'message required' }, { status: 400 });
        }
        const { cmd, args } = parseCommand(message);
        const reply = await handleCommand(cmd, args);
        console.log(`[openclaw] ${channel} from ${sender}: "${message.slice(0, 50)}" → ${cmd}`);
        return NextResponse.json({ success: true, reply, cmd });
    }
    catch (err) {
        console.error('[openclaw/message]', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map