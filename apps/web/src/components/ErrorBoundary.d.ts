import { Component, type ReactNode } from 'react';
interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}
interface State {
    error: Error | null;
}
export default class ErrorBoundary extends Component<Props, State> {
    state: State;
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error): void;
    render(): string | number | bigint | boolean | import("react").JSX.Element | Iterable<ReactNode> | Promise<import("react").AwaitedReactNode> | null | undefined;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map