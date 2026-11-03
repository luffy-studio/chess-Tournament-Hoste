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
    <header className="border-b border-[#DED1BD] bg-[#FAF6F2]/95 backdrop-blur-md sticky top-0 z-40 transition-colors shadow-[0_2px_10px_rgba(104,59,43,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO: Crowned Knight Emblem (Text-Free) + Institutional Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B08401]"
          aria-label="Grandmaster Suite Home"
        >
          <div className="relative flex items-center justify-center h-11 w-11 shrink-0 rounded-full border border-[#DED1BD] bg-[#FFFFFF] shadow-sm overflow-hidden p-1 group-hover:border-[#B08401] transition-colors">
            <img
              src="/grandmaster-emblem.png"
              alt="Grandmaster Suite Crowned Knight Emblem"
              className="h-full w-full object-contain filter drop-shadow-sm transform group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-cinzel tracking-[0.18em] text-lg sm:text-xl font-bold flex items-center leading-none">
              <span className="text-[#683B2B]">GRANDMASTER</span>
              <span className="text-[#B08401] ml-1.5 font-extrabold">SUITE</span>
            </div>
            <span className="font-serif italic text-[11px] text-[#7A6658] mt-0.5 tracking-wide hidden sm:block">
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
                    ? 'text-[#683B2B] font-semibold'
                    : 'text-[#7A6658] hover:text-[#683B2B] font-medium'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B08401] rounded-full" />
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
                className="bg-[#DED1BD]/60 hover:bg-[#DED1BD] text-[#683B2B] border border-[#C9BAA3] hover:border-[#683B2B] font-sans text-xs font-semibold px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 shadow-sm"
              >
                <Shield size={13} className="text-[#B08401]" />
                <span className="truncate max-w-[120px]">
                  {arbiterUser?.username ? `Arbiter: ${arbiterUser.username}` : 'Console'}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="text-xs text-[#7A6658] hover:text-[#9E3B3B] font-medium px-2 py-1 transition flex items-center gap-1"
              >
                <LogOut size={13} />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/admin"
              className="bg-[#B08401] hover:bg-[#997200] text-[#FAF6F2] font-sans text-xs font-semibold px-4 py-2 rounded-full transition shadow-sm"
            >
              Arbiter Portal
            </Link>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <div className="flex items-center sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#683B2B] hover:text-[#B08401] p-2 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DED1BD] bg-[#FAF6F2] px-4 pt-4 pb-6 space-y-3">
          {navLinks.map((link) => {
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm py-2 px-3 rounded-[10px] transition ${
                  active
                    ? 'bg-[#DED1BD] text-[#683B2B] font-semibold border border-[#C9BAA3]'
                    : 'text-[#7A6658] hover:bg-[#FFFFFF]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="pt-2 border-t border-[#DED1BD]">
            {token ? (
              <div className="flex items-center justify-between">
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-[#683B2B] flex items-center gap-1.5"
                >
                  <Shield size={13} className="text-[#B08401]" />
                  <span>{arbiterUser?.username ? `Arbiter: ${arbiterUser.username}` : 'Dashboard'}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-[#9E3B3B] font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center text-xs font-semibold text-[#FAF6F2] bg-[#B08401] py-2 rounded-full"
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

export const GrandmasterHeader = RoyalHeader
