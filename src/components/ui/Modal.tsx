import type { ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

export function Modal({ open, title, description, children, footer, onClose }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur sm:items-center">
      <div className="w-full max-w-xl rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{title}</div>
            {description && (
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-600 transition hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
          >
            Cerrar
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-black/10 px-5 py-4 dark:border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

