import React from 'react'

export interface RoyalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  className?: string
}

export const RoyalInput: React.FC<RoyalInputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs uppercase tracking-wider font-cinzel text-[#B9AEA0] font-semibold">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-[#302A25] border ${
          error ? 'border-[#9E3B3B]' : 'border-[#514538] focus:border-[#B18A52] focus:ring-1 focus:ring-[#B18A52]'
        } rounded-[10px] px-3.5 py-2.5 text-[#F3EDE3] placeholder-[#B9AEA0]/50 text-sm transition font-sans focus:outline-none ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-[#9E3B3B] mt-1 font-sans">{error}</p>
      )}
    </div>
  )
}

export const GrandmasterInput = RoyalInput
