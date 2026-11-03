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
        <label htmlFor={inputId} className="block text-xs uppercase tracking-wider font-cinzel text-[#683B2B] font-semibold">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-[#FFFFFF] border ${
          error ? 'border-[#9E3B3B]' : 'border-[#DED1BD] focus:border-[#B08401] focus:ring-1 focus:ring-[#B08401]'
        } rounded-[10px] px-3.5 py-2.5 text-[#683B2B] placeholder-[#9E8B7D] text-sm transition font-sans focus:outline-none shadow-sm ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-[#9E3B3B] mt-1 font-sans font-medium">{error}</p>
      )}
    </div>
  )
}

export const GrandmasterInput = RoyalInput
