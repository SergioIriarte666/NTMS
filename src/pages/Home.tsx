import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-400">Demo UI</div>
            <h1 className="text-2xl font-semibold tracking-tight">Administración de Grúas</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-8 rounded-xl border border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            Ya está activo el modo oscuro/claro con persistencia en `localStorage`.
          </div>
        </div>
      </div>
    </div>
  )
}
