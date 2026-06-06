export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
interface Props {
    candles: Candle[];
    height?: number;
    symbol?: string;
}
export default function CandleChart({ candles, height, symbol }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=CandleChart.d.ts.map