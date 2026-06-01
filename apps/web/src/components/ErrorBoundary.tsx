'use client'

import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div style={{ padding:'32px 20px', textAlign:'center', fontFamily:'var(--font-sans)' }}>
          <div style={{ fontSize:28, marginBottom:12, opacity:0.4 }}>⊘</div>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:6 }}>
            Something went wrong
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16, fontFamily:'var(--font-mono)' }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding:'7px 16px', borderRadius:8, background:'var(--blue)', border:'none', color:'#fff', fontSize:11, cursor:'pointer' }}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
