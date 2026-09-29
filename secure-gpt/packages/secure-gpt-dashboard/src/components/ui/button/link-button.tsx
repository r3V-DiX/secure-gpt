import Link from 'next/link'
import type { ComponentProps } from 'react'
import { buttonStyles, type ButtonProps } from './button'

type LinkButtonProps = ComponentProps<typeof Link> & Pick<ButtonProps, 'variant' | 'size'>
export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />
}
