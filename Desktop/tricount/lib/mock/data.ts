// @ts-nocheck
import type { Couple, CoupleMember, Profile, Category, Expense, ExpenseShare, MonthlyBudget, SavingsPot, SavingsTransaction, Settlement } from '@/lib/supabase/types'

export const MOCK_USER_ID = 'mock-user-1'
export const MOCK_PARTNER_ID = 'mock-user-2'
export const MOCK_COUPLE_ID = 'mock-couple-id'

export const MOCK_COUPLE: Couple = {
  id: MOCK_COUPLE_ID,
  name: 'Théo & Marie',
  currency: 'EUR',
  created_at: '2026-01-01T00:00:00Z',
}

export const MOCK_PROFILE: Profile = {
  id: MOCK_USER_ID,
  couple_id: MOCK_COUPLE_ID,
  display_name: 'Théo',
  avatar_url: null,
  color: '#e07a5f',
  updated_at: '2026-01-01T00:00:00Z',
}

export const MOCK_MEMBERS: CoupleMember[] = [
  { couple_id: MOCK_COUPLE_ID, user_id: MOCK_USER_ID, display_name: 'Théo', color: '#e07a5f', share_ratio: 0.5, joined_at: '2026-01-01T00:00:00Z' },
  { couple_id: MOCK_COUPLE_ID, user_id: MOCK_PARTNER_ID, display_name: 'Marie', color: '#2a9d8f', share_ratio: 0.5, joined_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', couple_id: MOCK_COUPLE_ID, name: 'Alimentation', color: '#4CAF50', icon: '🛒', sort_order: 1, is_archived: false },
  { id: 'cat-2', couple_id: MOCK_COUPLE_ID, name: 'Logement', color: '#2196F3', icon: '🏠', sort_order: 2, is_archived: false },
  { id: 'cat-3', couple_id: MOCK_COUPLE_ID, name: 'Transport', color: '#FF9800', icon: '🚗', sort_order: 3, is_archived: false },
  { id: 'cat-4', couple_id: MOCK_COUPLE_ID, name: 'Santé', color: '#E91E63', icon: '💊', sort_order: 4, is_archived: false },
  { id: 'cat-5', couple_id: MOCK_COUPLE_ID, name: 'Loisirs', color: '#9C27B0', icon: '🎭', sort_order: 5, is_archived: false },
  { id: 'cat-6', couple_id: MOCK_COUPLE_ID, name: 'Restaurant', color: '#FF5722', icon: '🍽️', sort_order: 6, is_archived: false },
  { id: 'cat-7', couple_id: MOCK_COUPLE_ID, name: 'Shopping', color: '#00BCD4', icon: '👗', sort_order: 7, is_archived: false },
  { id: 'cat-8', couple_id: MOCK_COUPLE_ID, name: 'Abonnements', color: '#607D8B', icon: '📱', sort_order: 8, is_archived: false },
  { id: 'cat-9', couple_id: MOCK_COUPLE_ID, name: 'Vacances', color: '#3F51B5', icon: '✈️', sort_order: 9, is_archived: false },
  { id: 'cat-10', couple_id: MOCK_COUPLE_ID, name: 'Divers', color: '#795548', icon: '📦', sort_order: 10, is_archived: false },
]

type ExpenseWithShares = Expense & { expense_shares: ExpenseShare[] }

const makeExpense = (
  id: string, categoryId: string, label: string, amount: number,
  paidBy: string, date: string, shares?: [number, number]
): ExpenseWithShares => {
  const [s1, s2] = shares ?? [Math.round(amount / 2 * 100) / 100, Math.round(amount / 2 * 100) / 100]
  return {
    id, couple_id: MOCK_COUPLE_ID, category_id: categoryId, label,
    amount, paid_by: paidBy, spent_at: date,
    created_at: date + 'T10:00:00Z', updated_at: date + 'T10:00:00Z',
    expense_shares: [
      { expense_id: id, user_id: MOCK_USER_ID, share_amount: s1 },
      { expense_id: id, user_id: MOCK_PARTNER_ID, share_amount: s2 },
    ],
  }
}

export const MOCK_EXPENSES_BY_MONTH: Record<string, ExpenseWithShares[]> = {
  '2026-05': [
    makeExpense('exp-1', 'cat-2', 'Loyer mai', 850, MOCK_USER_ID, '2026-05-01'),
    makeExpense('exp-2', 'cat-8', 'Netflix', 17.99, MOCK_USER_ID, '2026-05-02'),
    makeExpense('exp-3', 'cat-8', 'Spotify', 9.99, MOCK_PARTNER_ID, '2026-05-02'),
    makeExpense('exp-4', 'cat-1', 'Courses Carrefour', 98.47, MOCK_USER_ID, '2026-05-05'),
    makeExpense('exp-5', 'cat-6', 'Restaurant Le Comptoir', 64.30, MOCK_PARTNER_ID, '2026-05-07'),
    makeExpense('exp-6', 'cat-3', 'Essence', 72, MOCK_USER_ID, '2026-05-08'),
    makeExpense('exp-7', 'cat-1', 'Marché du dimanche', 32.40, MOCK_PARTNER_ID, '2026-05-10'),
    makeExpense('exp-8', 'cat-4', 'Pharmacie', 23.40, MOCK_USER_ID, '2026-05-11'),
    makeExpense('exp-9', 'cat-7', 'Zara soldes', 89, MOCK_PARTNER_ID, '2026-05-12', [0, 89]),
    makeExpense('exp-10', 'cat-5', 'Cinéma', 28, MOCK_USER_ID, '2026-05-14'),
    makeExpense('exp-11', 'cat-1', 'Monoprix', 41.20, MOCK_USER_ID, '2026-05-14'),
    makeExpense('exp-12', 'cat-8', 'Assurance habitation', 28.50, MOCK_USER_ID, '2026-05-05'),
    makeExpense('exp-13', 'cat-8', 'Salle de sport', 39.90, MOCK_PARTNER_ID, '2026-05-10'),
  ],
  '2026-04': [
    makeExpense('exp-a1', 'cat-2', 'Loyer avril', 850, MOCK_USER_ID, '2026-04-01'),
    makeExpense('exp-a2', 'cat-1', 'Courses Leclerc', 112.30, MOCK_PARTNER_ID, '2026-04-03'),
    makeExpense('exp-a3', 'cat-6', 'Brunch dimanche', 48, MOCK_USER_ID, '2026-04-06'),
    makeExpense('exp-a4', 'cat-3', 'SNCF billet', 64, MOCK_PARTNER_ID, '2026-04-09'),
    makeExpense('exp-a5', 'cat-8', 'Netflix', 17.99, MOCK_USER_ID, '2026-04-02'),
    makeExpense('exp-a6', 'cat-5', 'Théâtre', 56, MOCK_USER_ID, '2026-04-15'),
    makeExpense('exp-a7', 'cat-1', 'Marché', 28, MOCK_PARTNER_ID, '2026-04-17'),
    makeExpense('exp-a8', 'cat-4', 'Médecin', 25, MOCK_USER_ID, '2026-04-20'),
    makeExpense('exp-a9', 'cat-7', 'ASOS', 62, MOCK_PARTNER_ID, '2026-04-22', [0, 62]),
  ],
  '2026-03': [
    makeExpense('exp-m1', 'cat-2', 'Loyer mars', 850, MOCK_USER_ID, '2026-03-01'),
    makeExpense('exp-m2', 'cat-9', 'Avion Barcelone', 320, MOCK_USER_ID, '2026-03-05'),
    makeExpense('exp-m3', 'cat-1', 'Courses', 89, MOCK_PARTNER_ID, '2026-03-08'),
    makeExpense('exp-m4', 'cat-6', 'Resto Barcelone', 98, MOCK_USER_ID, '2026-03-10'),
    makeExpense('exp-m5', 'cat-3', 'Uber', 18, MOCK_PARTNER_ID, '2026-03-12'),
    makeExpense('exp-m6', 'cat-8', 'Netflix', 17.99, MOCK_USER_ID, '2026-03-02'),
    makeExpense('exp-m7', 'cat-5', 'Concert', 90, MOCK_PARTNER_ID, '2026-03-18'),
  ],
  '2026-02': [
    makeExpense('exp-f1', 'cat-2', 'Loyer février', 850, MOCK_USER_ID, '2026-02-01'),
    makeExpense('exp-f2', 'cat-1', 'Courses', 105, MOCK_PARTNER_ID, '2026-02-06'),
    makeExpense('exp-f3', 'cat-6', 'St-Valentin dîner', 142, MOCK_USER_ID, '2026-02-14'),
    makeExpense('exp-f4', 'cat-8', 'Netflix', 17.99, MOCK_USER_ID, '2026-02-02'),
    makeExpense('exp-f5', 'cat-3', 'Essence', 65, MOCK_PARTNER_ID, '2026-02-18'),
    makeExpense('exp-f6', 'cat-5', 'Bowling', 35, MOCK_USER_ID, '2026-02-21'),
  ],
  '2026-01': [
    makeExpense('exp-j1', 'cat-2', 'Loyer janvier', 850, MOCK_USER_ID, '2026-01-01'),
    makeExpense('exp-j2', 'cat-1', 'Courses', 95, MOCK_PARTNER_ID, '2026-01-07'),
    makeExpense('exp-j3', 'cat-7', 'Soldes hiver', 188, MOCK_PARTNER_ID, '2026-01-12', [0, 188]),
    makeExpense('exp-j4', 'cat-8', 'Netflix', 17.99, MOCK_USER_ID, '2026-01-02'),
    makeExpense('exp-j5', 'cat-6', 'Galette des rois', 28, MOCK_USER_ID, '2026-01-06'),
    makeExpense('exp-j6', 'cat-3', 'SNCF', 89, MOCK_USER_ID, '2026-01-20'),
  ],
}

export function getMockExpenses(month: string): ExpenseWithShares[] {
  return MOCK_EXPENSES_BY_MONTH[month] ?? []
}

export function getAllMockExpenses(): ExpenseWithShares[] {
  return Object.values(MOCK_EXPENSES_BY_MONTH).flat().sort((a, b) => b.spent_at.localeCompare(a.spent_at))
}

export const MOCK_BUDGETS_BY_MONTH: Record<string, MonthlyBudget[]> = {
  '2026-05': [
    { id: 'bud-1', couple_id: MOCK_COUPLE_ID, category_id: 'cat-1', month: '2026-05-01', amount: 500, created_by: MOCK_USER_ID },
    { id: 'bud-2', couple_id: MOCK_COUPLE_ID, category_id: 'cat-2', month: '2026-05-01', amount: 900, created_by: MOCK_USER_ID },
    { id: 'bud-3', couple_id: MOCK_COUPLE_ID, category_id: 'cat-3', month: '2026-05-01', amount: 150, created_by: MOCK_USER_ID },
    { id: 'bud-4', couple_id: MOCK_COUPLE_ID, category_id: 'cat-4', month: '2026-05-01', amount: 100, created_by: MOCK_USER_ID },
    { id: 'bud-5', couple_id: MOCK_COUPLE_ID, category_id: 'cat-5', month: '2026-05-01', amount: 200, created_by: MOCK_USER_ID },
    { id: 'bud-6', couple_id: MOCK_COUPLE_ID, category_id: 'cat-6', month: '2026-05-01', amount: 200, created_by: MOCK_USER_ID },
    { id: 'bud-7', couple_id: MOCK_COUPLE_ID, category_id: 'cat-7', month: '2026-05-01', amount: 100, created_by: MOCK_USER_ID },
    { id: 'bud-8', couple_id: MOCK_COUPLE_ID, category_id: 'cat-8', month: '2026-05-01', amount: 50, created_by: MOCK_USER_ID },
  ],
  '2026-04': [
    { id: 'bud-a1', couple_id: MOCK_COUPLE_ID, category_id: 'cat-1', month: '2026-04-01', amount: 500, created_by: MOCK_USER_ID },
    { id: 'bud-a2', couple_id: MOCK_COUPLE_ID, category_id: 'cat-2', month: '2026-04-01', amount: 900, created_by: MOCK_USER_ID },
    { id: 'bud-a3', couple_id: MOCK_COUPLE_ID, category_id: 'cat-3', month: '2026-04-01', amount: 150, created_by: MOCK_USER_ID },
    { id: 'bud-a4', couple_id: MOCK_COUPLE_ID, category_id: 'cat-5', month: '2026-04-01', amount: 200, created_by: MOCK_USER_ID },
    { id: 'bud-a5', couple_id: MOCK_COUPLE_ID, category_id: 'cat-6', month: '2026-04-01', amount: 200, created_by: MOCK_USER_ID },
    { id: 'bud-a6', couple_id: MOCK_COUPLE_ID, category_id: 'cat-8', month: '2026-04-01', amount: 50, created_by: MOCK_USER_ID },
  ],
}

export function getMockBudgets(month: string): MonthlyBudget[] {
  return MOCK_BUDGETS_BY_MONTH[month] ?? MOCK_BUDGETS_BY_MONTH['2026-05']
}

export const MOCK_SAVINGS_POTS: SavingsPot[] = [
  { id: 'pot-1', couple_id: MOCK_COUPLE_ID, name: 'Vacances Bretagne', goal_amount: 3000, current_amount: 1480, is_shared: true, color: '#3F51B5', icon: '⛵', is_archived: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'pot-2', couple_id: MOCK_COUPLE_ID, name: 'Nouvelle voiture', goal_amount: 15000, current_amount: 4320, is_shared: true, color: '#FF9800', icon: '🚗', is_archived: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'pot-3', couple_id: MOCK_COUPLE_ID, name: "Fond d'urgence", goal_amount: 5000, current_amount: 5000, is_shared: true, color: '#4CAF50', icon: '🛡️', is_archived: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'pot-4', couple_id: MOCK_COUPLE_ID, name: 'Appart rêve', goal_amount: 50000, current_amount: 1860, is_shared: true, color: '#E91E63', icon: '🏡', is_archived: false, created_at: '2026-02-01T00:00:00Z' },
]

export const MOCK_SAVINGS_TRANSACTIONS: SavingsTransaction[] = [
  { id: 'stx-1', pot_id: 'pot-1', couple_id: MOCK_COUPLE_ID, amount: 300, type: 'deposit', note: 'Virement mensuel', occurred_at: '2026-05-01T00:00:00Z', created_by: MOCK_USER_ID },
  { id: 'stx-2', pot_id: 'pot-2', couple_id: MOCK_COUPLE_ID, amount: 200, type: 'deposit', note: '', occurred_at: '2026-05-01T00:00:00Z', created_by: MOCK_USER_ID },
  { id: 'stx-3', pot_id: 'pot-4', couple_id: MOCK_COUPLE_ID, amount: 150, type: 'deposit', note: '', occurred_at: '2026-05-03T00:00:00Z', created_by: MOCK_PARTNER_ID },
  { id: 'stx-4', pot_id: 'pot-1', couple_id: MOCK_COUPLE_ID, amount: 300, type: 'deposit', note: 'Virement mensuel', occurred_at: '2026-04-01T00:00:00Z', created_by: MOCK_USER_ID },
  { id: 'stx-5', pot_id: 'pot-2', couple_id: MOCK_COUPLE_ID, amount: 200, type: 'deposit', note: '', occurred_at: '2026-04-01T00:00:00Z', created_by: MOCK_USER_ID },
  { id: 'stx-6', pot_id: 'pot-3', couple_id: MOCK_COUPLE_ID, amount: 500, type: 'deposit', note: 'Constitution du fond', occurred_at: '2026-01-15T00:00:00Z', created_by: MOCK_USER_ID },
]

export type RecurringExpense = {
  id: string
  couple_id: string
  member_id: string
  category_id: string
  label: string
  amount: number
  day_of_month: number
}

export const MOCK_RECURRING_EXPENSES: RecurringExpense[] = [
  { id: 'rec-1', couple_id: MOCK_COUPLE_ID, member_id: MOCK_USER_ID, category_id: 'cat-2', label: 'Loyer', amount: 850, day_of_month: 1 },
  { id: 'rec-2', couple_id: MOCK_COUPLE_ID, member_id: MOCK_USER_ID, category_id: 'cat-8', label: 'Netflix', amount: 17.99, day_of_month: 2 },
  { id: 'rec-3', couple_id: MOCK_COUPLE_ID, member_id: MOCK_PARTNER_ID, category_id: 'cat-8', label: 'Spotify', amount: 9.99, day_of_month: 2 },
  { id: 'rec-4', couple_id: MOCK_COUPLE_ID, member_id: MOCK_USER_ID, category_id: 'cat-8', label: 'Assurance habitation', amount: 28.50, day_of_month: 5 },
  { id: 'rec-5', couple_id: MOCK_COUPLE_ID, member_id: MOCK_PARTNER_ID, category_id: 'cat-8', label: 'Salle de sport', amount: 39.90, day_of_month: 10 },
]

export const MOCK_SETTLEMENTS: Settlement[] = [
  { id: 'set-1', couple_id: MOCK_COUPLE_ID, from_user: MOCK_PARTNER_ID, to_user: MOCK_USER_ID, amount: 124, note: 'Rééquilibrage avril', occurred_at: '2026-04-30T00:00:00Z', created_at: '2026-04-30T00:00:00Z' },
  { id: 'set-2', couple_id: MOCK_COUPLE_ID, from_user: MOCK_USER_ID, to_user: MOCK_PARTNER_ID, amount: 82, note: 'Rééquilibrage mars', occurred_at: '2026-03-31T00:00:00Z', created_at: '2026-03-31T00:00:00Z' },
]
