'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { saveAdminSession, getAdminSession } from '../../lib/adminAuth'

export default function AdminLoginPage() {
  const router = useRouter()

  // Step 1 = Firebase Email & Password; Step 2 = Google Authenticator 2FA (TOTP)
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Google Authenticator TOTP State
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [hasExistingTotp, setHasExistingTotp] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const session = getAdminSession()
    if (session?.authenticated) {
      router.replace('/admin/dashboard')
    }
  }, [router])

  // Step 1: Sign in with Firebase Authentication & fetch Google Authenticator QR code
  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your admin email and password.')
      return
    }

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password)

      // Fetch or generate Google Authenticator TOTP QR code & secret from server
      const totpRes = await fetch('/api/admin/auth/totp-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })
      const totpData = await totpRes.json().catch(() => ({}))

      if (totpRes.ok && totpData.success) {
        setQrCodeUrl(totpData.qrCode || '')
        setTotpSecret(totpData.secret || '')
        setHasExistingTotp(Boolean(totpData.hasExistingTotp))
        // If first time setting up, show the QR code expanded by default
        setShowQrCode(!totpData.hasExistingTotp)
      }

      setLoading(false)
      // Advance to Step 2: Google Authenticator 6-digit rotating code
      setStep(2)
    } catch (err: any) {
      console.error('[Admin Sign-in Error]:', err)
      setLoading(false)
      let msg = 'Failed to sign in. Please verify your admin credentials.'
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify your credentials in Firebase Authentication.'
      } else if (err.code === 'auth/user-not-found') {
        msg = 'Admin account not found in Firebase. Please ensure this admin user exists.'
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again in a few minutes.'
      } else if (err.message) {
        msg = err.message
      }
      setErrorMessage(msg)
    }
  }

  // Step 2: Verify 6-digit Google Authenticator rotating code
  const handleVerifyAuthCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanCode = authCode.replace(/[\s-]/g, '').trim()
    if (!cleanCode) {
      setErrorMessage('Please enter the 6-digit rotating code from Google Authenticator.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          authCode: cleanCode,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            'Invalid 6-digit code. Please verify the code displayed in your Google Authenticator app.'
        )
      }

      // Save authenticated admin session
      saveAdminSession(email.trim().toLowerCase())

      // Redirect to admin dashboard
      router.replace('/admin/dashboard')
    } catch (err: any) {
      console.error('[Auth Code Error]:', err)
      setErrorMessage(err.message || 'Verification failed. Please try again.')
      setLoading(false)
    }
  }

  // Copy secret key text
  const handleCopySecretKey = () => {
    if (totpSecret && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(totpSecret)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2500)
    }
  }

  // Reset back to Step 1
  const handleResetStep = async () => {
    try {
      await signOut(auth)
    } catch {}
    setStep(1)
    setAuthCode('')
    setErrorMessage('')
    setQrCodeUrl('')
    setTotpSecret('')
  }

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col justify-between text-ink">
      {/* Header */}
      <header className="border-b border-line bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="shell flex h-[70px] items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#090BC2] text-[14px] font-black text-white shadow-[inset_0_-2px_0_rgba(0,0,0,.1)]">
              C
            </span>
            <span className="font-bold text-[16px] tracking-tight">Chat2Build</span>
            <span className="ml-2 rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Admin Portal
            </span>
          </div>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="cursor-pointer text-[12px] font-semibold text-muted hover:text-[#090BC2] transition"
          >
            ← Back to Main Site
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="shell py-10 sm:py-16 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="soft-card overflow-hidden border border-line bg-white shadow-card rounded-2xl">
            {/* Top colored accent line */}
            <div className="h-2 bg-gradient-to-r from-[#090BC2] via-[#2D25EB] to-lemon" />

            <div className="p-6 sm:p-8">
              {/* Badge & Title */}
              <div className="text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#090BC2]/10 border border-[#090BC2]/20 px-3 py-1 text-[11px] font-bold text-[#090BC2]">
                  <span className="h-2 w-2 rounded-full bg-[#090BC2]" />
                  Internal Administrative Access
                </span>

                <h1 className="mt-3 text-[22px] sm:text-[24px] font-black tracking-tight text-ink">
                  {step === 1 ? 'Admin Sign In' : 'Google Authenticator 2FA'}
                </h1>
                <p className="mt-1 text-[12px] text-muted">
                  {step === 1
                    ? 'Enter your administrator credentials to continue.'
                    : 'Scan the QR code in Google Authenticator and enter your 6-digit rotating code.'}
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mt-5 rounded-xl bg-red-50 border border-red-200 p-3.5 text-[12px] text-red-600 leading-relaxed">
                  <strong>Access Denied:</strong> {errorMessage}
                </div>
              )}

              {/* STEP 1: Firebase Auth Credentials */}
              {step === 1 && (
                <form onSubmit={handleFirebaseLogin} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
                      Admin Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@chat2build.pro"
                      className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/60 focus:border-[#090BC2] focus:outline-none focus:ring-2 focus:ring-[#090BC2]/20"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-muted hover:text-ink font-semibold"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/60 focus:border-[#090BC2] focus:outline-none focus:ring-2 focus:ring-[#090BC2]/20"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#090BC2] py-3.5 px-6 text-[13px] font-black text-white hover:bg-[#080981] transition shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Verifying credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Google 2FA</span>
                          <span className="text-base">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Google Authenticator Rotating Code & QR Code */}
              {step === 2 && (
                <div className="mt-6 space-y-4">
                  {/* Current Account Card */}
                  <div className="flex items-center justify-between rounded-xl border border-line bg-lavender p-3 text-[12px]">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted">Admin Account</p>
                      <p className="font-bold text-ink truncate max-w-[200px]">{email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetStep}
                      className="text-[11px] font-bold text-[#090BC2] hover:underline cursor-pointer"
                    >
                      Switch Account
                    </button>
                  </div>

                  {/* QR Code Section */}
                  {qrCodeUrl && (
                    <div className="rounded-2xl border border-line bg-slate-50 p-4 text-center">
                      <div className="flex items-center justify-between pb-2 border-b border-line">
                        <span className="text-[11px] font-bold text-ink flex items-center gap-1.5">
                          <span>📱</span>
                          <span>Google Authenticator QR Code</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowQrCode(!showQrCode)}
                          className="text-[11px] font-bold text-[#090BC2] hover:underline cursor-pointer"
                        >
                          {showQrCode ? 'Hide QR Code' : 'Show QR Code'}
                        </button>
                      </div>

                      {showQrCode && (
                        <div className="pt-3 animate-in fade-in duration-200">
                          <p className="text-[11px] text-muted mb-3 leading-relaxed">
                            Open <strong>Google Authenticator</strong> on your phone, tap <strong>+</strong>, and choose <strong>Scan a QR code</strong>:
                          </p>

                          <div className="inline-block p-2 bg-white rounded-xl border-2 border-[#090BC2]/30 shadow-sm">
                            {/* QR Code Image */}
                            <img
                              src={qrCodeUrl}
                              alt="Google Authenticator QR Code"
                              className="h-44 w-44 mx-auto rounded-lg object-contain"
                            />
                          </div>

                          {/* Secret key for manual entry */}
                          {totpSecret && (
                            <div className="mt-3 text-left bg-white p-2.5 rounded-lg border border-line text-[11px]">
                              <span className="text-[10px] font-bold uppercase text-muted block mb-0.5">
                                Manual Secret Key (if camera unavailable):
                              </span>
                              <div className="flex items-center justify-between gap-2">
                                <code className="font-mono font-bold text-[11px] text-ink break-all select-all">
                                  {totpSecret}
                                </code>
                                <button
                                  type="button"
                                  onClick={handleCopySecretKey}
                                  className="shrink-0 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-800 transition cursor-pointer"
                                >
                                  {copiedKey ? '✓ Copied' : 'Copy'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!showQrCode && (
                        <p className="mt-2 text-[11px] text-muted text-left">
                          QR code already scanned? Simply enter the 6-digit code currently shown in your Google Authenticator app below.
                        </p>
                      )}
                    </div>
                  )}

                  {/* 6-Digit Rotating Code Form */}
                  <form onSubmit={handleVerifyAuthCode} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
                        6-Digit Rotating Code
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        autoComplete="one-time-code"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        placeholder="000000"
                        className="w-full text-center rounded-xl border-2 border-line py-3 text-[24px] font-mono font-bold tracking-[0.3em] text-[#090BC2] placeholder:text-muted/30 placeholder:tracking-normal focus:border-[#090BC2] focus:outline-none focus:ring-4 focus:ring-[#090BC2]/10"
                      />
                      <p className="mt-1.5 text-[10px] text-muted text-center">
                        Code rotates every 30 seconds in your Google Authenticator app.
                      </p>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-lemon py-3.5 px-6 text-[13px] font-black text-[#080981] hover:brightness-105 transition shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-[#080981]" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Verifying rotating code...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify &amp; Enter Dashboard</span>
                            <span className="text-base">→</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleResetStep}
                        className="w-full py-2 text-[12px] font-semibold text-muted hover:text-ink transition cursor-pointer"
                      >
                        Cancel and back to sign in
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security notice */}
              <div className="mt-6 border-t border-line pt-4 text-center text-[10px] text-muted leading-relaxed">
                <p>🔒 <strong>Zero Public Signup:</strong> Only pre-provisioned administrator accounts configured in Firebase Authentication and the Firestore database can access this portal.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-white py-4 text-center text-[11px] text-muted">
        <span>© 2026 Chat2Build Administration Portal • Google Authenticator TOTP Security</span>
      </footer>
    </div>
  )
}
