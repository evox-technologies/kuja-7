'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Numbered pages. The member-facing browse screen appends with "Load More",
 * but staff need to jump around a list they are working through, and the admin
 * endpoints return { page, totalPages } for exactly this.
 */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
  className,
}: {
  page: number
  totalPages: number
  total?: number
  pageSize?: number
  onChange: (page: number) => void
  className?: string
}) {
  if (totalPages <= 1) {
    return total !== undefined ? (
      <p className={cn('text-xs text-gray-400', className)}>
        {total} {total === 1 ? 'result' : 'results'}
      </p>
    ) : null
  }

  const first = total !== undefined && pageSize ? (page - 1) * pageSize + 1 : null
  const last =
    total !== undefined && pageSize ? Math.min(page * pageSize, total) : null

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      {first !== null && last !== null && (
        <p className="text-xs text-gray-400">
          {first}–{last} of {total}
        </p>
      )}

      <div className="flex items-center gap-1">
        <PageButton
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </PageButton>

        {pageWindow(page, totalPages).map((entry, i) =>
          entry === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-gray-300">
              …
            </span>
          ) : (
            <PageButton
              key={entry}
              onClick={() => onChange(entry)}
              active={entry === page}
              aria-label={`Page ${entry}`}
              aria-current={entry === page ? 'page' : undefined}
            >
              {entry}
            </PageButton>
          )
        )}

        <PageButton
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </PageButton>
      </div>
    </div>
  )
}

function PageButton({
  active = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors',
        'disabled:opacity-40 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border',
        active
          ? 'bg-brand text-on-brand'
          : 'text-gray-600 hover:bg-gray-100',
        className
      )}
      {...props}
    />
  )
}

/**
 * First and last page always visible, a window around the current one, ellipses
 * for the rest — so 200 pages stay one row.
 */
function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages, page])
  if (page - 1 > 1) pages.add(page - 1)
  if (page + 1 < totalPages) pages.add(page + 1)

  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  sorted.forEach((value, i) => {
    if (i > 0 && value - (sorted[i - 1] as number) > 1) out.push('gap')
    out.push(value)
  })
  return out
}
