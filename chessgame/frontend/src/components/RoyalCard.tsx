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
    ? 'bg-[#FFFFFF] hover:bg-[#FAF6F2] border border-[#DED1BD] hover:border-[#B08401] rounded-[14px] p-5 sm:p-6 transition-all duration-150 shadow-[0_1px_3px_rgba(104,59,43,0.05),0_4px_12px_rgba(104,59,43,0.03)] hover:shadow-[0_4px_16px_rgba(104,59,43,0.08)]'
    : 'bg-[#FFFFFF] border border-[#DED1BD] rounded-[14px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(104,59,43,0.05),0_4px_12px_rgba(104,59,43,0.03)]'

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

export const GrandmasterCard = RoyalCard
