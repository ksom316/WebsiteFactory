import type { ButtonHTMLAttributes } from 'react'
import { buttonBaseClass, buttonVariantClass, type ButtonVariant } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return <button className={`${buttonBaseClass} ${buttonVariantClass[variant]} ${className}`} {...props} />
}
