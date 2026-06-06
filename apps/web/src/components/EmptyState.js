'use client';
export default function EmptyState({ icon, title, desc, action, onAction }) {
    return (<div style={{ textAlign: 'center', padding: '48px 20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4, fontFamily: 'var(--font-mono)' }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em' }}>{title}</div>
      {desc && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.5, maxWidth: 240, margin: '0 auto 16px' }}>{desc}</div>}
      {action && onAction && (<button onClick={onAction} style={{ padding: '7px 18px', borderRadius: 8, background: 'var(--blue)', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
          {action}
        </button>)}
    </div>);
}
//# sourceMappingURL=EmptyState.js.map