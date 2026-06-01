'use client'

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, color = 'var(--blue)' }: { size?: number; color?: string }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.1)`,
      borderTopColor: color,
      display: 'inline-block',
      animation: 'lbSpin 0.7s linear infinite',
    }} />
  )
}

// ── Page loader ────────────────────────────────────────────────────────────
export function PageLoader({ label }: { label?: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', minHeight:200, gap:12 }}>
      <Spinner size={20} />
      {label && <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{label}</div>}
      <style>{`@keyframes lbSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Skeleton line ──────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 12, radius = 4 }: { width?: string | number; height?: number; radius?: number }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, var(--bg3) 0%, var(--bg4) 50%, var(--bg3) 100%)',
      backgroundSize: '200% 100%',
      animation: 'lbShimmer 1.4s ease infinite',
    }} />
  )
}

// ── Skeleton card ──────────────────────────────────────────────────────────
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width={i === 0 ? '60%' : i === rows-1 ? '40%' : '100%'} height={i === 0 ? 14 : 10} />
      ))}
      <style>{`
        @keyframes lbShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

// ── Ticker skeleton row ────────────────────────────────────────────────────
export function TickerSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 70px', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.03)', gap:8 }}>
          <Skeleton width="70%" height={10} />
          <Skeleton width="80%" height={10} />
          <Skeleton width="60%" height={10} />
          <Skeleton width="50%" height={10} />
        </div>
      ))}
    </div>
  )
}
