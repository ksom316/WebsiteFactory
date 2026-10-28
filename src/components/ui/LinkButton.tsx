import { Link, type LinkProps } from 'react-router-dom'
import { buttonBaseClass, buttonVariantClass, type ButtonVariant } from './buttonStyles'

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant
}

/** A <Link> styled exactly like Button, for navigation actions that look like buttons. */
export function LinkButton({ variant = 'secondary', className = '', ...props }: LinkButtonProps) {
  return <Link className={`${buttonBaseClass} ${buttonVariantClass[variant]} ${className}`} {...props} />
}
