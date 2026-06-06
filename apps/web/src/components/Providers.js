'use client';
import { SessionProvider } from 'next-auth/react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/Toast';
export default function Providers({ children }) {
    return (<SessionProvider>
      <ErrorBoundary>
        {children}
        <ToastContainer />
      </ErrorBoundary>
    </SessionProvider>);
}
//# sourceMappingURL=Providers.js.map