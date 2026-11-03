import React from 'react'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalButton } from '../components/RoyalButton'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF6F2] text-[#683B2B] font-sans flex flex-col selection:bg-[#B08401]/20 selection:text-[#683B2B]">
      <RoyalHeader />

      <main className="flex-1 flex items-center justify-center relative z-10 px-4 py-20">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-[#DED1BD] bg-[#FFFFFF] p-3 shadow-xs mx-auto">
            <img
              src="/grandmaster-emblem.png"
              alt="Grandmaster Suite Emblem"
              className="w-14 h-14 object-contain"
            />
          </div>

          <div className="space-y-2">
            <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B08401] font-semibold">
              Locus Inexistens · 404
            </p>
            <h1 className="font-serif italic font-normal text-4xl sm:text-5xl text-[#683B2B] leading-[1.05] tracking-tight">
              Off the <span className="text-[#B08401]">Board</span>
            </h1>
          </div>

          <p className="text-[#7A6658] text-sm sm:text-base leading-relaxed max-w-md mx-auto font-sans">
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
