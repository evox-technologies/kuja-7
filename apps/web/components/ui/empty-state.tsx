import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('text-center py-16 text-gray-400', className)}>
      <Icon className="w-10 h-10 mx-auto mb-3 text-gray-200" />
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && <p className="text-xs mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
