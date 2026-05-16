import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any
        // Ensure profile exists (since trigger was removed)
        await sb.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })
        const { data: profile } = await sb.from('profiles').select('couple_id').eq('id', user.id).single()
        if (!profile?.couple_id) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
