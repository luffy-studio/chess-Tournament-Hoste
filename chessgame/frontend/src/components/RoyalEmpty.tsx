import React from 'react'
import { RoyalButton } from './RoyalButton'

export interface RoyalEmptyProps {
  title?: string
  message?: string
  description?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}

export const RoyalEmpty: React.FC<RoyalEmptyProps> = ({
  title = 'No Tournaments Recorded',
  message,
  description,
  actionLabel,
  actionTo,
  onAction,
}) => {
  const displayMessage =
    description ||
    message ||
    'No active fixtures found in the circuit ledger. Arbiters may inaugurate a new championship.'

  return (
    <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 px-4">
      <div className="w-14 h-14 rounded-full border border-[#B18A52]/30 p-1.5 flex items-center justify-center bg-[#FAF8F5] shadow-sm">
        <img
          src="/grandmaster-emblem.png"
          alt="Emblem"
          className="h-full w-full object-contain filter drop-shadow-sm opacity-85"
        />
      </div>

      <h3 className="font-serif text-2xl sm:text-3xl text-[#241E19] tracking-tight">
        {title}
      </h3>

      <p className="text-sm text-[#786F66] leading-relaxed font-sans">
        {displayMessage}
      </p>

      {actionLabel && (actionTo || onAction) && (
        <div className="pt-2">
          {actionTo ? (
            <RoyalButton to={actionTo} variant="primary">
              {actionLabel}
            </RoyalButton>
          ) : (
            <RoyalButton onClick={onAction} variant="primary">
              {actionLabel}
            </RoyalButton>
          )}
        </div>
      )}
    </div>
  )
}

export const GrandmasterEmpty = RoyalEmpty
