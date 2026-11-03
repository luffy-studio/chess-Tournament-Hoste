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
    ? 'bg-[#241E19] text-[#FAF8F5] border-[#241E19] font-semibold shadow-sm'
    : 'bg-[#FAF8F5] text-[#786F66] border-[#CEBEA8] hover:border-[#B18A52] hover:text-[#241E19]'

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
