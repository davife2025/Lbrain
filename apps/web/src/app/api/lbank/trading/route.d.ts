import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function POST(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: {
        success: boolean;
        message: string;
    };
}> | NextResponse<{
    success: boolean;
    data: import("@lbrain/lbank-skills").LBankOrder[];
}> | NextResponse<{
    success: boolean;
    data: import("@lbrain/lbank-skills").LBankOrder | null;
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map