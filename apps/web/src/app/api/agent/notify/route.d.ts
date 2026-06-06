/**
 * apps/web/src/app/api/agent/notify/route.ts
 * Receives alert/agent execution events from the Render server.
 * Stores in Supabase and optionally forwards to Telegram.
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function POST(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    type: any;
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map