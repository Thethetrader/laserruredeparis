import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { password } = await request.json()
  if (password === process.env.ADMIN_PASSWORD) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set({
      name: 'admin_auth',
      value: '1',
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    return res
  }
  return NextResponse.json({ ok: false }, { status: 401 })
} 