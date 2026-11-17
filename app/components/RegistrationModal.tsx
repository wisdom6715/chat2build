'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type RegistrationContextType = {
  isOpen: boolean
  openRegistration: () => void
  closeRegistration: () => void
}

const RegistrationContext = createContext<RegistrationContextType>({
  isOpen: false,
  openRegistration: () => {},
  closeRegistration: () => {},
})

export const useRegistration = () => useContext(RegistrationContext)

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openRegistration = () => setIsOpen(true)
  const closeRegistration = () => setIsOpen(false)

  return (
    <RegistrationContext.Provider value={{ isOpen, openRegistration, closeRegistration }}>
      {children}
      <RegistrationModal isOpen={isOpen} onClose={closeRegistration} />
    </RegistrationContext.Provider>
  )
}

export function RegistrationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Prefetch welcome page
  useEffect(() => {
    if (isOpen) router.prefetch('/welcome')
  }, [isOpen, router])

  // Close on escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (!phone.trim()) {
      setErrorMessage('Please enter your WhatsApp / phone number.')
      return
    }

    setLoading(true)

    try {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('c2b_name', name.trim())
          sessionStorage.setItem('c2b_email', email.trim())
          sessionStorage.setItem('c2b_phone', phone.trim())
        }
      } catch (storageErr) {
        // Non-critical
      }

      let detectedSource = 'direct'
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        detectedSource =
          params.get('sources') ||
          params.get('source') ||
          sessionStorage.getItem('c2b_source') ||
          localStorage.getItem('c2b_source') ||
          'direct'
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: name.trim(),
          email: email.trim(),
          phone_number: phone.trim(),
          source: detectedSource,
          sources: detectedSource,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete registration.')
      }

      const targetUrl =
        data.redirect_url ||
        data.checkout_url ||
        `/welcome?name=${encodeURIComponent(name.trim())}&email=${encodeURIComponent(
          email.trim()
        )}&phone=${encodeURIComponent(phone.trim())}`

      onClose()
      window.location.assign(targetUrl)
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-line"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Top header accent */}
        <div className="h-2 bg-gradient-to-r from-[#090BC2] via-[#2D25EB] to-lemon" />

        <div className="p-6 sm:p-7">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lemon/30 px-2.5 py-0.5 text-[10px] font-bold text-[#080981]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#080981]" />
                Bootcamp Registration
              </span>
              <h2 id="modal-headline" className="mt-2 text-[22px] font-bold tracking-tight text-ink">
                Secure Your Cohort Seat
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line text-muted hover:bg-lavender hover:text-ink transition"
              aria-label="Close registration modal"
            >
              ✕
            </button>
          </div>

          <p className="mt-1 text-[12px] text-muted leading-relaxed">
            2-week hands-on immersion to build &amp; launch real web applications with AI.
          </p>

          {/* Pricing summary card */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-lavender p-3.5">
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Immersion Fee
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[24px] font-black tracking-tight text-[#090BC2]">
                  100% Free
                </span>
                <span className="text-[11px] text-muted">no payment required</span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-[12px] text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/60 focus:border-[#090BC2] focus:outline-none focus:ring-2 focus:ring-[#090BC2]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jane@example.com"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/60 focus:border-[#090BC2] focus:outline-none focus:ring-2 focus:ring-[#090BC2]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1">
                WhatsApp / Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678 or +234..."
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/60 focus:border-[#090BC2] focus:outline-none focus:ring-2 focus:ring-[#090BC2]/20"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#090BC2] py-3 text-[13px] font-black text-white hover:bg-[#080981] transition shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Registering your seat...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Free Registration →</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-5 border-t border-line pt-4 flex items-center justify-between text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <span>🎉</span> Free Cohort Immersion
            </span>
            <span>Instant Confirmation &amp; WhatsApp Group</span>
          </div>
        </div>
      </div>
    </div>
  )
}
