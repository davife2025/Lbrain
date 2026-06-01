/**
 * apps/web/src/app/api/agent/notify/route.ts
 * Receives alert/agent execution events from the Render server.
 * Stores in Supabase and optionally forwards to Telegram.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function verifyServer(req: NextRequest) {
  const token = req.headers.get('x-server-secret')
  return token === process.env.SERVER_SECRET
}

export async function POST(req: NextRequest) {
  if (!verifyServer(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, userId, data, message } = body

    console.log(`[notify] ${type} for user ${userId}`)

    // Store notification in Supabase
    try {
      const { createServerClient } = await import('@/lib/supabase')
      const supabase = createServerClient()

      await supabase.from('notifications').insert({
        user_id:    userId,
        type,
        data:       JSON.stringify(data),
        message,
        created_at: new Date().toISOString(),
        read:       false,
      })
    } catch (err: any) {
      // Supabase notifications table is optional — don't fail if missing
      console.warn('[notify] Supabase store skipped:', err.message)
    }

    return NextResponse.json({ success: true, type })
  } catch (err: any) {
    console.error('[notify]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
