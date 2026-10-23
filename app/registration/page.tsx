'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WhatsAppSupport } from '../components/WhatsApp'

const ASSISTANT_PHONE = '09139249581'

const perks = [
  'Bootcamp commencement date: November 15, 2026',
  'Guaranteed 4-week intensive bootcamp immersion',
  'Weekly 3 days live mentor Q&A & live architecture teardowns',
  'Build real web & cross-platform mobile apps with AI tools',
  'Step-by-step App Store & Google Play publishing walkthrough',
  'Direct 1-on-1 code debugging & 24/7 technical tutor support',
  'Access to private student builder community & official Slack channel',
  'Lifetime access to recorded classes and curriculum updates',
  'No hidden fees — transparent ₦30,000 one-time payment',
]

export default function RegistrationPage() {
  const router = useRouter()
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setErrorMessage('')

    const cleanName = fullname.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPhone = phoneNumber.trim()

    if (!cleanName) {
      setErrorMessage('Please enter your full name.')
      return
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (!cleanPhone) {
      setErrorMessage('Please enter your phone / WhatsApp number.')
      return
    }

    setLoading(true)

    try {
      // 1. Save student details safely for welcome page (safe in iOS private browsing)
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('c2b_name', cleanName)
          sessionStorage.setItem('c2b_email', cleanEmail)
          sessionStorage.setItem('c2b_phone', cleanPhone)
        }
      } catch (storageErr) {
        // Non-critical: ignore quota restrictions in private browsing
      }

      // 2. Call backend to create Bachs checkout session & persist in Firebase Firestore
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: cleanName,
          email: cleanEmail,
          phone_number: cleanPhone,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.checkout_url) {
        throw new Error(data.error || 'Failed to initialize payment. Please try again.')
      }

      setCheckoutUrl(data.checkout_url)

      // 3. Immediately redirect to Bachs hosted checkout
      // Using assign for maximum compatibility across mobile Safari, Android Chrome, and in-app webviews
      window.location.assign(data.checkout_url)
    } catch (err: any) {
      console.error('[Registration Error]:', err)
      setErrorMessage(err.message || 'Something went wrong. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafc] text-ink flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-line bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="shell flex h-[74px] items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="group inline-flex cursor-pointer items-center gap-2 text-[14px] font-bold tracking-[-0.03em] text-ink"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#090BC2] text-[14px] font-black text-white shadow-[inset_0_-2px_0_rgba(0,0,0,.1)]">
              C
            </span>
            <span className="font-bold text-[16px]">Chat2Build</span>
          </button>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-lemon/30 px-3 py-1 text-[11px] font-bold text-[#080981]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#080981]" />
              Secure 256-bit Checkout
            </span>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="cursor-pointer text-[12px] font-semibold text-muted hover:text-[#090BC2] transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="shell py-10 sm:py-16 flex-1">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
              <span className="yellow-label">Bootcamp Enrollment</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#090BC2]/10 border border-[#090BC2]/20 px-3 py-0.5 text-[11px] font-bold text-[#090BC2]">
                <span>🗓️</span>
                <span>Commencement Date: November 15, 2026</span>
              </span>
            </div>
            <h1 className="display mt-3 text-[30px] sm:text-[40px] font-black leading-tight text-ink">
              Register for Chat2Build Bootcamp
            </h1>
            <p className="mt-2 text-[13px] sm:text-[15px] text-muted max-w-2xl">
              Fill in your details below to secure your seat. You will be redirected to complete your ₦30,000 payment.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            {/* Left Column: Course Overview & Summary */}
            <div className="space-y-6">
              <div className="soft-card p-6 sm:p-7 border border-line bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#090BC2]">
                      Recommended Plan
                    </span>
                    <h2 className="text-[20px] font-bold text-ink mt-0.5">Comprehensive Immersion</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[26px] font-black tracking-tight text-[#090BC2]">₦30,000</p>
                    <p className="text-[10px] text-muted">one-time payment</p>
                  </div>
                </div>

                <p className="mt-4 text-[12px] text-muted leading-relaxed">
                  Learn how to build, test, and launch real web and mobile apps using AI tools starting from zero. No prior coding experience required.
                </p>

                <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-ink">
                  Everything Included in Your Seat:
                </h3>

                <ul className="mt-3.5 space-y-2.5">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-[11px] text-ink leading-5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#090BC2] text-[9px] font-bold text-white">
                        ✓
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bachs Trust Banner */}
              <div className="rounded-2xl border border-line bg-lavender p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#090BC2] text-white font-black text-sm">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-ink">Bachs Payment Infrastructure</h3>
                    <p className="text-[11px] text-muted mt-0.5">
                      Accepts Nigerian Cards, Bank Transfer, USSD, and Crypto. Fast, localized, and securely encrypted.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Registration Form */}
            <div className="soft-card overflow-hidden border border-line bg-white shadow-card">
              <div className="h-2 bg-gradient-to-r from-[#090BC2] via-[#2D25EB] to-lemon" />

              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <h2 className="text-[18px] font-bold text-ink">Student Information</h2>
                    <p className="text-[11px] text-muted mt-0.5">Please provide accurate contact details.</p>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Step 1 of 2
                  </span>
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-[12px] text-red-600">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullname"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/60 focus:border-[#090BC2] focus:outline-none focus:ring-2 focus:ring-[#090BC2]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. jane@example.com"
                      className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/60 focus:border-[#090BC2] focus:outline-none focus:ring-2 focus:ring-[#090BC2]/20"
                    />
                    <p className="mt-1 text-[10px] text-muted">
                      Your payment receipt and onboarding kit will be sent to this email.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1">
                      Phone Number / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 09139249581 or +234..."
                      className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/60 focus:border-[#090BC2] focus:outline-none focus:ring-2 focus:ring-[#090BC2]/20"
                    />
                    <p className="mt-1 text-[10px] text-muted">
                      Used to message our virtual assistant ({ASSISTANT_PHONE}) to be added to the official Slack channel.
                    </p>
                  </div>

                  {/* Summary row */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between rounded-lg bg-lavender p-3 border border-line text-[12px]">
                      <span className="font-semibold text-muted">Total Amount Due</span>
                      <span className="text-[16px] font-black text-[#090BC2]">₦30,000 NGN</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    {checkoutUrl ? (
                      <a
                        href={checkoutUrl}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-lemon py-3.5 px-6 text-[13px] font-black text-[#080981] hover:brightness-105 transition shadow-md animate-pulse text-center"
                      >
                        <span>Redirecting... Tap here if not redirected automatically</span>
                        <span className="text-base">→</span>
                      </a>
                    ) : (
                      <button
                        type="submit"
                        aria-disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl bg-[#090BC2] py-3.5 px-6 text-[13px] font-black text-white hover:bg-[#080981] transition shadow-md hover:shadow-lg ${
                          loading ? 'opacity-80 pointer-events-none' : 'cursor-pointer'
                        }`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Processing payment...</span>
                          </>
                        ) : (
                          <>
                            <span>Make Payment (₦30,000)</span>
                            <span className="text-base">→</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>

                <div className="mt-5 border-t border-line pt-4 text-center text-[10px] text-muted">
                  <p>🔒 256-bit encrypted checkout. You will be redirected to complete your payment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-white py-6">
        <div className="shell flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-muted">
          <span>© 2026 Chat2Build Bootcamp. All rights reserved.</span>
          <span>
            Need help? Contact{' '}
            <a href="mailto:customersupport@chat2build.io" className="underline font-bold text-[#090BC2]">
              customersupport@chat2build.io
            </a>
          </span>
        </div>
      </footer>

      {/* Floating WhatsApp Support */}
      <WhatsAppSupport phone={ASSISTANT_PHONE} />
    </div>
  )
}