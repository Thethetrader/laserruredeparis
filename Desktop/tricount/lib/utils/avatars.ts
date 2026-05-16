'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { CoupleMember } from '@/lib/supabase/types'

const STORAGE_PREFIX = 'monbudget:avatar:'
const COUPLE_KEY = 'monbudget:couple-cover'
const EVT = 'monbudget:avatars-changed'

export function getMemberAvatar(userId: string | null | undefined): string | null {
  if (!userId || typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_PREFIX + userId)
}

export function setMemberAvatar(userId: string, dataUrl: string | null) {
  if (typeof window === 'undefined') return
  if (dataUrl) localStorage.setItem(STORAGE_PREFIX + userId, dataUrl)
  else localStorage.removeItem(STORAGE_PREFIX + userId)
  window.dispatchEvent(new Event(EVT))
}

export function getCoupleCover(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(COUPLE_KEY)
}

export function setCoupleCover(dataUrl: string | null) {
  if (typeof window === 'undefined') return
  if (dataUrl) localStorage.setItem(COUPLE_KEY, dataUrl)
  else localStorage.removeItem(COUPLE_KEY)
  window.dispatchEvent(new Event(EVT))
}

export function useMemberAvatar(userId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  const qc = useQueryClient()

  useEffect(() => {
    if (!userId) return

    // Try localStorage first (fast), then fall back to Supabase data
    const local = getMemberAvatar(userId)
    if (local) {
      setUrl(local)
    } else {
      const members = qc.getQueryData<CoupleMember[]>(['couple-members'])
      const member = members?.find(m => m.user_id === userId)
      if (member?.avatar_url) {
        // Seed localStorage from DB so it's available offline
        setMemberAvatar(userId, member.avatar_url)
        setUrl(member.avatar_url)
      } else {
        setUrl(null)
      }
    }

    const handler = () => setUrl(getMemberAvatar(userId))
    window.addEventListener(EVT, handler)

    // Also update when couple-members query refreshes
    const unsubscribe = qc.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === 'couple-members' && event.type === 'updated') {
        const members = qc.getQueryData<CoupleMember[]>(['couple-members'])
        const member = members?.find(m => m.user_id === userId)
        if (member?.avatar_url) {
          setMemberAvatar(userId, member.avatar_url)
          setUrl(member.avatar_url)
        }
      }
    })

    return () => {
      window.removeEventListener(EVT, handler)
      unsubscribe()
    }
  }, [userId, qc])

  return url
}

export function useCoupleCover(): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    setUrl(getCoupleCover())
    const handler = () => setUrl(getCoupleCover())
    window.addEventListener(EVT, handler)
    return () => window.removeEventListener(EVT, handler)
  }, [])
  return url
}

export function fileToDataUrl(file: File, maxSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('image load'))
      img.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no ctx'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
