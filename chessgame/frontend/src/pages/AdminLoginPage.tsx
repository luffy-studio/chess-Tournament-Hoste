import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { KeyRound, ShieldCheck, ArrowLeft, Eye, EyeOff, UserPlus, LogIn, CheckCircle2 } from 'lucide-react'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalCard } from '../components/RoyalCard'
import { RoyalButton } from '../components/RoyalButton'

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login')

  // Login form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Registration form state
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)

  // Status & feedback
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Password reset state
  const [resetUsername, setResetUsername] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/login', {
        username: username.trim(),
        password,
      })

      const token = res.data?.token ?? res.data?.access_token
      if (token) {
        localStorage.setItem('chess_admin_token', token)
        if (res.data?.id && res.data?.username) {
          localStorage.setItem(
            'chess_admin_user',
            JSON.stringify({
              id: res.data.id,
              username: res.data.username,
              role: res.data.role || 'admin',
            })
          )
        }
        toast.success(`Welcome back, Arbiter ${res.data?.username || ''}!`)
        navigate('/admin/dashboard')
      } else {
        setError('Invalid response from server. No authentication token received.')
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Invalid username or credentials. Please verify your details.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Handle Admin Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanUsername = regUsername.trim()

    if (cleanUsername.length < 3) {
      setError('Arbiter username or email must be at least 3 characters long.')
      return
    }

    if (regPassword.length < 8) {
      setError('Secret password must be at least 8 characters long for institutional security.')
      return
    }

    if (regPassword !== regConfirmPassword) {
      setError('Password and Confirmation Password do not match. Please verify.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        username: cleanUsername,
        password: regPassword,
        role: 'admin',
      })

      const token = res.data?.token
      if (token) {
        localStorage.setItem('chess_admin_token', token)
        localStorage.setItem(
          'chess_admin_user',
          JSON.stringify({
            id: res.data.id,
            username: res.data.username,
            role: res.data.role || 'admin',
          })
        )
        toast.success(`Arbiter account registered! Welcome to Grandmaster Suite, ${res.data.username}.`)
        navigate('/admin/dashboard')
      } else {
        toast.success('Registration successful! Please sign in.')
        setMode('login')
        setUsername(cleanUsername)
        setPassword('')
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Registration failed. This username may already be in use.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Handle Requesting Password Reset Token
  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/forgot-password', {
        username: resetUsername.trim(),
      })

      if (res.data?.resetToken) {
        setGeneratedToken(res.data.resetToken)
        setResetToken(res.data.resetToken)
        toast.success('Cryptographic recovery token generated (valid for 10 minutes).')
        setMode('reset')
      } else {
        toast.success(res.data?.message || 'If an account exists, a recovery token was issued.')
        setMode('reset')
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to request recovery token.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Confirming Password Reset
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/reset-password', {
        token: resetToken.trim(),
        newPassword,
      })

      toast.success(res.data?.message || 'Password successfully reset!')
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
    <div className="min-h-screen bg-[#24211E] text-[#F3EDE3] font-sans flex flex-col selection:bg-[#B18A52]/30 selection:text-[#F3EDE3]">
      <RoyalHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
        <RoyalCard className="w-full max-w-md p-7 sm:p-9 shadow-2xl border border-[#514538] bg-[#2E2925] rounded-[16px]">
          
          {/* INSTITUTIONAL BRAND HEADER */}
          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#B18A52]/40 bg-[#24211E] p-2 mx-auto mb-1 shadow-inner">
              <img
                src="/grandmaster-emblem.png"
                alt="Grandmaster Suite Emblem"
                className="w-12 h-12 object-contain filter drop-shadow-md"
              />
            </div>
            <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B18A52] font-semibold">
              Chamber of Arbitration
            </p>
            <h1 className="font-serif italic font-normal text-3xl sm:text-4xl text-[#F3EDE3]">
              Grandmaster <span className="text-[#B18A52]">Portal</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#B9AEA0] max-w-xs mx-auto">
              Sanctioned arbiters governing tournament pairings and championship ledgers.
            </p>
          </div>

          {/* MODE SELECTOR TABS (LOGIN vs REGISTER) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="grid grid-cols-2 p-1 bg-[#24211E] border border-[#514538] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError('')
                }}
                className={`py-2 text-xs font-cinzel tracking-wider uppercase font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-[#38312B] text-[#F3EDE3] shadow-sm border border-[#514538]'
                    : 'text-[#B9AEA0] hover:text-[#F3EDE3]'
                }`}
              >
                <LogIn size={13} className={mode === 'login' ? 'text-[#B18A52]' : ''} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError('')
                }}
                className={`py-2 text-xs font-cinzel tracking-wider uppercase font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-[#38312B] text-[#F3EDE3] shadow-sm border border-[#514538]'
                    : 'text-[#B9AEA0] hover:text-[#F3EDE3]'
                }`}
              >
                <UserPlus size={13} className={mode === 'register' ? 'text-[#B18A52]' : ''} />
                <span>Register Arbiter</span>
              </button>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                  Arbiter Username or Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-[#302A25] border border-[#514538] rounded-[12px] px-4 py-2.5 text-sm text-[#F3EDE3] placeholder-[#B9AEA0]/50 focus:outline-none focus:border-[#B18A52] focus:ring-1 focus:ring-[#B18A52] transition font-sans"
                  placeholder="e.g. arbiter_fischer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                    Secret Key / Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot')
                      setError('')
                    }}
                    className="font-cinzel text-[11px] text-[#B18A52] hover:text-[#C49D63] hover:underline font-semibold"
                  >
                    Recover Access
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#302A25] border border-[#514538] rounded-[12px] pl-4 pr-11 py-2.5 text-sm text-[#F3EDE3] placeholder-[#B9AEA0]/50 focus:outline-none focus:border-[#B18A52] focus:ring-1 focus:ring-[#B18A52] transition font-sans"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B9AEA0] hover:text-[#B18A52] p-1 focus:outline-none transition-colors"
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="border border-[#9E3B3B]/40 bg-[#9E3B3B]/15 text-[#F3EDE3] rounded-[12px] p-3 text-xs font-sans font-medium">
                  {error}
                </div>
              )}

              <RoyalButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full justify-center mt-2"
              >
                {loading ? 'Authenticating…' : 'Enter Arbiter Portal'}
              </RoyalButton>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                  New Arbiter Username or Email
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-[#302A25] border border-[#514538] rounded-[12px] px-4 py-2.5 text-sm text-[#F3EDE3] placeholder-[#B9AEA0]/50 focus:outline-none focus:border-[#B18A52] focus:ring-1 focus:ring-[#B18A52] transition font-sans"
                  placeholder="e.g. grandmaster_tal"
                />
                <p className="text-[11px] text-[#B9AEA0]/70 font-sans">
                  Used to sanction tournaments and sign championship pairings.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                  Secret Key / Password
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-[#302A25] border border-[#514538] rounded-[12px] pl-4 pr-11 py-2.5 text-sm text-[#F3EDE3] placeholder-[#B9AEA0]/50 focus:outline-none focus:border-[#B18A52] focus:ring-1 focus:ring-[#B18A52] transition font-sans"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B9AEA0] hover:text-[#B18A52] p-1 focus:outline-none transition-colors"
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                  Confirm Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-[#302A25] border border-[#514538] rounded-[12px] pl-4 pr-11 py-2.5 text-sm text-[#F3EDE3] placeholder-[#B9AEA0]/50 focus:outline-none focus:border-[#B18A52] focus:ring-1 focus:ring-[#B18A52] transition font-sans"
                    placeholder="Repeat secret password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    aria-label={showRegConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B9AEA0] hover:text-[#B18A52] p-1 focus:outline-none transition-colors"
                  >
                    {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="border border-[#9E3B3B]/40 bg-[#9E3B3B]/15 text-[#F3EDE3] rounded-[12px] p-3 text-xs font-sans font-medium">
                  {error}
                </div>
              )}

              <RoyalButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full justify-center mt-2"
              >
                {loading ? 'Creating Arbiter Profile…' : 'Complete Arbiter Registration'}
              </RoyalButton>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#B18A52]/40 bg-[#24211E] text-xl text-[#B18A52] mx-auto shadow-inner">
                  <KeyRound size={22} />
                </div>
                <h2 className="font-serif italic text-2xl text-[#F3EDE3]">
                  Cryptographic <span className="text-[#B18A52]">Recovery</span>
                </h2>
                <p className="text-xs text-[#B9AEA0]">
                  Enter your arbiter username or email to generate a single-use 10-minute reset token.
                </p>
              </div>

              <form onSubmit={handleRequestResetToken} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                    Arbiter Username or Email
                  </label>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-[#302A25] border border-[#514538] rounded-[12px] px-4 py-2.5 text-sm text-[#F3EDE3] placeholder-[#B9AEA0]/50 focus:outline-none focus:border-[#B18A52] transition font-sans"
                    placeholder="e.g. arbiter_fischer"
                  />
                </div>

                {error && (
                  <div className="border border-[#9E3B3B]/40 bg-[#9E3B3B]/15 text-[#F3EDE3] rounded-[12px] p-3 text-xs font-sans font-medium">
                    {error}
                  </div>
                )}

                <RoyalButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full justify-center"
                >
                  {loading ? 'Generating Token…' : 'Generate Recovery Token'}
                </RoyalButton>

                <div className="flex items-center justify-between pt-3 border-t border-[#514538]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setError('')
                    }}
                    className="font-cinzel text-xs text-[#B9AEA0] hover:text-[#F3EDE3] flex items-center gap-1 transition font-semibold"
                  >
                    <ArrowLeft size={12} /> Back to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset')
                      setError('')
                    }}
                    className="font-cinzel text-xs text-[#B18A52] hover:text-[#C49D63] hover:underline font-semibold"
                  >
                    Enter Token Directly
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* RESET PASSWORD CONFIRM FORM */}
          {mode === 'reset' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#5B6E57]/40 bg-[#24211E] text-xl text-[#5B6E57] mx-auto shadow-inner">
                  <ShieldCheck size={22} />
                </div>
                <h2 className="font-serif italic text-2xl text-[#F3EDE3]">
                  Apply New <span className="text-[#B18A52]">Credentials</span>
                </h2>
                <p className="text-xs text-[#B9AEA0]">
                  Enter the cryptographically signed token and your new password.
                </p>
              </div>

              {generatedToken && (
                <div className="bg-[#302A25] border border-[#B18A52]/40 rounded-[12px] p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B18A52]">
                    <CheckCircle2 size={14} />
                    <span>Single-Use Token Generated:</span>
                  </div>
                  <div className="font-mono text-xs text-[#F3EDE3] break-all bg-[#24211E] p-2 rounded border border-[#514538]">
                    {generatedToken}
                  </div>
                  <p className="text-[10px] text-[#B9AEA0]">
                    Auto-filled below. This token expires in exactly 10 minutes.
                  </p>
                </div>
              )}

              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                    Recovery Token
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    className="w-full bg-[#302A25] border border-[#514538] rounded-[12px] px-4 py-2.5 text-sm text-[#F3EDE3] font-mono placeholder-[#B9AEA0]/50 focus:outline-none focus:border-[#B18A52] transition"
                    placeholder="64-character hex token"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                    New Secret Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-[#302A25] border border-[#514538] rounded-[12px] pl-4 pr-11 py-2.5 text-sm text-[#F3EDE3] placeholder-[#B9AEA0]/50 focus:outline-none focus:border-[#B18A52] transition font-sans"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B9AEA0] hover:text-[#B18A52] p-1 focus:outline-none transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="border border-[#9E3B3B]/40 bg-[#9E3B3B]/15 text-[#F3EDE3] rounded-[12px] p-3 text-xs font-sans font-medium">
                    {error}
                  </div>
                )}

                <RoyalButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full justify-center"
                >
                  {loading ? 'Updating Credentials…' : 'Update Credentials & Sign In'}
                </RoyalButton>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setError('')
                    }}
                    className="font-cinzel text-xs text-[#B9AEA0] hover:text-[#F3EDE3] inline-flex items-center gap-1 transition font-semibold"
                  >
                    <ArrowLeft size={12} /> Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

        </RoyalCard>
      </main>

      <RoyalFooter />
    </div>
  )
}
