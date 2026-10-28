import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { useRadioGroup } from './useRadioGroup'

const COLORS = ['red', 'green', 'blue'] as const
type Color = (typeof COLORS)[number]

function ColorPicker({ initial = 'red', disabledValues }: { initial?: Color; disabledValues?: Color[] }) {
  const [value, setValue] = useState<Color>(initial)
  const { groupProps, getItemProps } = useRadioGroup({ value, onChange: setValue, values: COLORS, disabledValues })
  return (
    <div {...groupProps} aria-label="Color">
      {COLORS.map((color) => (
        <button key={color} type="button" {...getItemProps(color)} onClick={() => setValue(color)}>
          {color}
        </button>
      ))}
    </div>
  )
}

describe('useRadioGroup', () => {
  it('puts only the checked option in the tab sequence', () => {
    render(<ColorPicker initial="green" />)
    expect(screen.getByRole('radio', { name: 'red' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('radio', { name: 'green' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'blue' })).toHaveAttribute('tabindex', '-1')
  })

  it('reflects the selected option in aria-checked', () => {
    render(<ColorPicker initial="blue" />)
    expect(screen.getByRole('radio', { name: 'red' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: 'blue' })).toHaveAttribute('aria-checked', 'true')
  })

  it('moves focus and selection to the next option on ArrowRight, wrapping at the end', async () => {
    const user = userEvent.setup()
    render(<ColorPicker initial="blue" />)
    screen.getByRole('radio', { name: 'blue' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'red' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'red' })).toHaveAttribute('aria-checked', 'true')
  })

  it('moves focus and selection to the previous option on ArrowLeft, wrapping at the start', async () => {
    const user = userEvent.setup()
    render(<ColorPicker initial="red" />)
    screen.getByRole('radio', { name: 'red' }).focus()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'blue' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'blue' })).toHaveAttribute('aria-checked', 'true')
  })

  it('jumps to the first and last options on Home and End', async () => {
    const user = userEvent.setup()
    render(<ColorPicker initial="green" />)
    screen.getByRole('radio', { name: 'green' }).focus()

    await user.keyboard('{End}')
    expect(screen.getByRole('radio', { name: 'blue' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'blue' })).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{Home}')
    expect(screen.getByRole('radio', { name: 'red' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'red' })).toHaveAttribute('aria-checked', 'true')
  })

  it('skips disabled options when navigating with arrow keys', async () => {
    const user = userEvent.setup()
    render(<ColorPicker initial="red" disabledValues={['green']} />)
    screen.getByRole('radio', { name: 'red' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'blue' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'green' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'green' })).toHaveAttribute('tabindex', '-1')
  })

  it('still supports direct pointer selection', async () => {
    const user = userEvent.setup()
    render(<ColorPicker initial="red" />)

    await user.click(screen.getByRole('radio', { name: 'blue' }))
    expect(screen.getByRole('radio', { name: 'blue' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'red' })).toHaveAttribute('aria-checked', 'false')
  })
})
