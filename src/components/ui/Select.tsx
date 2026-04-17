import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { className, error, children, ...props },
  ref,
) {
  return (
    <div className="w-full">
      <select
        ref={ref}
        {...props}
        className={cn(
          'h-10 w-full rounded-md border bg-white px-3 text-sm outline-none transition focus:ring-2',
          'border-black/10 text-zinc-900 focus:ring-blue-500/30',
          'dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100',
          error && 'border-red-500/60 focus:ring-red-500/30',
          className,
        )}
      >
        {children}
      </select>
      {error && <div className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</div>}
    </div>
  )
})
