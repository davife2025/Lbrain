/**
 * apps/web/src/app/api/agent/sync/route.ts
 * Syncs user alerts and rules from web app to Render server.
 * Called when user adds/removes alerts or rules.
 */
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const SERVER_URL = process.env.RENDER_SERVER_URL ?? '';
const SERVER_SECRET = process.env.SERVER_SECRET ?? '';
async function callServer(method, path, body) {
    if (!SERVER_URL)
        throw new Error('RENDER_SERVER_URL not configured');
    const res = await fetch(`${SERVER_URL}/api${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-server-secret': SERVER_SECRET,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
}
export async function POST(req) {
    try {
        const body = await req.json();
        const { action, type, data } = body;
        // action: 'add' | 'remove' | 'sync_all'
        // type:   'alert' | 'rule'
        if (action === 'add' && type === 'alert') {
            const result = await callServer('POST', '/alerts', data);
            return NextResponse.json(result);
        }
        if (action === 'remove' && type === 'alert') {
            const result = await callServer('DELETE', `/alerts/${data.id}`);
            return NextResponse.json(result);
        }
        if (action === 'add' && type === 'rule') {
            const result = await callServer('POST', '/rules', data);
            return NextResponse.json(result);
        }
        if (action === 'remove' && type === 'rule') {
            const result = await callServer('DELETE', `/rules/${data.id}`);
            return NextResponse.json(result);
        }
        if (action === 'status') {
            const result = await callServer('GET', '/status');
            return NextResponse.json(result);
        }
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    catch (err) {
        console.error('[agent/sync]', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
export async function GET(req) {
    try {
        const result = await callServer('GET', '/health');
        return NextResponse.json(result);
    }
    catch (err) {
        return NextResponse.json({ error: err.message, connected: false }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map