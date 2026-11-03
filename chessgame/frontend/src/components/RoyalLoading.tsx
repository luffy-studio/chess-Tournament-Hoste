import React from 'react'

export interface RoyalLoadingProps {
  message?: string
}

export const RoyalLoading: React.FC<RoyalLoadingProps> = ({
  message = 'Consulting tournament ledger…',
}) => {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-12 h-12 rounded-full border border-[#B18A52]/40 p-1 flex items-center justify-center bg-[#FAF8F5] shadow-sm">
        <img
          src="/grandmaster-emblem.png"
          alt="Loading Emblem"
          className="h-full w-full object-contain filter drop-shadow-sm animate-pulse"
        />
      </div>
      
      <p className="font-serif italic text-lg sm:text-xl text-[#241E19]">
        {message}
      </p>

      {/* Thin antique bronze progress indicator */}
      <div className="w-44 h-[2px] bg-[#E2D9CB] rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 bg-[#B18A52] w-1/3 rounded-full animate-pulse" />
      </div>
    </div>
  )
}

export const GrandmasterLoading = RoyalLoading
