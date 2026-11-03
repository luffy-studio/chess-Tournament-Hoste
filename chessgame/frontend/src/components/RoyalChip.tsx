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
    ? 'bg-[#B08401] text-[#FAF6F2] border-[#B08401] font-semibold shadow-sm'
    : 'bg-[#FFFFFF] text-[#7A6658] border-[#DED1BD] hover:border-[#B08401] hover:text-[#683B2B]'

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
