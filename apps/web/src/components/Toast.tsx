'use client'

import { useState, useCallback, useEffect } from 'react'

export interface Toast {
  id:      string
  message: string
  type:    'success' | 'error' | 'info'
  duration?: number
}

let toastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null

export function toast(message: string, type: Toast['type'] = 'info', duration = 3000) {
  toastFn?.({ message, type, duration })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastFn = (t) => {
      const id = crypto.randomUUID()
      setToasts(prev => [...prev, { ...t, id }])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), t.duration ?? 3000)
    }
    return () => { toastFn = null }
  }, [])

  if (!toasts.length) return null

  const colors: Record<Toast['type'], string> = {
    success: 'var(--green)',
    error:   'var(--red)',
    info:    'var(--blue)',
  }

  return (
    <div style={{ position:'fixed', bottom:72, right:16, zIndex:200, display:'flex', flexDirection:'column', gap:8, fontFamily:'var(--font-sans)' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding:'10px 14px', borderRadius:10, fontSize:12, fontWeight:400,
          background:'var(--bg2)', border:`1px solid ${colors[t.type]}33`,
          color:'var(--text)', maxWidth:280,
          boxShadow:'0 4px 16px rgba(0,0,0,0.4)',
          animation:'lbToast 0.2s ease',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <span style={{ color: colors[t.type], fontSize:14, flexShrink:0 }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes lbToast{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
