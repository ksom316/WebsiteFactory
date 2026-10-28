import { Monitor, Smartphone } from 'lucide-react'
import { useRadioGroup } from '../../hooks/useRadioGroup'

export type Viewport = 'desktop' | 'mobile'

interface Props {
  viewport: Viewport
  onChange: (viewport: Viewport) => void
}

const VIEWPORTS: Viewport[] = ['desktop', 'mobile']

/** Shared desktop/mobile preview-width toggle — used by the template showcase and the
 * project editor's live preview so there is exactly one implementation of this control. */
export function ViewportToggle({ viewport, onChange }: Props) {
  const { groupProps, getItemProps } = useRadioGroup({ value: viewport, onChange, values: VIEWPORTS })

  return (
    <div {...groupProps} aria-label="Preview width" className="flex gap-1.5">
      <button
        type="button"
        {...getItemProps('desktop')}
        aria-label="Desktop width"
        title="Desktop width"
        onClick={() => onChange('desktop')}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
          viewport === 'desktop' ? 'border-accent text-accent-strong' : 'border-border text-text-muted'
        }`}
      >
        <Monitor className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button
        type="button"
        {...getItemProps('mobile')}
        aria-label="Mobile width"
        title="Mobile width"
        onClick={() => onChange('mobile')}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
          viewport === 'mobile' ? 'border-accent text-accent-strong' : 'border-border text-text-muted'
        }`}
      >
        <Smartphone className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  )
}
