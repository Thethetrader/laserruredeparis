'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCouple, useCoupleMembers, useProfile } from '@/lib/queries/useCouple'
import { useCategories, useUpsertCategory, useArchiveCategory } from '@/lib/queries/useCategories'
import { useAllExpenses } from '@/lib/queries/useExpenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MemberAvatar } from '@/components/MemberAvatar'
import { toast } from 'sonner'
import { SignOut, Plus, Trash, PencilSimple, Camera, LinkSimple, Copy, CheckCircle } from '@phosphor-icons/react'
import { fileToDataUrl, getMemberAvatar, setMemberAvatar, useCoupleCover, setCoupleCover } from '@/lib/utils/avatars'
import { useRef } from 'react'
import { formatShortDate } from '@/lib/utils/format'
import type { Expense } from '@/lib/supabase/types'
import { useQueryClient } from '@tanstack/react-query'

const COLORS = ['#e07a5f', '#81b29a', '#3d405b', '#f2cc8f', '#457b9d', '#e63946', '#2a9d8f']

export default function SettingsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: couple, isLoading: coupleLoading } = useCouple()
  const { data: members = [] } = useCoupleMembers()
  const { data: profile } = useProfile()
  const { data: categories = [] } = useCategories()
  const { data: expenses = [] } = useAllExpenses()
  const upsertCategory = useUpsertCategory()
  const archiveCategory = useArchiveCategory()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [color, setColor] = useState(profile?.color ?? COLORS[0])
  const [savingProfile, setSavingProfile] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#8d99ae')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const profilePhotoRef = useRef<HTMLInputElement>(null)
  const couplePhotoRef = useRef<HTMLInputElement>(null)
  const coupleCover = useCoupleCover()

  async function onProfilePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    let userId = profile?.id
    if (!userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { user } } = await (createClient() as any).auth.getUser()
      userId = user?.id
    }
    if (!userId) return
    try {
      const dataUrl = await fileToDataUrl(file, 400)
      setMemberAvatar(userId, dataUrl)
      toast.success('Photo de profil mise à jour')
    } catch { toast.error('Erreur lors du chargement') }
    e.target.value = ''
  }

  async function onCouplePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file, 1200)
      setCoupleCover(dataUrl)
      toast.success('Photo du couple mise à jour')
    } catch { toast.error('Erreur lors du chargement') }
    e.target.value = ''
  }

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setColor(profile.color ?? COLORS[0])
    }
  }, [profile])

  async function saveProfile() {
    if (!profile) return
    setSavingProfile(true)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('profiles').update({ display_name: displayName, color }).eq('id', profile.id)
    if (couple) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('couple_members').update({ display_name: displayName, color }).eq('user_id', profile.id).eq('couple_id', couple.id)
    }
    setSavingProfile(false)
    if (error) { toast.error('Erreur'); return }
    qc.invalidateQueries({ queryKey: ['profile'] })
    qc.invalidateQueries({ queryKey: ['couple-members'] })
    toast.success('Profil mis à jour')
  }

  async function generateInvite() {
    setInviteLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    let coupleId = couple?.id
    if (!coupleId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setInviteLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('couple_id').eq('id', user.id).single()
      coupleId = p?.couple_id
    }

    if (!coupleId) {
      toast.error('Aucun couple trouvé')
      setInviteLoading(false)
      return
    }

    const token = crypto.randomUUID()
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    await supabase.from('couple_invites').insert({ couple_id: coupleId, token, expires_at: expires.toISOString() })
    setInviteLink(`${window.location.origin}/invite/${token}`)
    setInviteLoading(false)
  }

  async function copyInvite() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function addCategory() {
    if (!newCatName.trim()) return
    let coupleId = couple?.id
    if (!coupleId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('couple_id').eq('id', user.id).single()
      coupleId = p?.couple_id
    }
    if (!coupleId) { toast.error('Aucun couple trouvé'); return }
    try {
      await upsertCategory.mutateAsync({ couple_id: coupleId, name: newCatName.trim(), color: newCatColor, icon: 'Tag' })
      setNewCatName('')
      toast.success('Catégorie ajoutée')
    } catch { toast.error('Erreur') }
  }

  function exportCSV() {
    const header = 'Date,Description,Catégorie,Montant,Payé par'
    const rows = (expenses as Expense[]).map(e => {
      return [e.spent_at, `"${e.description}"`, e.category_id, e.amount, e.paid_by].join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `depenses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export téléchargé')
  }

  return (
    <div className="pt-6 space-y-6 pb-8">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Paramètres</h1>

      {/* Couple cover */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Photo du couple</h2>
        <div className="relative h-32 rounded-xl overflow-hidden">
          {coupleCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coupleCover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #e07a5f 0%, #f2cc8f 50%, #81b29a 100%)' }} />
          )}
          <button
            onClick={() => couplePhotoRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur hover:bg-black/55 transition-colors text-white text-xs font-medium flex items-center gap-1.5"
          >
            <Camera size={14} weight="bold" />
            Changer
          </button>
        </div>
        <input ref={couplePhotoRef} type="file" accept="image/*" onChange={onCouplePhotoSelected} className="hidden" />
        {coupleCover && (
          <button onClick={() => { setCoupleCover(null); toast.success('Photo retirée') }} className="text-xs text-red-500 hover:underline">
            Retirer la photo
          </button>
        )}
      </section>

      {/* Profile */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mon profil</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MemberAvatar userId={profile?.id} name={displayName || 'Moi'} color={color} size="xl" />
            <button
              onClick={() => profilePhotoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center justify-center hover:scale-105 transition-transform"
              aria-label="Changer la photo"
            >
              <Camera size={12} className="text-zinc-600 dark:text-zinc-300" weight="bold" />
            </button>
            <input ref={profilePhotoRef} type="file" accept="image/*" onChange={onProfilePhotoSelected} className="hidden" />
          </div>
          {profile?.id && getMemberAvatar(profile.id) && (
            <button
              onClick={() => { setMemberAvatar(profile.id, null); toast.success('Photo retirée') }}
              className="text-xs text-red-500 hover:underline self-start mt-1"
            >
              Retirer
            </button>
          )}
          <div className="flex gap-1.5">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform active:scale-95"
                style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : '2px solid transparent', outlineOffset: '2px' }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label>Prénom</Label>
          <Input className="rounded-2xl" value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <Button onClick={saveProfile} disabled={savingProfile} className="w-full rounded-2xl bg-[#e07a5f] hover:bg-[#d06a4f] text-white">
          {savingProfile ? 'Enregistrement…' : 'Sauvegarder'}
        </Button>
      </section>

      {/* Categories */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Catégories</h2>
        <div className="space-y-1.5">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 py-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-sm flex-1 text-zinc-700 dark:text-zinc-300">{cat.name}</span>
              <button
                onClick={() => archiveCategory.mutate(cat.id)}
                className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-300 hover:text-red-400 transition-colors"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <input
            type="color"
            value={newCatColor}
            onChange={e => setNewCatColor(e.target.value)}
            className="w-10 h-10 rounded-xl border border-zinc-200 cursor-pointer"
          />
          <Input
            placeholder="Nouvelle catégorie"
            className="rounded-2xl flex-1"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
          />
          <Button onClick={addCategory} size="icon" className="rounded-xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 flex-shrink-0">
            <Plus size={16} />
          </Button>
        </div>
      </section>

      {/* Invite partner — only show if solo */}
      {members.length < 2 && (
        <section className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-5 border border-amber-200/50 dark:border-amber-900/50 space-y-3">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Inviter mon partenaire</h2>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Partagez ce lien à votre partenaire pour qu'il rejoigne votre espace commun.
          </p>
          {inviteLink ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex-1 break-all bg-amber-100 dark:bg-amber-900/30 rounded-xl px-3 py-2 font-mono">
                {inviteLink}
              </p>
              <button
                onClick={copyInvite}
                className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors flex-shrink-0"
              >
                {copied ? <CheckCircle size={16} weight="bold" /> : <Copy size={16} />}
              </button>
            </div>
          ) : (
            <Button
              onClick={generateInvite}
              disabled={inviteLoading}
              className="w-full rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              <LinkSimple size={16} className="mr-2" />
              {inviteLoading ? 'Génération…' : 'Générer un lien d\'invitation'}
            </Button>
          )}
        </section>
      )}

      {/* Export */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Export</h2>
        <Button variant="outline" onClick={exportCSV} className="w-full rounded-2xl">
          Exporter les dépenses en CSV
        </Button>
      </section>

      {/* Logout */}
      <Button
        variant="outline"
        onClick={logout}
        className="w-full rounded-2xl text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        <SignOut size={16} className="mr-2" />
        Se déconnecter
      </Button>
    </div>
  )
}
