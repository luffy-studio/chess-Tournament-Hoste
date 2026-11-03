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
      'bg-[#241E19] hover:bg-[#3A342E] text-[#FAF8F5] border border-[#241E19] shadow-sm',
    secondary:
      'bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#241E19] border border-[#CEBEA8] hover:border-[#B18A52] shadow-sm',
    gold:
      'bg-[#B18A52] hover:bg-[#8C6B3E] text-[#FAF8F5] border border-[#B18A52] shadow-sm',
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
