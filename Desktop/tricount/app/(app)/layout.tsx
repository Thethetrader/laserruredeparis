import { BottomNav } from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
