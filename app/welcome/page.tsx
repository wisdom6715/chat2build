'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { WhatsAppIcon, WhatsAppSupport } from '../components/WhatsApp'
import {
  WHATSAPP_COMMUNITY_URL,
  WHATSAPP_GROUP_URL,
  ASSISTANT_PHONE,
  ASSISTANT_DIGITS,
} from '../lib/constants'

function WelcomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentPhone, setStudentPhone] = useState('')

  useEffect(() => {
    // Read from query parameters or session storage
    const paramName = searchParams.get('name')
    const paramEmail = searchParams.get('email')
    const paramPhone = searchParams.get('phone')

    const storedName = typeof window !== 'undefined' ? sessionStorage.getItem('c2b_name') : null
    const storedEmail = typeof window !== 'undefined' ? sessionStorage.getItem('c2b_email') : null
    const storedPhone = typeof window !== 'undefined' ? sessionStorage.getItem('c2b_phone') : null

    const resolvedName = paramName || storedName || 'Builder'
    const resolvedEmail = paramEmail || storedEmail || ''
    const resolvedPhone = paramPhone || storedPhone || ''

    setStudentName(resolvedName)
    setStudentEmail(resolvedEmail)
    setStudentPhone(resolvedPhone)
  }, [searchParams])

  useEffect(() => {
    router.prefetch('/')
    // Trigger Meta Pixel CompleteRegistration & Lead events on confirmation
    if (typeof window !== 'undefined' && (window as any).fbq) {
      try {
        ;(window as any).fbq('track', 'CompleteRegistration', {
          content_name: 'Chat2Build Web App Bootcamp',
          status: 'success',
        })
        ;(window as any).fbq('track', 'Lead', {
          content_name: 'Chat2Build Web App Bootcamp',
        })
      } catch (err) {
        // Non-critical: safe ignore
      }
    }
  }, [router])

  const assistantChatText = `Hi Chat2Build Assistant! My name is ${studentName}. I just registered for the free Chat2Build Bootcamp!`
  const assistantWaLink = `https://wa.me/${ASSISTANT_DIGITS}?text=${encodeURIComponent(
    assistantChatText
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
              Registration Confirmed • 100% Free
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="shell py-12 sm:py-16 flex-1 flex flex-col items-center">
        {/* Celebration Banner */}
        <div className="max-w-3xl w-full text-center">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-lemon/30 text-3xl shadow-sm mb-4">
            🎉
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#090BC2]">
            enrollment confirmed • 100% free
          </p>
          <h1 className="display mt-3 text-[34px] sm:text-[46px] leading-[1.08] text-ink font-black">
            Welcome to Chat2Build Bootcamp!
          </h1>
          <p className="mt-4 text-[14px] sm:text-[16px] text-muted max-w-xl mx-auto leading-relaxed">
            Congratulations{' '}
            <strong className="text-ink font-bold">
              {studentName !== 'Builder' ? studentName : ''}
            </strong>
            ! You have taken the decisive step to build and publish real web applications using
            cutting-edge AI tools. Your seat in the upcoming cohort is officially reserved.
          </p>
          {/* <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-lemon/50 border border-lemon px-4 py-1.5 text-[12px] font-bold text-[#080981]">
            <span>🗓️</span>
            <span>Bootcamp Commences: November 22, 2026</span>
          </div> */}
        </div>

        {/* PRIMARY ACTION: Join WhatsApp Community Card */}
        <div className="mt-10 max-w-2xl w-full">
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#090BC2] bg-gradient-to-b from-[#090BC2] to-[#080981] p-6 sm:p-9 text-white shadow-[0_20px_60px_-15px_rgba(9,11,194,0.35)]">
            {/* Background accents */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-lemon/20 blur-2xl" />

            <div className="relative z-10">
              <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-lemon">
                Essential Next Step
              </span>

              <h2 className="mt-4 text-[22px] sm:text-[27px] font-black tracking-tight leading-snug">
                Join our Official WhatsApp Community
              </h2>

              <p className="mt-2 text-[13px] sm:text-[14px] text-white/85 leading-relaxed">
                Click below to join our student WhatsApp community group. This is where live class
                links, lecture recordings, curriculum updates, and direct mentor support are shared!
              </p>

              {/* Prominent Action Button */}
              <div className="mt-6">
                <a
                  href={WHATSAPP_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-lemon py-4 px-6 text-[14px] sm:text-[15px] font-black text-[#080981] hover:brightness-105 hover:shadow-xl transition transform hover:-translate-y-0.5 text-center"
                >
                  <WhatsAppIcon className="h-5 w-5 text-[#080981] shrink-0" />
                  <span>Click Here to Join WhatsApp Community Group →</span>
                </a>
              </div>

              {/* Support note */}
              <p className="mt-4 text-center text-[11px] text-white/70">
                A confirmation email with this invite link has also been sent to{' '}
                <span className="font-semibold text-white">{studentEmail || 'your email'}</span>.
              </p>
            </div>
          </div>
        </div>

        {/* What Happens Next Section */}
        <div className="mt-10 max-w-2xl w-full grid gap-4 sm:grid-cols-2">
          <div className="soft-card p-5 border border-line bg-white">
            <div className="flex items-center gap-2 text-[12px] font-black text-[#090BC2] uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090BC2]/10 text-[11px]">
                1
              </span>
              <span>Join WhatsApp Group</span>
            </div>
            <p className="mt-2 text-[12px] text-muted leading-relaxed">
              Join the student WhatsApp community to introduce yourself, meet your cohort peers, and
              connect with mentors.
            </p>
          </div>

          <div className="soft-card p-5 border border-line bg-white">
            <div className="flex items-center gap-2 text-[12px] font-black text-[#090BC2] uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090BC2]/10 text-[11px]">
                2
              </span>
              <span>Check Your Inbox</span>
            </div>
            <p className="mt-2 text-[12px] text-muted leading-relaxed">
              You will receive your welcome confirmation and class details on your email. Check your
              spam or promotions tab if you don&apos;t see it.
            </p>
          </div>

          <div className="soft-card p-5 border border-line bg-white">
            <div className="flex items-center gap-2 text-[12px] font-black text-[#090BC2] uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090BC2]/10 text-[11px]">
                3
              </span>
              <span>Software Setup Kit</span>
            </div>
            <p className="mt-2 text-[12px] text-muted leading-relaxed">
              Get your laptop ready. We will share setup guides for modern AI agent development
              tools and web app workflows.
            </p>
          </div>

          <div className="soft-card p-5 border border-line bg-white">
            <div className="flex items-center gap-2 text-[12px] font-black text-[#090BC2] uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090BC2]/10 text-[11px]">
                4
              </span>
              <span>Live Class Orientation</span>
            </div>
            <p className="mt-2 text-[12px] text-muted leading-relaxed">
              Get the calendar invite for the live orientation walkthrough where mentors answer all
              your questions before class starts.
            </p>
          </div>
        </div>

        {/* Enrollment Summary Card */}
        <div className="mt-8 max-w-2xl w-full soft-card p-6 border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Registration Summary
              </p>
              <h3 className="text-[16px] font-bold text-ink">Chat2Build 2-Week AI Bootcamp</h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800 uppercase">
              100% Free
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px]">
            <div>
              <p className="text-muted">Tuition</p>
              <p className="font-bold text-ink mt-0.5">Free Enrollment</p>
            </div>
            <div>
              <p className="text-muted">Student Name</p>
              <p className="font-bold text-ink mt-0.5">{studentName}</p>
            </div>
            <div>
              <p className="text-muted">Contact Email</p>
              <p className="font-bold text-ink mt-0.5 truncate">{studentEmail || 'Registered'}</p>
            </div>
          </div>
        </div>

        {/* Direct Contact Support Link */}
        <p className="mt-8 text-center text-[12px] text-muted">
          Need help with your registration or joining the group? Reach us directly at{' '}
          <a
            href="mailto:customersupport@chat2build.pro"
            className="text-[#090BC2] font-semibold hover:underline"
          >
            customersupport@chat2build.pro
          </a>{' '}
          or message our assistant at{' '}
          <a
            href={assistantWaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#090BC2] font-bold hover:underline"
          >
            {ASSISTANT_PHONE}
          </a>
          .
        </p>

        {/* Home Button */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-xl border border-line bg-white px-6 py-2.5 text-[12px] font-bold text-ink hover:bg-slate-50 transition cursor-pointer shadow-sm"
          >
            ← Return to Homepage
          </button>
        </div>
      </main>

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
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#090BC2] border-t-transparent mx-auto" />
            <p className="mt-3 text-[13px] font-semibold text-muted">Loading your welcome page...</p>
          </div>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  )
}
