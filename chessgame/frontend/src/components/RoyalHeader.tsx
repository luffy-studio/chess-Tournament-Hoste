import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Shield, LogOut } from 'lucide-react'

interface RoyalHeaderProps {
  currentRole?: string
  onLogout?: () => void
}

export const RoyalHeader: React.FC<RoyalHeaderProps> = ({ onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [arbiterUser, setArbiterUser] = useState<any>(null)
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('chess_admin_token') : null

  useEffect(() => {
    try {
      const stored = localStorage.getItem('chess_admin_user')
      if (stored) {
        setArbiterUser(JSON.parse(stored))
      } else if (token) {
        setArbiterUser({ username: 'Arbiter' })
      } else {
        setArbiterUser(null)
      }
    } catch {
      setArbiterUser(null)
    }
  }, [token, location])

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

  const handleSignOut = () => {
    localStorage.removeItem('chess_admin_token')
    localStorage.removeItem('chess_admin_user')
    if (onLogout) {
      onLogout()
    } else {
      window.location.href = '/admin'
    }
  }

  return (
    <header className="border-b border-[#514538] bg-[#2E2925]/95 backdrop-blur-md sticky top-0 z-40 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO: Crowned Knight Emblem (Text-Free) + Institutional Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A52]"
          aria-label="Grandmaster Suite Home"
        >
          <div className="relative flex items-center justify-center h-11 w-11 shrink-0 rounded-full border border-[#B18A52]/40 bg-[#24211E] shadow-sm overflow-hidden p-1 group-hover:border-[#B18A52] transition-colors">
            <img
              src="/grandmaster-emblem.png"
              alt="Grandmaster Suite Crowned Knight Emblem"
              className="h-full w-full object-contain filter drop-shadow-sm transform group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-cinzel tracking-[0.18em] text-lg sm:text-xl font-bold flex items-center leading-none">
              <span className="text-[#F3EDE3]">GRANDMASTER</span>
              <span className="text-[#B18A52] ml-1.5 font-extrabold">SUITE</span>
            </div>
            <span className="font-serif italic text-[11px] text-[#B9AEA0] mt-0.5 tracking-wide hidden sm:block">
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
                    ? 'text-[#F3EDE3] font-semibold'
                    : 'text-[#B9AEA0] hover:text-[#F3EDE3] font-medium'
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
            <div className="flex items-center gap-2.5">
              <Link
                to="/admin/dashboard"
                className="bg-[#38312B] hover:bg-[#433A33] text-[#F3EDE3] border border-[#514538] hover:border-[#B18A52]/60 font-sans text-xs font-semibold px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5"
              >
                <Shield size={13} className="text-[#B18A52]" />
                <span className="truncate max-w-[120px]">
                  {arbiterUser?.username ? `Arbiter: ${arbiterUser.username}` : 'Console'}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="text-xs text-[#B9AEA0] hover:text-[#9E3B3B] font-medium px-2 py-1 transition flex items-center gap-1"
              >
                <LogOut size={13} />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/admin"
              className="bg-[#B18A52] hover:bg-[#C49D63] text-[#24211E] font-sans text-xs font-semibold px-4 py-2 rounded-full transition shadow-sm"
            >
              Arbiter Portal
            </Link>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <div className="flex items-center sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#F3EDE3] hover:text-[#B18A52] p-2 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#514538] bg-[#2E2925] px-4 pt-4 pb-6 space-y-3">
          {navLinks.map((link) => {
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm py-2 px-3 rounded-[10px] transition ${
                  active
                    ? 'bg-[#38312B] text-[#B18A52] font-semibold border border-[#514538]'
                    : 'text-[#B9AEA0] hover:text-[#F3EDE3]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="pt-3 border-t border-[#514538] flex flex-col gap-2">
            {token ? (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-[#38312B] text-[#F3EDE3] border border-[#514538] text-xs font-semibold px-4 py-2.5 rounded-full text-center flex items-center justify-center gap-1.5"
                >
                  <Shield size={14} className="text-[#B18A52]" />
                  <span>{arbiterUser?.username ? `Arbiter: ${arbiterUser.username}` : 'Arbiter Chamber'}</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="text-xs text-[#9E3B3B] hover:underline py-1 text-center font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#B18A52] text-[#24211E] text-xs font-semibold px-4 py-2.5 rounded-full text-center"
              >
                Arbiter Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
