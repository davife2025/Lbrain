import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@lbrain/ai'
import { rateLimit } from '@/lib/rateLimit'
import type { LBankCredentials } from '@lbrain/lbank-skills'

export const dynamic     = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = rateLimit(`ai:${ip}`, 'ai')
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const body = await req.json()
    const { messages = [], mode = 'assistant', credentials } = body

    const creds: LBankCredentials | undefined = credentials?.apiKey
      ? { apiKey: credentials.apiKey, secretKey: credentials.secretKey }
      : undefined

    const encoder = new TextEncoder()
    const stream  = new ReadableStream({
      async start(controller) {
        try {
          await runAgent({
            messages,
            mode,
            credentials: creds,
            onChunk: (text) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`))
            },
          })
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (err: any) {
    console.error('[ai/chat]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
