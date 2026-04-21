import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  title: string
  titleClassName?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  closeLabel?: string
  closeIcon?: ReactNode
}

export function Modal({
  open,
  title,
  titleClassName,
  description,
  children,
  footer,
  onClose,
  closeLabel,
  closeIcon,
}: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur sm:items-center">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-950">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <div className={cn('truncate text-base font-semibold', titleClassName)}>{title}</div>
            {description && (
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel ?? 'Cerrar'}
            className={cn(
              closeIcon
                ? 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-zinc-100'
                : 'rounded-md px-2 py-1 text-sm text-zinc-600 transition hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100',
            )}
          >
            {closeIcon ?? 'Cerrar'}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-black/10 px-5 py-4 dark:border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
