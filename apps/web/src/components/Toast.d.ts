export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}
export declare function toast(message: string, type?: Toast['type'], duration?: number): void;
export declare function ToastContainer(): import("react").JSX.Element | null;
//# sourceMappingURL=Toast.d.ts.map