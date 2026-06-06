import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function GET(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: import("@lbrain/lbank-skills").LBankPortfolio;
}> | NextResponse<{
    success: boolean;
    data: any[];
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map