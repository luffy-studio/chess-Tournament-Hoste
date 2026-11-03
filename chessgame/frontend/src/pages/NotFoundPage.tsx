import React from 'react'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalButton } from '../components/RoyalButton'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#24211E] text-[#F3EDE3] font-sans flex flex-col selection:bg-[#B18A52]/30 selection:text-[#F3EDE3]">
      <RoyalHeader />

      <main className="flex-1 flex items-center justify-center relative z-10 px-4 py-20">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-[#514538] bg-[#2E2925] p-3 shadow-sm mx-auto">
            <img
              src="/grandmaster-emblem.png"
              alt="Grandmaster Suite Emblem"
              className="w-14 h-14 object-contain"
            />
          </div>

          <div className="space-y-2">
            <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B18A52] font-semibold">
              Locus Inexistens · 404
            </p>
            <h1 className="font-serif italic font-normal text-4xl sm:text-5xl text-[#F3EDE3] leading-[1.05] tracking-tight">
              Off the <span className="text-[#B18A52]">Board</span>
            </h1>
          </div>

          <p className="text-[#B9AEA0] text-sm sm:text-base leading-relaxed max-w-md mx-auto font-sans">
            The square, fixture, or championship record you are seeking does not exist or has been retired from the official archives.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4">
            <RoyalButton to="/" variant="primary">
              Return to Pavilion
            </RoyalButton>
            <RoyalButton to="/arena" variant="secondary">
              Enter Live Arena
            </RoyalButton>
          </div>
        </div>
      </main>

      <RoyalFooter />
    </div>
  )
}
