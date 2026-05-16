'use client'

import type { Couple, CoupleInvite } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export async function insertCouple(sb: AnySupabase, values: { name: string; currency?: string }): Promise<{ data: Couple | null; error: Error | null }> {
  const result = await sb.from('couples').insert(values).select().single()
  return result as { data: Couple | null; error: Error | null }
}

export async function insertCoupleMember(sb: AnySupabase, values: {
  couple_id: string; user_id: string; display_name: string; color: string; share_ratio?: number
}): Promise<{ error: Error | null }> {
  const result = await sb.from('couple_members').insert(values)
  return result as { error: Error | null }
}

export async function updateProfile(sb: AnySupabase, userId: string, values: {
  couple_id?: string | null; display_name?: string; color?: string
}): Promise<{ error: Error | null }> {
  const result = await sb.from('profiles').update(values).eq('id', userId)
  return result as { error: Error | null }
}

export async function updateCoupleMember(sb: AnySupabase, userId: string, coupleId: string, values: {
  display_name?: string; color?: string
}): Promise<{ error: Error | null }> {
  const result = await sb.from('couple_members').update(values).eq('user_id', userId).eq('couple_id', coupleId)
  return result as { error: Error | null }
}

export async function selectInviteByToken(sb: AnySupabase, token: string): Promise<{ data: CoupleInvite | null; error: Error | null }> {
  const result = await sb.from('couple_invites').select('*').eq('token', token).single()
  return result as { data: CoupleInvite | null; error: Error | null }
}

export async function markInviteUsed(sb: AnySupabase, id: string): Promise<{ error: Error | null }> {
  const result = await sb.from('couple_invites').update({ used_at: new Date().toISOString() }).eq('id', id)
  return result as { error: Error | null }
}

export async function insertInvite(sb: AnySupabase, values: { couple_id: string; token: string; expires_at: string }): Promise<{ error: Error | null }> {
  const result = await sb.from('couple_invites').insert(values)
  return result as { error: Error | null }
}
