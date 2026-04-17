import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <div className="w-full">
      <input
        ref={ref}
        {...props}
        className={cn(
          'h-10 w-full rounded-md border bg-white px-3 text-sm outline-none transition focus:ring-2',
          'border-black/10 text-zinc-900 placeholder:text-zinc-400 focus:ring-blue-500/30',
          'dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500',
          error && 'border-red-500/60 focus:ring-red-500/30',
          className,
        )}
      />
      {error && <div className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</div>}
    </div>
  )
})
