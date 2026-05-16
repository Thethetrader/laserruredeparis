const DEFAULT_CATEGORIES = [
  { name: 'Logement', icon: 'House', color: '#e07a5f', sort_order: 1 },
  { name: 'Charges', icon: 'Lightning', color: '#f2cc8f', sort_order: 2 },
  { name: 'Alimentation', icon: 'ShoppingCart', color: '#81b29a', sort_order: 3 },
  { name: 'Restaurants', icon: 'ForkKnife', color: '#f4a261', sort_order: 4 },
  { name: 'Transport', icon: 'Car', color: '#3d405b', sort_order: 5 },
  { name: 'Santé', icon: 'Heart', color: '#e63946', sort_order: 6 },
  { name: 'Vêtements', icon: 'TShirt', color: '#a8dadc', sort_order: 7 },
  { name: 'Enfants', icon: 'Baby', color: '#ffb4a2', sort_order: 8 },
  { name: 'Loisirs', icon: 'GameController', color: '#457b9d', sort_order: 9 },
  { name: 'Vacances', icon: 'Airplane', color: '#1d3557', sort_order: 10 },
  { name: 'Cadeaux', icon: 'Gift', color: '#e9c46a', sort_order: 11 },
  { name: 'Abonnements', icon: 'DeviceMobile', color: '#264653', sort_order: 12 },
  { name: 'Épargne', icon: 'PiggyBank', color: '#2a9d8f', sort_order: 13 },
  { name: 'Divers', icon: 'DotsThree', color: '#8d99ae', sort_order: 14 },
  { name: 'Autre', icon: 'Tag', color: '#adb5bd', sort_order: 15 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createDefaultCategories(supabase: any, coupleId: string) {
  const { error } = await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map(c => ({ ...c, couple_id: coupleId }))
  )
  return error
}
