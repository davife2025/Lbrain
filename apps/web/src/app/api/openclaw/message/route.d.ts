/**
 * apps/web/src/app/api/openclaw/message/route.ts
 * Receives messages from OpenClaw gateway (Telegram, WhatsApp, Discord)
 * Routes them through LBrain AI and returns a response.
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const maxDuration = 30;
export declare function POST(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    reply: string;
    cmd: string;
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map