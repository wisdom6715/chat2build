'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { getAdminSession, clearAdminSession, AdminSession } from '../../lib/adminAuth'
import { normalizeSource } from '../../lib/constants'
import { CurriculumManager } from './CurriculumManager'

interface StudentRegistration {
  id: string
  fullname: string
  email: string
  phone_number: string
  amount: number
  currency: string
  status: string
  checkout_id: string
  source?: string
  isIncluded: boolean
  includedAt?: string | null
  includedBy?: string | null
  slackInviteSent: boolean
  slackInviteSentAt?: string | null
  welcomeEmailSent: boolean
  welcomeEmailSentAt?: string | null
  createdAt?: string
}

function safeFormatDateTime(val: any): string {
  if (!val) return ''
  try {
    const d =
      typeof val === 'string'
        ? new Date(val)
        : val?.seconds
        ? new Date(val.seconds * 1000)
        : new Date(val)
    if (isNaN(d.getTime())) return typeof val === 'string' ? val : ''
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function safeFormatDateShort(val: any): string {
  if (!val) return 'earlier'
  try {
    if (typeof val === 'string' && val.includes('T')) {
      return val.split('T')[0]
    }
    const d =
      typeof val === 'string'
        ? new Date(val)
        : val?.seconds
        ? new Date(val.seconds * 1000)
        : new Date(val)
    if (isNaN(d.getTime())) return typeof val === 'string' ? val : 'earlier'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return 'earlier'
  }
}

function getSourceBadge(sourceRaw?: string) {
  const s = normalizeSource(sourceRaw)
  if (s === 'meta') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-[#1877F2] border border-blue-200">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1877F2] animate-pulse" />
        <span>📱 Meta Ads</span>
      </span>
    )
  }
  if (s === 'google') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        <span>🔍 Google Ads</span>
      </span>
    )
  }
  if (s === 'x') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-neutral-900 text-white border border-neutral-700">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        <span>𝕏 Campaign</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
      <span>🌐</span>
      <span>Direct / Organic</span>
    </span>
  )
}

export default function AdminDashboardPage() {

  const router = useRouter()
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterIncluded, setFilterIncluded] = useState<'all' | 'included' | 'pending'>('all')
  const [filterSource, setFilterSource] = useState<'all' | 'meta' | 'google' | 'x' | 'direct'>('all')
  const [activeTab, setActiveTab] = useState<'admissions' | 'curriculum'>('admissions')

  // Notification / Feedback banner
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Tracking in-flight action state per registration ID
  const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Google Authenticator 2FA modal state
  const [showTotpModal, setShowTotpModal] = useState(false)
  const [totpQr, setTotpQr] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)
  const [totpCopied, setTotpCopied] = useState(false)

  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)


  const handleOpenTotpModal = async () => {
    setShowTotpModal(true)
    if (!totpQr && admin?.email) {
      setTotpLoading(true)
      try {
        const res = await fetch('/api/admin/auth/totp-setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: admin.email }),
        })
        const data = await res.json()
        if (data.success) {
          setTotpQr(data.qrCode)
          setTotpSecret(data.secret)
        }
      } catch (err) {
        console.error('Failed to load TOTP QR:', err)
      } finally {
        setTotpLoading(false)
      }
    }
  }

  // Protect route & verify authentication
  useEffect(() => {
    const session = getAdminSession()
    if (!session || !session.authenticated) {
      router.replace('/admin/login')
      return
    }
    setAdmin(session)
    fetchRegistrations()
  }, [router])

  // Fetch all registrations from Firestore via Admin API
  const fetchRegistrations = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/registrations', {
        headers: {
          Authorization: 'Bearer admin-portal-token',
        },
      })
      const data = await res.json()
      if (res.ok && data.registrations) {
        setRegistrations(data.registrations)
      } else {
        showAlert('error', data.error || 'Failed to load registrations.')
      }
    } catch (err: any) {
      console.error('[Dashboard Error]:', err)
      showAlert('error', 'Network error loading registration list.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => {
      setAlert(null)
    }, 5000)
  }

  // 1. Send Slack Invite Email (handled by virtual assistant / admin)
  const handleSendSlackInvite = async (student: StudentRegistration) => {
    setActionLoading((prev) => ({ ...prev, [student.id]: 'slack' }))
    try {
      const res = await fetch('/api/admin/registrations/send-slack-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          email: student.email,
          name: student.fullname,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === student.id
              ? { ...r, slackInviteSent: true, slackInviteSentAt: new Date().toISOString() }
              : r
          )
        )
        showAlert('success', `WhatsApp community invite sent via Resend to ${student.email}!`)
      } else {
        showAlert('error', data.error || 'Failed to send WhatsApp community invite.')
      }
    } catch (err: any) {
      showAlert('error', err.message || 'Error sending WhatsApp community invite.')
    } finally {
      setActionLoading((prev) => ({ ...prev, [student.id]: null }))
    }
  }

  // 2. Copy WhatsApp Number to Clipboard
  const handleCopyWhatsApp = (student: StudentRegistration) => {
    const rawPhone = student.phone_number || ''
    const digits = rawPhone.replace(/\D/g, '')
    let formatted = digits
    if (digits.startsWith('0') && digits.length === 11) {
      formatted = '+234' + digits.slice(1)
    } else if (digits.length === 10) {
      formatted = '+234' + digits
    } else if (digits.startsWith('234')) {
      formatted = '+' + digits
    } else if (!formatted.startsWith('+')) {
      formatted = '+' + digits
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(formatted || rawPhone)
      setCopiedId(student.id)
      setTimeout(() => setCopiedId(null), 2500)
      showAlert('success', `Copied ${formatted} to clipboard!`)
    } else {
      window.prompt('Copy WhatsApp phone number:', formatted || rawPhone)
    }
  }

  // Helper to open WhatsApp chat directly
  const getWhatsAppLink = (student: StudentRegistration) => {
    const digits = (student.phone_number || '').replace(/\D/g, '')
    let intl = digits
    if (digits.startsWith('0') && digits.length === 11) {
      intl = '234' + digits.slice(1)
    } else if (digits.length === 10) {
      intl = '234' + digits
    }
    const text = `Hello ${student.fullname}! This is the Chat2Build Admissions Team regarding your registration. We are following up to welcome you and ensure you have joined the official student WhatsApp community!`
    return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`
  }

  // 3. Mark as Included and Fully Saved in DB via CHECK SLIDER
  const handleToggleIncluded = async (student: StudentRegistration) => {
    const nextStatus = !student.isIncluded
    setActionLoading((prev) => ({ ...prev, [student.id]: 'include' }))
    try {
      const res = await fetch('/api/admin/registrations/mark-included', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          isIncluded: nextStatus,
          adminEmail: admin?.email || 'admin',
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === student.id
              ? {
                  ...r,
                  isIncluded: nextStatus,
                  includedAt: nextStatus ? new Date().toISOString() : null,
                  includedBy: nextStatus ? admin?.email || 'Admin' : null,
                  status: nextStatus ? 'included' : 'paid',
                }
              : r
          )
        )
        if (nextStatus) {
          showAlert(
            'success',
            `Marked ${student.fullname} as INCLUDED and locked in DB! (Impersonation blocked)`
          )
        } else {
          showAlert('success', `Unmarked ${student.fullname} from included status.`)
        }
      } else {
        showAlert('error', data.error || 'Failed to update inclusion status.')
      }
    } catch (err: any) {
      showAlert('error', err.message || 'Error updating inclusion status.')
    } finally {
      setActionLoading((prev) => ({ ...prev, [student.id]: null }))
    }
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth)
      await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => {})
    } catch (e) {
      console.error(e)
    }
    clearAdminSession()
    router.replace('/admin/login')
  }

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        reg.fullname.toLowerCase().includes(q) ||
        reg.email.toLowerCase().includes(q) ||
        reg.phone_number.toLowerCase().includes(q) ||
        (reg.source && reg.source.toLowerCase().includes(q)) ||
        reg.checkout_id.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (filterIncluded === 'included') return reg.isIncluded
      if (filterIncluded === 'pending') return !reg.isIncluded

      if (filterSource !== 'all') {
        const s = normalizeSource(reg.source)
        if (filterSource === 'meta' && s !== 'meta') return false
        if (filterSource === 'google' && s !== 'google') return false
        if (filterSource === 'x' && s !== 'x') return false
        if (filterSource === 'direct' && s !== 'direct') return false
      }

      return true
    })
  }, [registrations, searchQuery, filterIncluded, filterSource])

  // Summary statistics
  const stats = useMemo(() => {
    const total = registrations.length
    const included = registrations.filter((r) => r.isIncluded).length
    const slackSent = registrations.filter((r) => r.slackInviteSent).length
    const totalRevenue = registrations.reduce((sum, r) => sum + (r.amount || 0), 0)
    return { total, included, slackSent, totalRevenue }
  }, [registrations])

  // Campaign source analytics (Meta vs Google vs 𝕏 vs Direct)
  const sourceStats = useMemo(() => {
    let meta = 0
    let google = 0
    let x = 0
    let direct = 0

    registrations.forEach((r) => {
      const s = normalizeSource(r.source)
      if (s === 'x') {
        x++
      } else if (s === 'meta') {
        meta++
      } else if (s === 'google') {
        google++
      } else {
        direct++
      }
    })

    const total = registrations.length
    const maxVal = Math.max(meta, google, x, direct, 1)
    const metaPct = total > 0 ? Math.round((meta / total) * 100) : 0
    const googlePct = total > 0 ? Math.round((google / total) * 100) : 0
    const xPct = total > 0 ? Math.round((x / total) * 100) : 0
    const directPct = total > 0 ? Math.max(0, 100 - metaPct - googlePct - xPct) : 0

    return { meta, google, x, direct, total, maxVal, metaPct, googlePct, xPct, directPct }
  }, [registrations])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#090BC2] border-t-transparent" />
          <p className="text-sm font-bold text-muted">Loading Admin Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafc] text-ink flex flex-col justify-between">
      {/* Top Admin Navigation */}
      <header className="border-b border-line bg-white sticky top-0 z-30 shadow-xs">
        <div className="shell flex h-[68px] sm:h-[72px] items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#090BC2] text-[15px] font-black text-white shadow-sm shrink-0">
              C
            </span>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-[15px] sm:text-[16px] tracking-tight text-ink">Chat2Build</span>
                <span className="rounded-full bg-slate-900 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-muted hidden sm:block">Cohort Admissions &amp; Access Control</p>
            </div>
          </div>

          {/* Desktop Navigation Items (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-line bg-lavender px-3 py-1 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted">Signed in:</span>
              <span className="font-bold text-ink truncate max-w-[170px]">{admin?.email}</span>
            </div>

            <button
              type="button"
              onClick={handleOpenTotpModal}
              title="View Google Authenticator QR Code & secret key"
              className="flex items-center gap-1.5 rounded-lg border border-line bg-white hover:bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-ink transition cursor-pointer"
            >
              <span>📱</span>
              <span>2FA QR Code</span>
            </button>

            <button
              type="button"
              onClick={fetchRegistrations}
              disabled={refreshing}
              title="Refresh registration data"
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-bold text-ink hover:bg-lavender transition cursor-pointer"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
            >
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Hamburger Button (visible only on mobile < md) */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-line bg-slate-50 text-ink hover:bg-slate-100 transition cursor-pointer text-lg font-bold"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-line bg-white/98 backdrop-blur px-4 py-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
            {/* Admin Profile Bar */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-line text-[11px] mb-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-muted">Admin:</span>
              <span className="font-bold text-ink truncate">{admin?.email}</span>
            </div>

            {/* Menu Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleOpenTotpModal()
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-line bg-white hover:bg-slate-50 text-ink font-bold text-[12px] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📱</span>
                  <span>Google 2FA QR Code</span>
                </div>
                <span className="text-muted text-xs">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  fetchRegistrations()
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-line bg-white hover:bg-slate-50 text-ink font-bold text-[12px] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`text-base ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
                  <span>Refresh Registrations</span>
                </div>
                <span className="text-muted text-xs">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-[12px] hover:bg-red-100 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🚪</span>
                  <span>Logout</span>
                </div>
                <span className="text-red-400 text-xs">→</span>
              </button>
            </div>
          </div>
        )}
      </header>


      {/* Main Content */}
      <main className="shell py-6 sm:py-8 flex-1">
        {/* Alert Feedback Banner */}
        {alert && (
          <div
            className={`mb-6 rounded-xl p-4 text-[13px] font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 ${
              alert.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <span>{alert.message}</span>
            <button
              type="button"
              onClick={() => setAlert(null)}
              className="font-bold text-sm px-2 cursor-pointer opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-line pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('admissions')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
              activeTab === 'admissions'
                ? 'bg-[#090BC2] text-white shadow-xs'
                : 'bg-white text-muted hover:text-ink border border-line'
            }`}
          >
            <span>👥 Student Admissions &amp; Traffic</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                activeTab === 'admissions' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {registrations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
              activeTab === 'curriculum'
                ? 'bg-[#090BC2] text-white shadow-xs'
                : 'bg-white text-muted hover:text-ink border border-line'
            }`}
          >
            <span>📚 Course Curriculum &amp; Videos (app.chat2build.pro)</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                activeTab === 'curriculum' ? 'bg-lemon text-[#080981]' : 'bg-lemon/60 text-[#080981]'
              }`}
            >
              Week 1 &amp; 2
            </span>
          </button>
        </div>

        {activeTab === 'curriculum' ? (
          <CurriculumManager />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="soft-card p-4 sm:p-5 border border-line bg-white shadow-xs">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted">
              Total Registrations
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[24px] sm:text-[28px] font-black text-[#090BC2]">{stats.total}</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Free Enrollment
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted">Online Registrations</p>
          </div>

          <div className="soft-card p-4 sm:p-5 border border-line bg-white shadow-xs">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted">
              Included &amp; Locked
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[24px] sm:text-[28px] font-black text-emerald-600">{stats.included}</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                {stats.total > 0 ? Math.round((stats.included / stats.total) * 100) : 0}% locked
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted">Protected in Database</p>
          </div>

          <div className="soft-card p-4 sm:p-5 border border-line bg-white shadow-xs">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted">
              WhatsApp Invites Sent
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[24px] sm:text-[28px] font-black text-[#2D25EB]">{stats.slackSent}</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Community
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted">Dispatched via Resend</p>
          </div>

          <div className="soft-card p-4 sm:p-5 border border-line bg-white shadow-xs">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted">
              Pending Inclusion
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[24px] sm:text-[28px] font-black text-amber-600">
                {stats.total - stats.included}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Action Needed
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted">Awaiting VA / Admin slide</p>
          </div>
        </div>

        {/* Campaign Acquisition Analytics & Comparison Chart */}
        <div className="soft-card p-5 sm:p-6 border border-line bg-white shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1877F2]">
                  Traffic Attribution
                </span>
                <span className="text-[11px] font-bold text-muted">
                  Total Tracked: {sourceStats.total}
                </span>
              </div>
              <h2 className="text-[17px] sm:text-[19px] font-black text-ink mt-1 tracking-tight">
                Campaign Acquisition: Meta vs Google vs 𝕏
              </h2>
              <p className="text-[11px] text-muted">
                Real-time breakdown of registered students based on marketing campaign query parameters (?sources=meta, ?sources=google, ?sources=x, ?utm_source=X)
              </p>
            </div>

            {filterSource !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterSource('all')}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition cursor-pointer"
              >
                <span>Reset Source Filter ({filterSource.toUpperCase()})</span>
                <span>✕</span>
              </button>
            )}
          </div>

          {/* Proportional Distribution Bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-bold mb-2">
              <span className="text-muted">Channel Split</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[#1877F2]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1877F2]" />
                  Meta ({sourceStats.metaPct}%)
                </span>
                <span className="inline-flex items-center gap-1 text-[#EA4335]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EA4335]" />
                  Google ({sourceStats.googlePct}%)
                </span>
                <span className="inline-flex items-center gap-1 text-neutral-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-900" />
                  𝕏 ({sourceStats.xPct}%)
                </span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  Direct ({sourceStats.directPct}%)
                </span>
              </div>
            </div>

            {/* Stacked Ratio Bar */}
            <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${sourceStats.metaPct}%` }}
                className="h-full bg-[#1877F2] transition-all duration-500"
                title={`Meta: ${sourceStats.meta} (${sourceStats.metaPct}%)`}
              />
              <div
                style={{ width: `${sourceStats.googlePct}%` }}
                className="h-full bg-[#EA4335] transition-all duration-500"
                title={`Google: ${sourceStats.google} (${sourceStats.googlePct}%)`}
              />
              <div
                style={{ width: `${sourceStats.xPct}%` }}
                className="h-full bg-neutral-900 transition-all duration-500"
                title={`𝕏 (Twitter): ${sourceStats.x} (${sourceStats.xPct}%)`}
              />
              <div
                style={{ width: `${sourceStats.directPct}%` }}
                className="h-full bg-slate-400 transition-all duration-500"
                title={`Direct/Other: ${sourceStats.direct} (${sourceStats.directPct}%)`}
              />
            </div>
          </div>

          {/* Interactive Comparison Bar Cards */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Meta Card */}
            <div
              onClick={() => setFilterSource(filterSource === 'meta' ? 'all' : 'meta')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                filterSource === 'meta'
                  ? 'border-[#1877F2] bg-blue-50/70 shadow-md ring-2 ring-[#1877F2]/20'
                  : 'border-blue-100 bg-gradient-to-b from-blue-50/30 to-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1877F2] text-white text-xs font-black shadow-xs">
                    f
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-ink">Meta Campaign</h3>
                    <p className="text-[10px] text-muted">Facebook / Instagram Ads</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/80 text-[#1877F2]">
                  {sourceStats.metaPct}%
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-[28px] font-black text-[#1877F2] tracking-tight">
                  {sourceStats.meta}
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {sourceStats.meta === 1 ? 'student' : 'students'}
                </span>
              </div>

              {/* Visual Indicator */}
              <div className="mt-2.5 h-2 w-full rounded-full bg-blue-100 overflow-hidden">
                <div
                  style={{
                    width: `${
                      sourceStats.maxVal > 0 ? (sourceStats.meta / sourceStats.maxVal) * 100 : 0
                    }%`,
                  }}
                  className="h-full bg-[#1877F2] rounded-full transition-all duration-500"
                />
              </div>

              <div className="mt-3 text-right">
                <span className="text-[10px] font-bold text-[#1877F2]">
                  {filterSource === 'meta' ? '✓ Showing Meta' : 'Click to filter →'}
                </span>
              </div>
            </div>

            {/* Google Card */}
            <div
              onClick={() => setFilterSource(filterSource === 'google' ? 'all' : 'google')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                filterSource === 'google'
                  ? 'border-[#EA4335] bg-red-50/70 shadow-md ring-2 ring-[#EA4335]/20'
                  : 'border-red-100 bg-gradient-to-b from-red-50/30 to-white hover:border-red-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EA4335] text-white text-xs font-black shadow-xs">
                    G
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-ink">Google Campaign</h3>
                    <p className="text-[10px] text-muted">Search / YouTube Ads</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100/80 text-red-600">
                  {sourceStats.googlePct}%
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-[28px] font-black text-[#EA4335] tracking-tight">
                  {sourceStats.google}
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {sourceStats.google === 1 ? 'student' : 'students'}
                </span>
              </div>

              {/* Visual Indicator */}
              <div className="mt-2.5 h-2 w-full rounded-full bg-red-100 overflow-hidden">
                <div
                  style={{
                    width: `${
                      sourceStats.maxVal > 0 ? (sourceStats.google / sourceStats.maxVal) * 100 : 0
                    }%`,
                  }}
                  className="h-full bg-[#EA4335] rounded-full transition-all duration-500"
                />
              </div>

              <div className="mt-3 text-right">
                <span className="text-[10px] font-bold text-red-600">
                  {filterSource === 'google' ? '✓ Showing Google' : 'Click to filter →'}
                </span>
              </div>
            </div>

            {/* 𝕏 (Twitter) Card */}
            <div
              onClick={() => setFilterSource(filterSource === 'x' ? 'all' : 'x')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                filterSource === 'x'
                  ? 'border-neutral-900 bg-neutral-100 shadow-md ring-2 ring-neutral-900/20'
                  : 'border-neutral-200 bg-gradient-to-b from-neutral-50/50 to-white hover:border-neutral-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white text-xs font-black shadow-xs">
                    𝕏
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-ink">𝕏 Campaign</h3>
                    <p className="text-[10px] text-muted">𝕏 / Twitter Ads & Posts</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-900">
                  {sourceStats.xPct}%
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-[28px] font-black text-neutral-900 tracking-tight">
                  {sourceStats.x}
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {sourceStats.x === 1 ? 'student' : 'students'}
                </span>
              </div>

              {/* Visual Indicator */}
              <div className="mt-2.5 h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                <div
                  style={{
                    width: `${
                      sourceStats.maxVal > 0 ? (sourceStats.x / sourceStats.maxVal) * 100 : 0
                    }%`,
                  }}
                  className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                />
              </div>

              <div className="mt-3 text-right">
                <span className="text-[10px] font-bold text-neutral-900">
                  {filterSource === 'x' ? '✓ Showing 𝕏' : 'Click to filter →'}
                </span>
              </div>
            </div>

            {/* Direct / Organic Card */}
            <div
              onClick={() => setFilterSource(filterSource === 'direct' ? 'all' : 'direct')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                filterSource === 'direct'
                  ? 'border-slate-500 bg-slate-100 shadow-md ring-2 ring-slate-400/20'
                  : 'border-slate-200 bg-gradient-to-b from-slate-50 to-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-600 text-white text-xs font-black shadow-xs">
                    🌐
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-ink">Direct / Organic</h3>
                    <p className="text-[10px] text-muted">Direct Links & Referrals</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  {sourceStats.directPct}%
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-[28px] font-black text-slate-700 tracking-tight">
                  {sourceStats.direct}
                </span>
                <span className="text-[11px] font-bold text-muted">
                  {sourceStats.direct === 1 ? 'student' : 'students'}
                </span>
              </div>

              {/* Visual Indicator */}
              <div className="mt-2.5 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  style={{
                    width: `${
                      sourceStats.maxVal > 0 ? (sourceStats.direct / sourceStats.maxVal) * 100 : 0
                    }%`,
                  }}
                  className="h-full bg-slate-500 rounded-full transition-all duration-500"
                />
              </div>

              <div className="mt-3 text-right">
                <span className="text-[10px] font-bold text-slate-600">
                  {filterSource === 'direct' ? '✓ Showing Direct' : 'Click to filter →'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="soft-card p-4 sm:p-5 border border-line bg-white mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, WhatsApp, or reference..."
                className="w-full rounded-xl border border-line bg-[#fafafc] pl-10 pr-4 py-2.5 text-[13px] text-ink placeholder:text-muted/60 focus:border-[#090BC2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#090BC2]/20"
              />
              <span className="absolute left-3.5 top-3 text-muted text-sm">🔍</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-muted hover:text-ink font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-line">
                <button
                  type="button"
                  onClick={() => setFilterIncluded('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    filterIncluded === 'all'
                      ? 'bg-[#090BC2] text-white shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  All ({registrations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterIncluded('included')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    filterIncluded === 'included'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Included ({stats.included})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterIncluded('pending')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    filterIncluded === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Pending ({stats.total - stats.included})
                </button>
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-line">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted px-1 hidden lg:inline">
                  Source:
                </span>
                <button
                  type="button"
                  onClick={() => setFilterSource('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    filterSource === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSource('meta')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition shrink-0 cursor-pointer ${
                    filterSource === 'meta'
                      ? 'bg-[#1877F2] text-white shadow-xs'
                      : 'text-[#1877F2] hover:bg-blue-50'
                  }`}
                >
                  Meta ({sourceStats.meta})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSource('google')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition shrink-0 cursor-pointer ${
                    filterSource === 'google'
                      ? 'bg-[#EA4335] text-white shadow-xs'
                      : 'text-[#EA4335] hover:bg-red-50'
                  }`}
                >
                  Google ({sourceStats.google})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSource('x')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition shrink-0 cursor-pointer ${
                    filterSource === 'x'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  𝕏 ({sourceStats.x})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSource('direct')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 cursor-pointer ${
                    filterSource === 'direct'
                      ? 'bg-slate-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Direct ({sourceStats.direct})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations List Section */}
        <div className="soft-card overflow-hidden border border-line bg-white shadow-card rounded-2xl">
          <div className="p-4 sm:p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-[17px] sm:text-[18px] font-black text-ink">Registered Bootcamp Students</h2>
              <p className="text-[11px] text-muted mt-0.5">
                Confirmed payments verified on Next.js server side with Bachs.
              </p>
            </div>
            <span className="text-[11px] font-bold text-muted">
              Showing {filteredRegistrations.length} of {registrations.length} students
            </span>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-4xl">📋</span>
              <h3 className="mt-3 text-[16px] font-bold text-ink">No registrations found</h3>
              <p className="mt-1 text-[12px] text-muted max-w-sm mx-auto">
                {searchQuery || filterIncluded !== 'all'
                  ? 'No students matched your search criteria. Try resetting the filters.'
                  : 'No verified student payments recorded yet.'}
              </p>
              {(searchQuery || filterIncluded !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterIncluded('all')
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-lavender text-[11px] font-bold text-[#090BC2] hover:bg-[#090BC2]/10 transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (hidden on small screens < md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-line bg-[#fafafc] text-[10px] uppercase font-black tracking-wider text-muted">
                      <th className="py-3.5 px-4">Student Details</th>
                      <th className="py-3.5 px-4">Campaign Source</th>
                      <th className="py-3.5 px-4">Registration &amp; Ref</th>
                      <th className="py-3.5 px-4 text-center">Mark Included</th>
                      <th className="py-3.5 px-4 text-right">WhatsApp Community</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredRegistrations.map((student) => {
                      const isBusy = !!actionLoading[student.id]

                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50/70 transition ${
                            student.isIncluded ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          {/* Student Name & Email */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-ink text-[13px]">{student.fullname}</div>
                            <a
                              href={`mailto:${student.email}`}
                              className="text-muted text-[11px] hover:text-[#090BC2] hover:underline"
                            >
                              {student.email}
                            </a>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-mono text-[11px] text-ink font-semibold">
                                {student.phone_number || 'No phone'}
                              </span>
                              {/* Copy WhatsApp Button */}
                              <button
                                type="button"
                                onClick={() => handleCopyWhatsApp(student)}
                                title="Copy WhatsApp phone number"
                                className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 transition cursor-pointer"
                              >
                                {copiedId === student.id ? (
                                  <span className="text-emerald-600 font-bold">✓ Copied!</span>
                                ) : (
                                  <span>📋 Copy</span>
                                )}
                              </button>
                              {/* Direct WhatsApp Chat Link */}
                              <a
                                href={getWhatsAppLink(student)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat on WhatsApp"
                                className="inline-flex items-center gap-1 rounded bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 transition"
                              >
                                💬 Chat
                              </a>
                            </div>
                          </td>

                          {/* Acquisition Source */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {getSourceBadge(student.source)}
                          </td>

                          {/* Payment & Ref */}
                          <td className="py-4 px-4">
                            <div className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                              <span>✓</span>
                              <span>{student.amount ? `₦${student.amount.toLocaleString()} ${student.currency || 'NGN'}` : '100% Free'}</span>
                            </div>
                            <div className="mt-1 font-mono text-[10px] text-muted truncate max-w-[140px]" title={student.checkout_id}>
                              {student.checkout_id}
                            </div>
                            {student.createdAt && (
                              <div className="text-[10px] text-muted mt-0.5">
                                {safeFormatDateTime(student.createdAt)}
                              </div>
                            )}

                          </td>

                          {/* CHECK SLIDER FOR MARK INCLUDED (Anti-Impersonation Lock) */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={student.isIncluded}
                                  disabled={isBusy}
                                  onChange={() => handleToggleIncluded(student)}
                                />
                                {/* Track */}
                                <div
                                  className={`w-14 h-7 rounded-full transition-all duration-300 ease-in-out border ${
                                    student.isIncluded
                                      ? 'bg-emerald-600 border-emerald-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]'
                                      : 'bg-slate-200 border-slate-300 hover:bg-slate-300'
                                  } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                {/* Slider Knob */}
                                <div
                                  className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out flex items-center justify-center transform ${
                                    student.isIncluded
                                      ? 'translate-x-7 bg-white text-emerald-600'
                                      : 'translate-x-0 text-slate-400'
                                  }`}
                                >
                                  {actionLoading[student.id] === 'include' ? (
                                    <svg className="animate-spin h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                  ) : student.isIncluded ? (
                                    <svg className="h-3.5 w-3.5 stroke-[3.5] text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                  )}
                                </div>
                              </label>

                              {/* Label underneath slider */}
                              <span
                                className={`text-[10px] font-bold tracking-tight uppercase transition ${
                                  student.isIncluded ? 'text-emerald-700' : 'text-slate-500'
                                }`}
                              >
                                {student.isIncluded ? '✓ Included & Saved' : 'Mark Included'}
                              </span>
                            </div>
                          </td>

                          {/* ENHANCED SLACK INVITATION BUTTON */}
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleSendSlackInvite(student)}
                              disabled={isBusy}
                              className={`group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 ${
                                student.slackInviteSent
                                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
                                  : 'bg-[#090BC2] hover:bg-[#080981] text-white hover:shadow-md hover:-translate-y-0.5'
                              }`}
                              title={
                                student.slackInviteSent
                                  ? `WhatsApp community invite already sent on ${safeFormatDateShort(student.slackInviteSentAt)}. Click to resend.`
                                  : 'Send official WhatsApp community invite to student email via Resend'
                              }

                            >
                              {actionLoading[student.id] === 'slack' ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                  <span>Sending...</span>
                                </>
                              ) : student.slackInviteSent ? (
                                <>
                                  <span className="text-emerald-600 font-bold">✓</span>
                                  <span>WhatsApp Sent</span>
                                  <span className="text-[10px] opacity-60 font-medium group-hover:inline hidden">
                                    (Resend)
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm">💬</span>
                                  <span>Send WhatsApp Link</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE RESPONSIVE CARD VIEW (shown on screens < md) */}
              <div className="md:hidden divide-y divide-line">
                {filteredRegistrations.map((student) => {
                  const isBusy = !!actionLoading[student.id]

                  return (
                    <div
                      key={student.id}
                      className={`p-4 transition ${
                        student.isIncluded ? 'bg-emerald-50/20' : 'bg-white'
                      }`}
                    >
                      {/* Top Row: Name, Source Badge, and Enrollment Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[14px] text-ink">{student.fullname}</h3>
                            {getSourceBadge(student.source)}
                          </div>
                          <a
                            href={`mailto:${student.email}`}
                            className="text-muted text-[11px] hover:text-[#090BC2] break-all"
                          >
                            {student.email}
                          </a>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                          {student.amount ? `₦${student.amount.toLocaleString()}` : '100% Free'}
                        </span>
                      </div>

                      {/* Middle Row: Phone & Quick Actions */}
                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-line">
                        <span className="font-mono font-semibold text-ink">
                          {student.phone_number || 'No phone'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyWhatsApp(student)}
                            className="inline-flex items-center gap-1 rounded-md bg-white border border-line px-2 py-1 text-[10px] font-bold text-slate-700 transition cursor-pointer"
                          >
                            {copiedId === student.id ? (
                              <span className="text-emerald-600 font-bold">✓ Copied</span>
                            ) : (
                              <span>📋 Copy</span>
                            )}
                          </button>
                          <a
                            href={getWhatsAppLink(student)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 text-white px-2 py-1 text-[10px] font-bold transition"
                          >
                            💬 WhatsApp
                          </a>
                        </div>
                      </div>

                      {/* Bottom Row: Actions (Check Slider + Send Slack) */}
                      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-3">
                        {/* Check Slider */}
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={student.isIncluded}
                              disabled={isBusy}
                              onChange={() => handleToggleIncluded(student)}
                            />
                            <div
                              className={`w-12 h-6.5 rounded-full transition-all duration-300 ease-in-out border ${
                                student.isIncluded
                                  ? 'bg-emerald-600 border-emerald-700 shadow-inner'
                                  : 'bg-slate-200 border-slate-300'
                              } ${isBusy ? 'opacity-50' : ''}`}
                            />
                            <div
                              className={`absolute left-0.5 top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out flex items-center justify-center transform ${
                                student.isIncluded
                                  ? 'translate-x-5.5 text-emerald-600'
                                  : 'translate-x-0 text-slate-400'
                              }`}
                            >
                              {actionLoading[student.id] === 'include' ? (
                                <svg className="animate-spin h-3 w-3 text-slate-500" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                              ) : student.isIncluded ? (
                                <svg className="h-3 w-3 stroke-[3.5] text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                              )}
                            </div>
                          </label>

                          <div className="text-left">
                            <span className={`text-[11px] font-bold block ${student.isIncluded ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {student.isIncluded ? 'Included' : 'Include'}
                            </span>
                          </div>
                        </div>

                        {/* Enhanced Send WhatsApp Community Button */}
                        <button
                          type="button"
                          onClick={() => handleSendSlackInvite(student)}
                          disabled={isBusy}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-black transition-all shadow-xs disabled:opacity-50 cursor-pointer ${
                            student.slackInviteSent
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                              : 'bg-[#090BC2] text-white hover:bg-[#080981]'
                          }`}
                        >
                          {actionLoading[student.id] === 'slack' ? (
                            <span>Sending...</span>
                          ) : student.slackInviteSent ? (
                            <>
                              <span>✓ WhatsApp Sent</span>
                            </>
                          ) : (
                            <>
                              <span>💬 Send WhatsApp Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </>
    )}
  </main>

      {/* Footer */}
      <footer className="border-t border-line bg-white py-4">
        <div className="shell flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted">
          <span>Chat2Build Admissions Portal • Email powered by Resend (chat2build.pro)</span>
          <span>Payment Gateway: Bachs Infrastructure (Server-Side Confirmed)</span>
        </div>
      </footer>

      {/* Google Authenticator 2FA Modal */}
      {showTotpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-line">
            <div className="h-2 bg-gradient-to-r from-[#090BC2] via-[#2D25EB] to-lemon" />

            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-lemon/40 px-2.5 py-0.5 text-[10px] font-bold text-[#080981]">
                    <span>📱</span> Google Authenticator Setup
                  </span>
                  <h3 className="mt-2 text-[18px] font-bold text-ink">
                    Admin Two-Factor Authentication
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTotpModal(false)}
                  className="h-8 w-8 rounded-lg border border-line flex items-center justify-center text-muted hover:text-ink hover:bg-slate-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="mt-2 text-[12px] text-muted leading-relaxed">
                Scan this QR code with <strong>Google Authenticator</strong> (or Authy) on your phone to generate your 6-digit rotating login codes.
              </p>

              {totpLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#090BC2] border-t-transparent" />
                  <p className="text-xs font-bold text-muted">Generating QR code...</p>
                </div>
              ) : totpQr ? (
                <div className="mt-4 flex flex-col items-center">
                  <div className="p-2.5 bg-white rounded-xl border-2 border-[#090BC2]/30 shadow-md">
                    <img
                      src={totpQr}
                      alt="Google Authenticator QR Code"
                      className="h-48 w-48 rounded-lg object-contain"
                    />
                  </div>

                  <div className="mt-4 w-full bg-slate-50 border border-line rounded-xl p-3 text-left">
                    <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                      Manual Secret Key (Base32):
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono font-bold text-[12px] text-ink select-all break-all">
                        {totpSecret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          if (totpSecret && navigator?.clipboard?.writeText) {
                            navigator.clipboard.writeText(totpSecret)
                            setTotpCopied(true)
                            setTimeout(() => setTotpCopied(false), 2500)
                          }
                        }}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-line text-[11px] font-bold text-[#090BC2] hover:bg-slate-100 transition cursor-pointer"
                      >
                        {totpCopied ? '✓ Copied' : 'Copy Key'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-muted text-center leading-relaxed">
                    Account: <strong>{admin?.email}</strong> • Issuer: <strong>Chat2Build</strong>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-red-600">
                  Failed to load QR code. Please try again.
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowTotpModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#090BC2] text-white text-[12px] font-bold hover:bg-[#080981] transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
