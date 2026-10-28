interface BrandMarkProps {
  collapsed?: boolean
}

export function BrandMark({ collapsed = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-strong font-mono text-[13px] font-semibold tracking-tight text-accent"
        aria-hidden="true"
      >
        WF
      </span>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight text-text">Website Factory</span>
      )}
    </div>
  )
}
