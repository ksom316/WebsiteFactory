interface Props {
  orderReference: string
  confirmationMessage: string
  demoNotice: string
  onReturn: () => void
}

export function ConfirmationStep({ orderReference, confirmationMessage, demoNotice, onReturn }: Props) {
  return (
    <div className="space-y-5 text-center">
      <h3 className="font-[family-name:var(--site-font-display)] text-xl font-semibold">Demo checkout complete</h3>
      <p className="text-sm text-[var(--site-text-muted)]">{confirmationMessage}</p>
      <p className="text-sm">
        Simulated order reference: <span className="font-medium">{orderReference}</span>
      </p>
      <p role="alert" className="rounded-md bg-[var(--site-surface-raised)] p-3 text-xs text-[var(--site-text-muted)]">
        {demoNotice}
      </p>
      <button
        type="button"
        onClick={onReturn}
        className="w-full rounded-full bg-[var(--site-accent)] px-5 py-3 text-sm font-medium text-[var(--site-accent-contrast)] hover:bg-[var(--site-accent-strong)]"
      >
        Return to store
      </button>
    </div>
  )
}
