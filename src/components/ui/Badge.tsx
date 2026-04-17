import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'warning' | 'danger'

type Props = {
  className?: string
  variant?: Variant
  children: ReactNode
}

export function Badge({ className, variant = 'default', children }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variant === 'default' &&
          'bg-black/5 text-zinc-700 dark:bg-white/10 dark:text-zinc-200',
        variant === 'success' &&
          'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        variant === 'warning' &&
          'bg-amber-500/15 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        variant === 'danger' &&
          'bg-red-500/15 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        className,
      )}
    >
      {children}
    </span>
  )
}

