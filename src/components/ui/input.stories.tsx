import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Input } from './input'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    placeholder: 'Email address',
    type: 'email',
    className: 'w-72',
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'disabled@example.com',
  },
}

export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    defaultValue: 'not-an-email',
  },
}

export const File: Story = {
  args: {
    type: 'file',
    placeholder: undefined,
  },
}
