'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type AuthStep = 'EMAIL' | 'NOT_REGISTERED' | 'OTP' | 'SET_PASSWORD' | 'PASSWORD_LOGIN'

export default function StudentLoginPage() {
  const router = useRouter()

  const [step, setStep] = useState<AuthStep>('EMAIL')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Check if student already has active session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace('/courses')
        }
      })
      .catch(() => {})
  }, [router])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // 1. Submit Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      // Check account registration
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })
      const checkData = await checkRes.json()

      if (!checkRes.ok || !checkData.registered) {
        setStep('NOT_REGISTERED')
        setLoading(false)
        return
      }

      // Returning student with password set: skip OTP completely (do not waste Resend emails!)
      if (checkData.hasPasswordSet) {
        setStep('PASSWORD_LOGIN')
        setLoading(false)
        return
      }

      // First-time student (no password set yet): send OTP to verify email before setting password
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })
      const otpData = await otpRes.json()

      if (!otpRes.ok) {
        throw new Error(otpData.error || 'Failed to send verification code.')
      }

      setStep('OTP')
      setResendCooldown(60)
      setSuccessMessage('We sent a 6-digit verification code to your email to set up your password!')
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Resend OTP Code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (res.ok) {
        setResendCooldown(60)
        setSuccessMessage('A fresh verification code has been sent!')
      } else {
        setErrorMessage(data.error || 'Failed to resend code.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Verify OTP (used only for initial password setup & forgot password reset)
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    const cleanOtp = otp.trim()

    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: cleanOtp }),
      })
      const data = await res.json()

      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Invalid verification code.')
      }

      // OTP is only used for initial password setup or password reset
      setPassword('')
      setConfirmPassword('')
      setStep('SET_PASSWORD')
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify code.')
    } finally {
      setLoading(false)
    }
  }

  // 4. Set Password (First time student)
  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to set password.')
      }

      // Direct entry to courses catalog
      router.push('/courses')
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save password.')
      setLoading(false)
    }
  }

  // 5. Password Login (Returning student)
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Incorrect password.')
      }

      // Direct entry to courses catalog
      router.push('/courses')
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.')
      setLoading(false)
    }
  }

  // Forgot password action: resends OTP and sets step to OTP verification
  const handleForgotPassword = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (res.ok) {
        setStep('OTP')
        setResendCooldown(60)
        setSuccessMessage('We sent a password reset code to your email!')
      } else {
        setErrorMessage(data.error || 'Failed to send reset code.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col justify-between">
      {/* Top Brand Header */}
      <header className="border-b border-[#e8e8f0] bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="Chat2Build"
              className="h-8 w-8 rounded-lg object-cover shadow-xs"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-base tracking-tight text-ink">Chat2Build</span>
            </div>
          </div>

          <a
            href="https://chat2build.pro/registration"
            className="inline-flex items-center justify-center px-4 py-2 rounded-[6px] bg-[#090bc2] hover:bg-[#080981] text-white border border-[#080981]/30 text-xs font-bold shadow-xs transition"
          >
            <span>Register</span>
          </a>
        </div>
      </header>

      {/* Hero Content Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-[460px]">
          {/* Card Surface adhering to Jakub Krehel R_outer = R_inner + padding */}
          <div className="rounded-3xl border border-[#e8e8f0] bg-white p-6 sm:p-9 shadow-card relative overflow-hidden">
            {/* Top decorative badge */}
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#090bc2]/10 border border-[#090bc2]/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#090bc2]">
                <span>🎓 2-Week Web App Bootcamp</span>
              </span>
              <h1 className="display-title text-[28px] sm:text-[32px] font-bold text-ink mt-3 leading-tight">
                {step === 'EMAIL' && 'Log In to Your Classroom'}
                {step === 'NOT_REGISTERED' && 'Account Not Found'}
                {step === 'OTP' && 'Check Your Email'}
                {step === 'SET_PASSWORD' && 'Create Your Password'}
                {step === 'PASSWORD_LOGIN' && 'Welcome Back'}
              </h1>
              <p className="text-xs sm:text-[13px] text-muted mt-2 leading-relaxed">
                {step === 'EMAIL' && 'Enter your registered email address to access our course materials and videos'}
                {step === 'NOT_REGISTERED' && 'You must be registered for the bootcamp before logging in.'}
                {step === 'OTP' && `We sent a 6-digit code to ${email}.`}
                {step === 'SET_PASSWORD' && 'Set a secure password for future logins to your classroom.'}
                {step === 'PASSWORD_LOGIN' && 'Enter your password to access your video classes and slides.'}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-700 animate-in fade-in duration-150">
                {errorMessage}
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 animate-in fade-in duration-150">
                {successMessage}
              </div>
            )}

            {/* STEP 1: EMAIL ENTRY */}
            {step === 'EMAIL' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Your Registered Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-[#e8e8f0] px-4 py-3 text-sm text-ink placeholder-slate-400 focus:border-[#090bc2] focus:outline-none focus:ring-2 focus:ring-[#090bc2]/15 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full primary-button py-3.5 text-sm font-black cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Checking Account...' : 'Continue with Email →'}
                </button>

                <p className="text-[11px] text-center text-muted pt-2">
                  We will verify your email with a secure one-time code or *login(highlightedwith login link)*
                </p>
              </form>
            )}

            {/* STEP: NOT REGISTERED ERROR CARD */}
            {step === 'NOT_REGISTERED' && (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <h4 className="text-xs font-black text-amber-900">Email not recognized</h4>
                      <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                        The email <strong className="text-ink">{email}</strong> has not enrolled in the Chat2Build Bootcamp yet. Enrollment is 100% free!
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href={`https://chat2build.pro/registration?email=${encodeURIComponent(email)}`}
                  className="w-full lemon-button py-3.5 text-sm font-black text-[#080981] shadow-sm text-center block"
                >
                  👉 Register for Free on Chat2Build
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('')
                    setStep('EMAIL')
                  }}
                  className="text-xs font-bold text-[#090bc2] hover:underline cursor-pointer block mx-auto pt-1"
                >
                  ← Try a different email
                </button>
              </div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'OTP' && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-ink">Enter 6-Digit Code</label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('')
                        setStep('EMAIL')
                      }}
                      className="text-[11px] font-bold text-[#090bc2] hover:underline"
                    >
                      Change email
                    </button>
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full text-center tracking-[0.3em] font-mono text-2xl font-black rounded-xl border border-[#e8e8f0] px-4 py-3 text-ink focus:border-[#090bc2] focus:outline-none focus:ring-2 focus:ring-[#090bc2]/15 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full primary-button py-3.5 text-sm font-black cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Verifying Code...' : 'Verify Code & Continue →'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs font-bold text-[#090bc2] hover:underline cursor-pointer disabled:opacity-40 disabled:hover:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Didn’t get the code? Resend'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3A: SET PASSWORD */}
            {step === 'SET_PASSWORD' && (
              <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-[#e8e8f0] px-4 py-3 text-sm text-ink focus:border-[#090bc2] focus:outline-none focus:ring-2 focus:ring-[#090bc2]/15 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your password"
                    required
                    className="w-full rounded-xl border border-[#e8e8f0] px-4 py-3 text-sm text-ink focus:border-[#090bc2] focus:outline-none focus:ring-2 focus:ring-[#090bc2]/15 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full primary-button py-3.5 text-sm font-black cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Set Password & Enter Classroom →'}
                </button>
              </form>
            )}

            {/* STEP 3B: PASSWORD LOGIN (RETURNING STUDENT) */}
            {step === 'PASSWORD_LOGIN' && (
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-ink">Enter Password</label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-bold text-[#090bc2] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-[#e8e8f0] px-4 py-3 text-sm text-ink focus:border-[#090bc2] focus:outline-none focus:ring-2 focus:ring-[#090bc2]/15 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full primary-button py-3.5 text-sm font-black cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Logging In...' : 'Enter Classroom →'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('EMAIL')
                      setPassword('')
                      setErrorMessage('')
                      setSuccessMessage('')
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-ink cursor-pointer"
                  >
                    ← Use a different email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e8f0] bg-white py-4 text-center text-[11px] text-muted">
        <span>&copy; 2026 Chat2Build Bootcamp • All rights reserved</span>
      </footer>
    </div>
  )
}
