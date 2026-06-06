/**
 * apps/web/src/app/api/openclaw/price/route.ts
 * Quick price lookup — used by OpenClaw for fast responses
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function GET(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    symbol: string;
    pair: string;
    price: number;
    changePct: number;
    formatted: string;
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map