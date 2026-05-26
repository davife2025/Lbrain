'use client'

import { useState } from 'react'
import type { Notification } from '@/hooks/useEngines'

interface Props {
  notifications: Notification[]
  unreadCount:   number
  onMarkRead:    () => void
  onClear:       () => void
}

export default function NotificationBell({ notifications, unreadCount, onMarkRead, onClear }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position:'relative', fontFamily:"'DM Mono','Space Mono',monospace" }}>
      <button
        onClick={() => { setOpen(v => !v); if (unreadCount > 0) onMarkRead() }}
        style={{ width:34, height:34, borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <span style={{ fontSize:14 }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:'var(--blue)', color:'#fff', fontSize:8, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:'absolute', top:42, right:0, width:300, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', zIndex:100, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>Notifications</span>
            <div style={{ display:'flex', gap:8 }}>
              {notifications.length > 0 && (
                <button onClick={onClear} style={{ fontSize:9, color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer' }}>Clear all</button>
              )}
              <button onClick={() => setOpen(false)} style={{ fontSize:12, color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
            </div>
          </div>

          <div style={{ maxHeight:320, overflowY:'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', fontSize:11, color:'var(--text3)' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', background: n.read ? 'transparent' : 'rgba(26,111,255,0.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:10 }}>{n.type === 'alert' ? '🔔' : '🤖'}</span>
                      <span style={{ fontSize:10, fontWeight:600, color:'var(--text)' }}>{n.title}</span>
                    </div>
                    <span style={{ fontSize:8, color:'var(--text3)' }}>{new Date(n.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontSize:9, color:'var(--text3)', lineHeight:1.4 }}>{n.message}</div>
                  {!n.success && (
                    <span style={{ fontSize:8, color:'var(--red)', marginTop:2, display:'block' }}>Failed</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
