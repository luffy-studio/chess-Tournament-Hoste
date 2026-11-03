import React from 'react'

export interface RoyalChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  className?: string
  children: React.ReactNode
}

export const RoyalChip: React.FC<RoyalChipProps> = ({
  active = false,
  className = '',
  children,
  ...props
}) => {
  const activeStyles = active
    ? 'bg-[#B18A52] text-[#24211E] border-[#B18A52] font-semibold shadow-sm'
    : 'bg-[#302A25] text-[#B9AEA0] border-[#514538] hover:border-[#B18A52]/60 hover:text-[#F3EDE3]'

  return (
    <button
      type="button"
      className={`font-sans text-xs px-3.5 py-1.5 rounded-full border transition-all duration-150 active:scale-[0.98] ${activeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export const GrandmasterChip = RoyalChip
