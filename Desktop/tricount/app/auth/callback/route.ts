import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookiesToSet: Array<{ name: string; value: string; options: object }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookies) { cookiesToSet.push(...cookies) },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      let redirectPath = '/dashboard'

      if (user) {
        await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })
        const { data: profile } = await supabase.from('profiles').select('couple_id').eq('id', user.id).single()
        if (!profile?.couple_id) {
          redirectPath = '/onboarding'
        }
      }

      const response = NextResponse.redirect(new URL(redirectPath, origin))
      // Attach session cookies to the redirect so the browser is logged in
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
      })
      return response
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
