import React from 'react'

export interface RoyalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  className?: string
  children: React.ReactNode
}

export const RoyalCard: React.FC<RoyalCardProps> = ({
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = interactive
    ? 'bg-[#2E2925] hover:bg-[#38312B] border border-[#514538] hover:border-[#B18A52]/60 rounded-[14px] p-5 sm:p-6 transition-all duration-150 shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)]'
    : 'bg-[#2E2925] border border-[#514538] rounded-[14px] p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.25)]'

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

export const GrandmasterCard = RoyalCard
