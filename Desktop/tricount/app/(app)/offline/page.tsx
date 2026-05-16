export default function OfflinePage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">
        📵
      </div>
      <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Connexion requise</h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs">
        Connexion requise pour saisir une dépense. Reconnectez-vous à internet puis rechargez la page.
      </p>
    </div>
  )
}
