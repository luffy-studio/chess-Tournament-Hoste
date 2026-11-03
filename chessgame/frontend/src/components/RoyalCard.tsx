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
    ? 'bg-[#FAF8F5] hover:bg-[#F6F2EC] border border-[#E2D9CB] hover:border-[#B18A52]/50 rounded-[14px] p-5 sm:p-6 transition-all duration-150 shadow-[0_1px_3px_rgba(36,30,25,0.04),0_4px_12px_rgba(36,30,25,0.02)] hover:shadow-[0_4px_16px_rgba(36,30,25,0.06)]'
    : 'bg-[#FAF8F5] border border-[#E2D9CB] rounded-[14px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(36,30,25,0.04),0_4px_12px_rgba(36,30,25,0.02)]'

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

export const GrandmasterCard = RoyalCard
