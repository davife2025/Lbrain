'use client';
export default function GlobalError({ error, reset }) {
    return (<html>
      <body style={{ margin: 0, background: '#09090f', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, color: '#d4d8e8' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>⊘</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 24, fontFamily: 'monospace' }}>{error.message}</div>
          <button onClick={reset} style={{ padding: '8px 20px', borderRadius: 8, background: '#1a6fff', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>
            Try again
          </button>
        </div>
      </body>
    </html>);
}
//# sourceMappingURL=global-error.js.map