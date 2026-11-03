import React from 'react'
import { Link } from 'react-router-dom'

export interface RoyalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold'
  to?: string
  className?: string
  children: React.ReactNode
}

export const RoyalButton: React.FC<RoyalButtonProps> = ({
  variant = 'primary',
  to,
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-[#B18A52] hover:bg-[#C49D63] text-[#24211E] font-semibold border border-[#B18A52] shadow-sm',
    secondary:
      'bg-[#302A25] hover:bg-[#38312B] text-[#F3EDE3] border border-[#514538] hover:border-[#B18A52]/60 shadow-sm',
    gold:
      'bg-[#B18A52] hover:bg-[#C49D63] text-[#24211E] font-semibold border border-[#B18A52] shadow-sm',
  }

  const baseStyle =
    'inline-flex items-center justify-center font-sans font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none'

  const combinedClasses = `${baseStyle} ${variantStyles[variant] || variantStyles.primary} ${className}`

  if (to) {
    return (
      <Link to={to} className={combinedClasses}>
        {children}
      </Link>
    )
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  )
}

export const GrandmasterButton = RoyalButton
