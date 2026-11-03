import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalCard } from '../components/RoyalCard'
import { RoyalButton } from '../components/RoyalButton'

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login')

  // Login state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Password reset state
  const [resetUsername, setResetUsername] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { username, password })
      const token = res.data?.token ?? res.data?.access_token
      if (token) {
        localStorage.setItem('chess_admin_token', token)
        toast.success('Authenticated to Arbiter Chamber')
        navigate('/admin/dashboard')
      } else {
        setError('Invalid response from server. No token received.')
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { username: resetUsername })
      if (res.data?.resetToken) {
        setGeneratedToken(res.data.resetToken)
        setResetToken(res.data.resetToken)
        toast.success('Reset token generated (valid for 10 minutes)')
        setMode('reset')
      } else {
        toast.success(res.data?.message || 'If an account exists, a reset token has been issued.')
        setMode('reset')
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to request reset token.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/reset-password', {
        token: resetToken.trim(),
        newPassword,
      })
      toast.success(res.data?.message || 'Password reset successfully!')
      setMode('login')
      setUsername(resetUsername || username)
      setPassword('')
      setGeneratedToken(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to reset password. Token may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#241E19] font-sans flex flex-col selection:bg-[#B18A52]/20 selection:text-[#241E19]">
      <RoyalHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <RoyalCard className="w-full max-w-md p-8 sm:p-10 shadow-sm border border-[#E2D9CB]">
          {mode === 'login' ? (
            <>
              <div className="text-center mb-8 space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#CEBEA8] bg-[#F4F0E8] p-2 mx-auto mb-2 shadow-sm">
                  <img
                    src="/grandmaster-emblem.png"
                    alt="Grandmaster Suite Emblem"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B18A52] font-semibold">
                  Chamber of Arbitration
                </p>
                <h1 className="font-serif italic font-normal text-3xl sm:text-4xl text-[#241E19]">
                  Arbiter <span className="text-[#B18A52]">Sign In</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#786F66]">
                  Authenticate to govern sanctioned tournaments and pairings.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                    Arbiter Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-4 py-2.5 text-sm text-[#241E19] placeholder-[#786F66] focus:outline-none focus:border-[#B18A52] focus:ring-1 focus:ring-[#B18A52] transition font-sans shadow-inner"
                    placeholder="admin"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                      Secret Key / Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot')
                        setError('')
                      }}
                      className="font-cinzel text-[11px] text-[#B18A52] hover:underline font-semibold"
                    >
                      Recover Access
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-4 py-2.5 text-sm text-[#241E19] placeholder-[#786F66] focus:outline-none focus:border-[#B18A52] focus:ring-1 focus:ring-[#B18A52] transition font-sans shadow-inner"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="border border-[#9E3B3B]/30 bg-[#9E3B3B]/10 text-[#9E3B3B] rounded-[12px] p-3 text-xs font-sans font-medium">
                    {error}
                  </div>
                )}

                <RoyalButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full justify-center"
                >
                  {loading ? 'Authenticating…' : 'Enter Arbiter Portal'}
                </RoyalButton>
              </form>
            </>
          ) : mode === 'forgot' ? (
            <>
              <div className="text-center mb-6 space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#CEBEA8] bg-[#F4F0E8] text-2xl text-[#B18A52] mb-2 mx-auto shadow-sm">
                  <KeyRound size={26} />
                </div>
                <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B18A52] font-semibold">
                  Cryptographic Recovery
                </p>
                <h1 className="font-serif italic font-normal text-3xl text-[#241E19]">
                  Reset <span className="text-[#B18A52]">Credentials</span>
                </h1>
                <p className="text-xs text-[#786F66]">
                  Enter your arbiter username to generate a 10-minute secure single-use token.
                </p>
              </div>

              <form onSubmit={handleRequestResetToken} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                    Arbiter Username
                  </label>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-4 py-2.5 text-sm text-[#241E19] placeholder-[#786F66] focus:outline-none focus:border-[#B18A52] transition font-sans shadow-inner"
                    placeholder="admin"
                  />
                </div>

                {error && (
                  <div className="border border-[#9E3B3B]/30 bg-[#9E3B3B]/10 text-[#9E3B3B] rounded-[12px] p-3 text-xs font-sans font-medium">
                    {error}
                  </div>
                )}

                <RoyalButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full justify-center"
                >
                  {loading ? 'Generating…' : 'Generate Recovery Token'}
                </RoyalButton>

                <div className="flex items-center justify-between pt-3 border-t border-[#E2D9CB]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setError('')
                    }}
                    className="font-cinzel text-xs text-[#786F66] hover:text-[#241E19] flex items-center gap-1 transition font-semibold"
                  >
                    <ArrowLeft size={12} /> Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset')
                      setError('')
                    }}
                    className="font-cinzel text-xs text-[#B18A52] hover:underline font-semibold"
                  >
                    Enter Token Directly
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6 space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#5B6E57]/30 bg-[#5B6E57]/10 text-2xl text-[#5B6E57] mb-2 mx-auto shadow-sm">
                  <ShieldCheck size={26} />
                </div>
                <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#5B6E57] font-semibold">
                  Token Verification
                </p>
                <h1 className="font-serif italic font-normal text-3xl text-[#241E19]">
                  Establish <span className="text-[#B18A52]">New Password</span>
                </h1>
                <p className="text-xs text-[#786F66]">
                  Provide your 64-character token and set a new master password.
                </p>
              </div>

              {generatedToken && (
                <div className="border border-[#B18A52]/40 bg-[#F4F0E8] rounded-[12px] p-3 text-xs mb-4 space-y-1">
                  <span className="font-cinzel text-[11px] uppercase text-[#B18A52] block font-bold">
                    Recovery Token (Valid for 10m):
                  </span>
                  <code className="text-[#241E19] font-mono break-all text-[11px] select-all bg-[#FAF8F5] border border-[#CEBEA8] p-2 rounded block">
                    {generatedToken}
                  </code>
                </div>
              )}

              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    placeholder="Paste 64-character token"
                    className="w-full bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-3.5 py-2 text-[#241E19] placeholder-[#786F66] focus:outline-none focus:border-[#B18A52] text-xs font-mono shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                    New Master Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-4 py-2.5 text-[#241E19] placeholder-[#786F66] focus:outline-none focus:border-[#B18A52] text-sm shadow-inner"
                  />
                </div>

                {error && (
                  <div className="border border-[#9E3B3B]/30 bg-[#9E3B3B]/10 text-[#9E3B3B] rounded-[12px] p-3 text-xs font-sans font-medium">
                    {error}
                  </div>
                )}

                <RoyalButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full justify-center"
                >
                  {loading ? 'Committing…' : 'Update Arbiter Password'}
                </RoyalButton>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError('')
                  }}
                  className="w-full text-center font-cinzel text-xs text-[#786F66] hover:text-[#241E19] pt-2 transition font-semibold"
                >
                  Back to Sign In
                </button>
              </form>
            </>
          )}
        </RoyalCard>
      </main>

      <RoyalFooter />
    </div>
  )
}
