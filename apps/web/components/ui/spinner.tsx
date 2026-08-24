import { cn } from '@/lib/utils'

/**
 * The spinner that was copy-pasted into ten screens. Same markup, one home.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin',
        className
      )}
    />
  )
}

/** Centred spinner for a panel that owns its own height. */
export function LoadingPanel({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-20', className)}>
      <Spinner />
    </div>
  )
}
