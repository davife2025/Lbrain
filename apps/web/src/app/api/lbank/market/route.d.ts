import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function GET(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: import("@lbrain/lbank-skills").LBankTicker;
}> | NextResponse<{
    success: boolean;
    data: import("@lbrain/lbank-skills").LBankTicker[];
}> | NextResponse<{
    success: boolean;
    data: {
        gainers: import("@lbrain/lbank-skills").LBankTicker[];
        losers: import("@lbrain/lbank-skills").LBankTicker[];
    };
}> | NextResponse<{
    success: boolean;
    data: import("@lbrain/lbank-skills").LBankOrderBook;
}> | NextResponse<{
    success: boolean;
    data: import("@lbrain/lbank-skills").LBankKline[];
}> | NextResponse<{
    success: boolean;
    data: import("@lbrain/lbank-skills").LBankTrade[];
}> | NextResponse<{
    success: boolean;
    data: string[];
}> | NextResponse<{
    success: boolean;
    data: {
        symbol: string;
        price: number;
        change: string;
        high: number;
        low: number;
        volume: number;
        sentiment: "bullish" | "bearish" | "neutral";
    };
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=route.d.ts.map