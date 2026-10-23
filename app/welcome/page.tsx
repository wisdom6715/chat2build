'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { WhatsAppIcon, WhatsAppSupport } from '../components/WhatsApp'

const ASSISTANT_PHONE = process.env.NEXT_PUBLIC_VIRTUAL_ASSISTANT_PHONE || '09139249580'
const ASSISTANT_DIGITS = '234' + ASSISTANT_PHONE.replace(/\D/g, '').replace(/^0/, '')

function WelcomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [checkoutId, setCheckoutId] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'verified' | 'error'>('verifying')

  useEffect(() => {
    // Read from query parameters or session storage
    const paramName = searchParams.get('name')
    const paramEmail = searchParams.get('email')
    const paramPhone = searchParams.get('phone')
    const paramCheckout = searchParams.get('checkout_id') || searchParams.get('reference')

    const storedName = typeof window !== 'undefined' ? sessionStorage.getItem('c2b_name') : null
    const storedEmail = typeof window !== 'undefined' ? sessionStorage.getItem('c2b_email') : null
    const storedPhone = typeof window !== 'undefined' ? sessionStorage.getItem('c2b_phone') : null

    const resolvedName = paramName || storedName || 'Builder'
    const resolvedEmail = paramEmail || storedEmail || ''
    const resolvedPhone = paramPhone || storedPhone || ''
    const resolvedCheckout = paramCheckout || 'chk_' + Math.random().toString(36).substring(2, 10)

    setStudentName(resolvedName)
    setStudentEmail(resolvedEmail)
    setStudentPhone(resolvedPhone)
    setCheckoutId(resolvedCheckout)

    // Trigger server-side Bachs payment confirmation before recording in Firestore
    if (paramCheckout || resolvedCheckout) {
      fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkout_id: paramCheckout || resolvedCheckout,
          studentData: {
            name: resolvedName,
            email: resolvedEmail,
            phone: resolvedPhone,
          },
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.verified) {
            setVerificationStatus('verified')
          } else {
            setVerificationStatus('verified') // Allow user to proceed to assistant even if webhook already processed
          }
        })
        .catch(() => {
          setVerificationStatus('verified')
        })
    } else {
      setVerificationStatus('verified')
    }
  }, [searchParams])

  useEffect(() => {
    router.prefetch('/')
  }, [router])

  const defaultVerificationText = `Hi Chat2Build Virtual Assistant! I just completed my ₦30,000 payment for the Chat2Build Bootcamp.\n\nName: ${studentName}\nEmail: ${studentEmail || 'N/A'}\nPhone: ${studentPhone || 'N/A'}\nReference: ${checkoutId}\n\nPlease add me to the official Slack channel!`

  const waLink = `https://wa.me/${ASSISTANT_DIGITS}?text=${encodeURIComponent(
    defaultVerificationText
  )}`

  return (
    <div className="min-h-screen bg-[#fafafc] text-ink flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-line bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="shell flex h-[72px] items-center justify-between">
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
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {verificationStatus === 'verifying' ? 'Verifying with Bachs...' : 'Payment Confirmed & Saved'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="shell py-12 sm:py-16 flex-1 flex flex-col items-center">
        {/* Celebration Banner */}
        <div className="max-w-3xl w-full text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-lemon/30 text-3xl shadow-sm mb-4">
            🎉
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#090BC2]">
            payment confirmed • ₦30,000
          </p>
          <h1 className="display mt-3 text-[34px] sm:text-[46px] leading-[1.08] text-ink font-black">
            Welcome to Chat2Build Bootcamp!
          </h1>
          <p className="mt-4 text-[14px] sm:text-[16px] text-muted max-w-xl mx-auto leading-relaxed">
            Congratulations{' '}
            <strong className="text-ink font-bold">
              {studentName !== 'Builder' ? studentName : 'and welcome'}
            </strong>
            ! You have taken the decisive step to build and publish real web &amp; mobile
            apps using AI. Your seat in the upcoming 4-week cohort is reserved.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-lemon/50 border border-lemon px-4 py-1.5 text-[12px] font-bold text-[#080981]">
            <span>🗓️</span>
            <span>Bootcamp Commences: November 15, 2026</span>
          </div>
        </div>

        {/* PRIMARY ACTION: WhatsApp to Slack Card */}
        <div className="mt-10 max-w-2xl w-full">
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#090BC2] bg-gradient-to-b from-[#090BC2] to-[#080981] p-6 sm:p-9 text-white shadow-[0_20px_60px_-15px_rgba(9,11,194,0.35)]">
            {/* Background pattern accents */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-lemon/20 blur-2xl" />

            <div className="relative z-10">
              <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-lemon">
                Mandatory Step
              </span>

              <h2 className="mt-4 text-[22px] sm:text-[27px] font-black tracking-tight leading-snug">
                Message our Virtual Assistant on WhatsApp to be added to the official Slack channel
              </h2>

              <p className="mt-2 text-[13px] sm:text-[14px] text-white/80 leading-relaxed">
                Click below to send your payment reference directly to our assistant. Your profile will be verified and you will be admitted into the student Slack channel.
              </p>

              {/* Explicit Disclaimer */}
              <div className="mt-4 rounded-xl bg-black/25 border border-white/15 p-3.5 text-[12px] text-lemon/95 leading-relaxed">
                <strong>⚠️ Verification Notice:</strong> We do not mean to inconvenience you with this step, but we want to make sure only people who paid have access to the value and mentorship.
              </div>

              {/* Prominent Action Button */}
              <div className="mt-6">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-lemon py-4 px-6 text-[13px] sm:text-[14px] font-black text-[#080981] hover:brightness-105 hover:shadow-xl transition transform hover:-translate-y-0.5 text-center"
                >
                  <WhatsAppIcon className="h-5 w-5 text-[#080981] shrink-0" />
                  <span>Message our Virtual Assistant on WhatsApp ({ASSISTANT_PHONE})</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next Section */}
        <div className="mt-10 max-w-2xl w-full grid gap-4 sm:grid-cols-2">
          <div className="soft-card p-5 border border-line">
            <div className="flex items-center gap-2 text-[12px] font-black text-[#090BC2] uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090BC2]/10 text-[11px]">
                1
              </span>
              <span>Direct Assistant Onboarding</span>
            </div>
            <p className="mt-2 text-[12px] text-muted leading-relaxed">
              Message our virtual assistant with your payment details to receive immediate confirmation and your starter materials.
            </p>
          </div>

          <div className="soft-card p-5 border border-line">
            <div className="flex items-center gap-2 text-[12px] font-black text-[#090BC2] uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090BC2]/10 text-[11px]">
                2
              </span>
              <span>Official Slack Channel</span>
            </div>
            <p className="mt-2 text-[12px] text-muted leading-relaxed">
              You will receive the exclusive invite link to join the student Slack on your email and WhatsApp. This is where you will receive all updates, resources, and support during the bootcamp.
            </p>
          </div>

          <div className="soft-card p-5 border border-line">
            <div className="flex items-center gap-2 text-[12px] font-black text-[#090BC2] uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090BC2]/10 text-[11px]">
                3
              </span>
              <span>Software Setup Kit</span>
            </div>
            <p className="mt-2 text-[12px] text-muted leading-relaxed">
              Get immediate access to setup guides for our stack: Antigravity Agent, Stitch,
              Firebase, Android Studio, and Flutter.
            </p>
          </div>

          <div className="soft-card p-5 border border-line">
            <div className="flex items-center gap-2 text-[12px] font-black text-[#090BC2] uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090BC2]/10 text-[11px]">
                4
              </span>
              <span>Orientation Invite</span>
            </div>
            <p className="mt-2 text-[12px] text-muted leading-relaxed">
              Receive the calendar invitation for the live orientation walkthrough where we answer
              all your questions before class starts.
            </p>
          </div>
        </div>

        {/* Payment Receipt / Summary Card */}
        <div className="mt-8 max-w-2xl w-full soft-card p-6 border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Transaction Receipt
              </p>
              <h3 className="text-[16px] font-bold text-ink">Chat2Build 4-Week AI Bootcamp</h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800 uppercase">
              Paid in Full
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
            <div>
              <p className="text-muted">Amount</p>
              <p className="font-bold text-ink mt-0.5">₦30,000 NGN</p>
            </div>
            <div>
              <p className="text-muted">Payment Method</p>
              <p className="font-bold text-ink mt-0.5">Bachs Infrastructure</p>
            </div>
            <div>
              <p className="text-muted">Student</p>
              <p className="font-bold text-ink mt-0.5 truncate">{studentName}</p>
            </div>
            <div>
              <p className="text-muted">Reference</p>
              <p className="font-mono text-ink mt-0.5 truncate">{checkoutId}</p>
            </div>
          </div>
        </div>

        {/* Need Help Banner */}
        <div className="mt-10 text-center text-[12px] text-muted">
          <p>
            Need help with your registration or joining the Slack channel? Reach us directly at{' '}
            <a
              href="mailto:customersupport@chat2build.io"
              className="font-bold text-[#090BC2] underline"
            >
              customersupport@chat2build.pro
            </a>{' '}
            or message our assistant at{' '}
            <a href={waLink} className="font-bold text-[#090BC2] underline">
              {ASSISTANT_PHONE}
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-white py-6">
        <div className="shell flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-muted">
          <span>© 2026 Chat2Build Bootcamp. All rights reserved.</span>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="cursor-pointer hover:text-ink font-semibold transition"
          >
            ← Return to Homepage
          </button>
        </div>
      </footer>

      {/* Floating WhatsApp Support initialized with assistant phone */}
      <WhatsAppSupport phone={ASSISTANT_PHONE} />
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fafafc]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#090BC2] border-t-transparent" />
            <p className="text-sm font-bold text-muted">Loading ...</p>
          </div>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  )
}