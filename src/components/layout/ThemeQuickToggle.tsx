import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../theme/useTheme'

export function ThemeQuickToggle() {
  const { resolvedTheme, setPreference } = useTheme()
  const next = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-border-strong hover:text-text"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  )
}
