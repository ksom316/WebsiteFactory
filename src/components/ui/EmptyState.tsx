import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
      <Icon className="h-9 w-9 text-text-faint" strokeWidth={1.5} aria-hidden="true" />
      <div className="max-w-sm space-y-1.5">
        <h2 className="text-[15px] font-semibold text-text">{title}</h2>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      {action}
    </div>
  )
}
