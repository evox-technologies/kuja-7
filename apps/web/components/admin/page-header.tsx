export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** The standard white card the whole portal is built from. */
export function Panel({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-gray-800">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

/** Page shell: max width, padding and its own scroll. */
export function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </div>
  )
}
