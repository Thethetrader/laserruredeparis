import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string }
    if (!email || !emailRe.test(email)) {
      return NextResponse.json({ error: 'invalid email' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'misconfigured' }, { status: 500 })

    const supabase = createClient(url, key)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('waitlist')
      .insert({ email: email.toLowerCase().trim() })

    // 23505 = unique violation: already on the list. Treat as success.
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}
