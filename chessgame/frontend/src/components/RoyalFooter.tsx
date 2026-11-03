import React from 'react'
import { Link } from 'react-router-dom'

export const RoyalFooter: React.FC = () => {
  return (
    <footer className="border-t border-[#DED1BD] bg-[#F4EEE7] mt-24 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left: Brand Crest & Institutional Wordmark */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full border border-[#DED1BD] bg-[#FFFFFF] p-1 flex items-center justify-center shrink-0 shadow-sm">
            <img
              src="/grandmaster-emblem.png"
              alt="Grandmaster Suite Emblem"
              className="h-full w-full object-contain filter drop-shadow-sm"
            />
          </div>

          <div>
            <div className="font-cinzel tracking-[0.18em] text-base font-bold flex items-center leading-none">
              <span className="text-[#683B2B]">GRANDMASTER</span>
              <span className="text-[#B08401] ml-1.5 font-extrabold">SUITE</span>
            </div>
            <p className="font-serif italic text-xs text-[#7A6658] mt-1">
              Tournament Arbitration & Grand Prix Ledger Platform
            </p>
          </div>
        </div>

        {/* Center: Institutional Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-sans text-[#7A6658]">
          <Link to="/" className="hover:text-[#683B2B] transition font-medium">
            Championships
          </Link>
          <span className="text-[#DED1BD]">•</span>
          <Link to="/arena" className="hover:text-[#683B2B] transition font-medium">
            Live Arena
          </Link>
          <span className="text-[#DED1BD]">•</span>
          <Link to="/participant" className="hover:text-[#683B2B] transition font-medium">
            Competitor Registry
          </Link>
          <span className="text-[#DED1BD]">•</span>
          <Link to="/admin" className="hover:text-[#683B2B] transition font-medium">
            Arbiter Portal
          </Link>
        </div>

        {/* Right: Creator Attribution, Concept & License Credits */}
        <div className="text-center md:text-right space-y-1">
          <p className="font-cinzel text-xs text-[#B08401] uppercase tracking-wider font-bold">
            Conceived & Architected by Sarvagya Sharma
          </p>
          <p className="text-[11px] text-[#7A6658] font-sans">
            &copy; {new Date().getFullYear()} Sarvagya Sharma. All rights, concept & license reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export const GrandmasterFooter = RoyalFooter
