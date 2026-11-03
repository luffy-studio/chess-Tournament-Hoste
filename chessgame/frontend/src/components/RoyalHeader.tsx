import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Shield } from 'lucide-react'

interface RoyalHeaderProps {
  currentRole?: string
  onLogout?: () => void
}

export const RoyalHeader: React.FC<RoyalHeaderProps> = ({ onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('chess_admin_token') : null

  const navLinks = [
    { label: 'Championships', path: '/' },
    { label: 'Online Arena', path: '/arena' },
    { label: 'Competitor Dossier', path: '/participant' },
    { label: 'Arbiter Chamber', path: token ? '/admin/dashboard' : '/admin' },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="border-b border-[#E2D9CB] bg-[#FAF8F5]/95 backdrop-blur-md sticky top-0 z-40 transition-colors shadow-[0_1px_4px_rgba(36,30,25,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO: Crowned Knight Emblem (Text-Free) + Institutional Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A52]"
          aria-label="Grandmaster Suite Home"
        >
          <div className="relative flex items-center justify-center h-11 w-11 shrink-0 rounded-full border border-[#B18A52]/30 bg-[#F4F0E8] shadow-sm overflow-hidden p-1 group-hover:border-[#B18A52] transition-colors">
            <img
              src="/grandmaster-emblem.png"
              alt="Grandmaster Suite Crowned Knight Emblem"
              className="h-full w-full object-contain filter drop-shadow-sm transform group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-cinzel tracking-[0.18em] text-lg sm:text-xl font-bold flex items-center leading-none">
              <span className="text-[#241E19]">GRANDMASTER</span>
              <span className="text-[#B18A52] ml-1.5 font-extrabold">SUITE</span>
            </div>
            <span className="font-serif italic text-[11px] text-[#786F66] mt-0.5 tracking-wide hidden sm:block">
              International Chess Institution
            </span>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[13px] font-sans transition-colors relative py-1.5 ${
                  active
                    ? 'text-[#241E19] font-semibold'
                    : 'text-[#786F66] hover:text-[#241E19] font-medium'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B18A52] rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* RIGHT ACTION BUTTONS */}
        <div className="hidden sm:flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/dashboard"
                className="bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#241E19] border border-[#CEBEA8] hover:border-[#B18A52] font-sans text-xs font-semibold px-4 py-2 rounded-full transition flex items-center gap-1.5"
              >
                <Shield size={13} className="text-[#B18A52]" />
                <span>Console</span>
              </Link>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-xs text-[#786F66] hover:text-[#9E3B3B] font-medium px-2 py-1 transition"
                >
                  Sign Out
                </button>
              )}
            </div>
          ) : (
            <Link
              to="/admin"
              className="bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#241E19] border border-[#CEBEA8] hover:border-[#B18A52] font-sans text-xs font-semibold px-4 py-2 rounded-full transition shadow-sm"
            >
              Arbiter Access
            </Link>
          )}

          <Link
            to="/admin/tournaments/new"
            className="bg-[#241E19] hover:bg-[#3A342E] text-[#FAF8F5] font-sans text-xs font-medium px-4 py-2 rounded-full transition-all shadow-sm active:scale-[0.98]"
          >
            Inaugurate Tournament
          </Link>
        </div>

        {/* MOBILE MENU TRIGGER */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            to="/admin/tournaments/new"
            className="bg-[#241E19] text-[#FAF8F5] font-sans text-[11px] font-medium px-3 py-1.5 rounded-full"
          >
            Host
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-[#E2D9CB] bg-[#FAF8F5] text-[#241E19] hover:bg-[#F4F0E8] transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[#E2D9CB] bg-[#FAF8F5] px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                  isActive(link.path)
                    ? 'bg-[#F4F0E8] text-[#241E19] font-bold border-l-2 border-[#B18A52]'
                    : 'text-[#786F66] hover:bg-[#F4F0E8] hover:text-[#241E19]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-[#E2D9CB] flex flex-col gap-2">
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center bg-[#FAF8F5] text-[#241E19] border border-[#CEBEA8] py-2 rounded-full text-xs font-semibold"
            >
              Arbiter Access
            </Link>
            <Link
              to="/admin/tournaments/new"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center bg-[#241E19] text-[#FAF8F5] py-2 rounded-full text-xs font-medium"
            >
              Inaugurate Tournament
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export const GrandmasterHeader = RoyalHeader
