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
      'bg-[#B08401] hover:bg-[#997200] text-[#FAF6F2] font-semibold border border-[#B08401] shadow-sm',
    secondary:
      'bg-[#DED1BD] hover:bg-[#D4C5AE] text-[#683B2B] border border-[#C9BAA3] hover:border-[#683B2B] shadow-sm font-semibold',
    gold:
      'bg-[#B08401] hover:bg-[#997200] text-[#FAF6F2] font-semibold border border-[#B08401] shadow-sm',
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
