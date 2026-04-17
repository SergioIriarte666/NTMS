import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  leftIcon?: ReactNode
}

export function Button({
  className,
  variant = 'secondary',
  leftIcon,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' &&
          'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        variant === 'secondary' &&
          'border border-black/10 bg-black/5 text-zinc-900 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10',
        variant === 'ghost' &&
          'text-zinc-700 hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-zinc-100',
        className,
      )}
    >
      {leftIcon}
      {children}
    </button>
  )
}

