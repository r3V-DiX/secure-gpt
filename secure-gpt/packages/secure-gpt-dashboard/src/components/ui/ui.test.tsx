import React, { createRef, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { Button } from './button/button'
import { Input, Select } from './input/input'
import { FormField } from './input/form-field'
import { Checkbox, Switch } from './input/selection'
import { RadioGroup } from './input/radio-group'
import { Modal, ModalHeader } from './modal/modal'
import { ConfirmModal } from './modal/ConfirmModal'
import { EmptyState } from './empty-state/EmptyState'
import { Tooltip } from './tooltip/tooltip'

beforeEach(() => {
  // jsdom has no layout; give visible controls geometry for the modal focus trap.
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([new DOMRect(0, 0, 100, 32)] as unknown as DOMRectList)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  document.body.style.overflow = ''
})

describe('shared controls', () => {
  it('keeps the button label and forwarded ref while preventing duplicate loading actions', async () => {
    const onClick = vi.fn()
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref} loading onClick={onClick}>Save changes</Button>)
    const button = screen.getByRole('button', { name: 'Save changes' })
    expect(ref.current).toBe(button)
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('exposes mixed checkbox selection and clears it on a checked rerender', () => {
    const { rerender } = render(<Checkbox aria-label="Select page" indeterminate checked={false} onChange={() => {}} />)
    expect(screen.getByRole('checkbox')).toBePartiallyChecked()
    rerender(<Checkbox aria-label="Select page" checked onChange={() => {}} />)
    expect(screen.getByRole('checkbox')).not.toBePartiallyChecked()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('toggles a switch with Space and respects disabled state', async () => {
    function Example({ disabled = false }: { disabled?: boolean }) {
      const [checked, setChecked] = useState(false)
      return <Switch aria-label="Enable protection" checked={checked} onCheckedChange={setChecked} disabled={disabled} />
    }
    const user = userEvent.setup()
    const { rerender } = render(<Example />)
    await user.tab()
    await user.keyboard(' ')
    expect(screen.getByRole('switch')).toBeChecked()
    rerender(<Example disabled />)
    await user.keyboard(' ')
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('changes radio selection with arrow keys and skips disabled groups', async () => {
    function Example({ disabled = false }: { disabled?: boolean }) {
      const [value, setValue] = useState('member')
      return <RadioGroup label="Member role" value={value} onValueChange={setValue} disabled={disabled}
        options={[{ value: 'member', label: 'Member' }, { value: 'admin', label: 'Admin' }]} />
    }
    const user = userEvent.setup()
    const { rerender } = render(<Example />)
    await user.tab()
    expect(screen.getByRole('radio', { name: 'Member' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Admin' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Member' })).not.toBeChecked()
    rerender(<Example disabled />)
    await user.click(screen.getByRole('radio', { name: 'Member' }))
    expect(screen.getByRole('radio', { name: 'Admin' })).toBeChecked()
  })

  it('associates labels, descriptions and errors with form controls', () => {
    render(<>
      <FormField label="Email" description="Use your work address">
        <Input error="Email is required" />
      </FormField>
      <FormField label="Role"><Select error="Choose a role"><option value="">Choose</option></Select></FormField>
    </>)
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription('Use your work address Email is required')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveAccessibleDescription('Choose a role')
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders an element passed as the empty-state icon', () => {
    render(<EmptyState title="No results" icon={<svg role="img" aria-label="Search results" />} />)
    expect(screen.getByRole('img', { name: 'Search results' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No results' })).toBeInTheDocument()
  })
})

describe('modal behavior', () => {
  it('names the dialog, traps focus in both directions and restores the opener', async () => {
    function Example() {
      const [open, setOpen] = useState(false)
      return <>
        <Button onClick={() => setOpen(true)}>Open editor</Button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <ModalHeader><h2>Edit organization</h2><p>Change organization details</p></ModalHeader>
          <Input aria-label="Name" />
          <Button onClick={() => setOpen(false)}>Done</Button>
        </Modal>
      </>
    }
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Open editor' }))
    expect(screen.getByRole('dialog', { name: 'Edit organization' })).toHaveAccessibleDescription('Change organization details')
    expect(screen.getByRole('textbox')).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('textbox')).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open editor' })).toHaveFocus()
  })

  it('keeps a pending confirmation open on Escape, backdrop and cancel attempts', async () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    const { rerender } = render(<ConfirmModal title="Delete organization?" loading onCancel={onCancel} onConfirm={onConfirm} />)
    const user = userEvent.setup()
    await user.keyboard('{Escape}')
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
    rerender(<ConfirmModal title="Delete organization?" onCancel={onCancel} onConfirm={onConfirm} />)
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('uses the warning design token for warning confirmations', () => {
    render(<ConfirmModal variant="warning" title="Continue?" onCancel={() => {}} onConfirm={() => {}} />)
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveClass('bg-[var(--warning)]')
  })

  it('closes only the top dialog and holds scroll lock until the last dialog closes', async () => {
    function Example() {
      const [outer, setOuter] = useState(true)
      const [inner, setInner] = useState(false)
      return <>
        <Modal open={outer} onClose={() => setOuter(false)} aria-label="Outer">
          <Button onClick={() => setInner(true)}>Open confirmation</Button>
        </Modal>
        <Modal open={inner} onClose={() => setInner(false)} aria-label="Inner"><Button>Inner action</Button></Modal>
      </>
    }
    document.body.style.overflow = 'scroll'
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Open confirmation' }))
    expect(document.body.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Inner' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
    expect(screen.getByRole('button', { name: 'Open confirmation' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('scroll')
  })
})

describe('tooltip', () => {
  it('describes the focused trigger and dismisses with Escape', async () => {
    const user = userEvent.setup()
    render(<Tooltip content="Copy organization ID"><Button>Copy</Button></Tooltip>)
    await user.tab()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy organization ID')
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveAccessibleDescription('Copy organization ID')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    await user.hover(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await user.unhover(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
