/**
 * apps/web/src/app/api/agent/sync/route.ts
 * Syncs user alerts and rules from web app to Render server.
 * Called when user adds/removes alerts or rules.
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function POST(req: NextRequest): Promise<NextResponse<any>>;
export declare function GET(req: NextRequest): Promise<NextResponse<any>>;
//# sourceMappingURL=route.d.ts.map