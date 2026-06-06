import Link from 'next/link';
export default function NotFound() {
    return (<div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#09090f', fontFamily: 'var(--font-sans)', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, fontFamily: "'DM Mono',monospace", color: 'rgba(26,111,255,0.3)', marginBottom: 16, fontWeight: 300 }}>404</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: '#d4d8e8', marginBottom: 8 }}>Page not found</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 24 }}>This page does not exist or has been moved.</div>
      <Link href="/" style={{ padding: '8px 20px', borderRadius: 8, background: '#1a6fff', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 500 }}>
        Back to LBrain
      </Link>
    </div>);
}
//# sourceMappingURL=not-found.js.map