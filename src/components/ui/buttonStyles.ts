export type ButtonVariant = 'primary' | 'secondary'

export const buttonBaseClass =
  'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-strong',
  secondary: 'border border-border-strong bg-surface text-text hover:border-text-faint',
}
