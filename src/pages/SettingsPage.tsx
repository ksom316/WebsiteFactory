import { Laptop, Moon, Sun } from 'lucide-react'
import { useRadioGroup } from '../hooks/useRadioGroup'
import { pageTitleClass } from '../styles/typography'
import type { ThemePreference } from '../theme/theme-context'
import { useTheme } from '../theme/useTheme'

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
]

export function SettingsPage() {
  const { preference, setPreference } = useTheme()
  const themeGroup = useRadioGroup({ value: preference, onChange: setPreference, values: options.map((o) => o.value) })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className={pageTitleClass}>Settings</h2>
        <p className="text-sm text-text-muted">Preferences for how Website Factory looks on this device.</p>
      </div>

      <fieldset className="border-t border-border pt-6">
        <legend className="text-sm font-semibold text-text">Appearance</legend>
        <p className="mt-1 text-sm text-text-muted">
          Choose a theme, or follow your system setting.
        </p>

        <div {...themeGroup.groupProps} aria-label="Theme" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {options.map(({ value, label, icon: Icon }) => {
            const selected = preference === value
            return (
              <button
                key={value}
                type="button"
                {...themeGroup.getItemProps(value)}
                onClick={() => setPreference(value)}
                className={`flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-accent bg-accent/10 text-accent-strong'
                    : 'border-border-strong text-text-muted hover:text-text'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {label}
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
