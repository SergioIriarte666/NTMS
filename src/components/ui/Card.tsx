import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  children: ReactNode
}

export function Card({ className, children }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950',
        className,
      )}
    >
      {children}
    </div>
  )
}

