'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  moduleId: string
  title: string
  classNumber: number
  order: number
  youtubeUrl: string
  embedUrl: string
  slideUrl?: string
  duration?: string
  notes?: string
}

interface ModuleItem {
  id: string
  title: string
  weekNumber: number
  order: number
  description?: string
  classes: ClassItem[]
}

interface StudentUser {
  email: string
  name: string
  completedClasses: string[]
}

type TabType = 'overview' | 'qa' | 'notes' | 'slides' | 'announcements'

export default function StudentClassroomPage() {
  const router = useRouter()

  const [student, setStudent] = useState<StudentUser | null>(null)
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [activeClass, setActiveClass] = useState<ClassItem | null>(null)
  const [completedClasses, setCompletedClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [markingProgress, setMarkingProgress] = useState(false)

  // Udemy-style Layout states
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [shareToast, setShareToast] = useState(false)

  // 1. Authenticate & load curriculum
  useEffect(() => {
    const init = async () => {
      try {
        // Verify session
        const authRes = await fetch('/api/auth/me')
        const authData = await authRes.json()

        if (!authRes.ok || !authData.authenticated) {
          router.replace('/')
          return
        }

        setStudent({
          email: authData.email,
          name: authData.name || 'Builder',
          completedClasses: authData.completedClasses || [],
        })
        setCompletedClasses(authData.completedClasses || [])

        // Fetch curriculum
        const currRes = await fetch('/api/curriculum')
        const currData = await currRes.json()

        if (currRes.ok && currData.modules) {
          setModules(currData.modules)

          // Expand all modules by default
          const initialExpanded: Record<string, boolean> = {}
          currData.modules.forEach((m: ModuleItem) => {
            initialExpanded[m.id] = true
          })
          setExpandedModules(initialExpanded)

          // Find first class to activate
          for (const m of currData.modules) {
            if (m.classes && m.classes.length > 0) {
              setActiveClass(m.classes[0])
              break
            }
          }
        }
      } catch (err) {
        console.error('Initialization error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  // Toggle Module accordion collapse
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  // Toggle class completion status
  const handleToggleCompleted = async (classId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (markingProgress) return
    setMarkingProgress(true)

    const isCurrentlyCompleted = completedClasses.includes(classId)
    const nextState = !isCurrentlyCompleted

    // Optimistic UI update
    setCompletedClasses((prev) =>
      nextState ? [...prev, classId] : prev.filter((id) => id !== classId)
    )

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          completed: nextState,
        }),
      })
      const data = await res.json()
      if (res.ok && data.completedClasses) {
        setCompletedClasses(data.completedClasses)
      }
    } catch (err) {
      console.error('Failed to update progress', err)
    } finally {
      setMarkingProgress(false)
    }
  }

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    router.replace('/')
  }

  // Share portal link
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.origin)
    setShareToast(true)
    setTimeout(() => setShareToast(false), 3000)
  }

  // Calculate overall course statistics
  const totalClassesCount = useMemo(
    () => modules.reduce((sum, m) => sum + (m.classes?.length || 0), 0),
    [modules]
  )
  const completedCount = completedClasses.length
  const progressPercent =
    totalClassesCount > 0 ? Math.round((completedCount / totalClassesCount) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1c1d1f] text-white">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-lemon border-t-transparent mx-auto" />
          <p className="text-xs font-black uppercase tracking-wider text-slate-300">
            Loading Course Classroom...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#11172f] flex flex-col font-sans">
      {/* ======================================================== */}
      {/* 1. TOP UDEMY-STYLE NAV BAR (#1c1d1f / Dark Theater Bar)  */}
      {/* ======================================================== */}
      <header className="bg-[#1c1d1f] text-white h-[60px] border-b border-[#2d2f31] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 select-none">
        {/* Left: Brand Logo & Course Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#090bc2] text-white font-black text-xs shadow-sm">
              C
            </span>
            <span className="font-bold text-sm tracking-tight hidden sm:inline text-white">
              Chat2Build
            </span>
          </div>

          <span className="text-[#3e4143] text-base font-light hidden sm:inline">|</span>

          <h1 className="text-xs sm:text-[13px] font-semibold text-slate-200 truncate max-w-[280px] sm:max-w-md lg:max-w-xl">
            Chat2Build — Build Your First Web App with AI (2-Week Intensive Bootcamp)
          </h1>
        </div>

        {/* Right: Certificate / Progress, Share, & Profile Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Progress / Certificate Pill */}
          <div className="hidden md:flex items-center gap-2 bg-[#2d2f31] px-3 py-1.5 rounded-full text-xs font-semibold text-slate-200">
            <span className="text-sm">🏆</span>
            <span className="tabular-num">
              {completedCount} / {totalClassesCount} completed ({progressPercent}%)
            </span>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#3e4143] hover:bg-[#2d2f31] text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>{shareToast ? 'Link Copied! ✓' : 'Share'}</span>
          </button>

          {/* Toggle Course Content Sidebar Button (Mobile & Desktop) */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse course content' : 'Open course content'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2d2f31] hover:bg-[#3e4143] text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            <span>{sidebarOpen ? '✕ Close list' : '☰ Course content'}</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-[#090bc2] hover:brightness-110 text-white font-black text-xs cursor-pointer ring-2 ring-white/10"
            >
              {student?.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-10 w-56 rounded-xl bg-white border border-[#e8e8f0] shadow-2xl p-3 text-ink z-50 text-xs animate-in fade-in duration-100">
                <div className="pb-2 border-b border-[#e8e8f0]">
                  <p className="font-black text-sm truncate">{student?.name}</p>
                  <p className="text-[11px] text-muted truncate">{student?.email}</p>
                </div>
                <div className="pt-2 space-y-1">
                  <a
                    href="https://chat.whatsapp.com/JX9whdzwMAdG1NhD5M5XvS?s=cl&p=a&mlu=4&ilr=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-[#090bc2] font-bold"
                  >
                    <span>💬 WhatsApp Community</span>
                    <span>↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left p-2 rounded-lg hover:bg-red-50 text-red-600 font-bold"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN LMS WORKSPACE (LEFT PLAYER + RIGHT SIDEBAR)       */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* ======================================================== */}
        {/* LEFT COLUMN: THEATER VIDEO + TABS + OVERVIEW             */}
        {/* ======================================================== */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 overflow-y-auto ${
            sidebarOpen ? 'lg:w-[70%] xl:w-[73%]' : 'w-full'
          }`}
        >
          {/* Cinematic Dark Stage for YouTube Embed */}
          <div className="bg-black w-full flex justify-center items-center shadow-lg">
            <div className="w-full max-w-[1400px]">
              <div className="relative aspect-video w-full bg-black">
                {activeClass?.embedUrl ? (
                  <iframe
                    key={activeClass.id}
                    src={`${activeClass.embedUrl}?autoplay=0&rel=0&modestbranding=1`}
                    title={activeClass.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                    No video class selected
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs Bar (Udemy Style) */}
          <div className="bg-white border-b border-[#e8e8f0] px-4 sm:px-8">
            <div className="flex items-center gap-6 overflow-x-auto text-[13px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'overview'
                    ? 'border-[#11172f] text-[#11172f]'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('slides')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'slides'
                    ? 'border-[#11172f] text-[#11172f]'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                <span>Slides &amp; Resources</span>
                {activeClass?.slideUrl && (
                  <span className="h-2 w-2 rounded-full bg-lemon animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qa')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'qa'
                    ? 'border-[#11172f] text-[#11172f]'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Q&amp;A &amp; WhatsApp Mentors
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'notes'
                    ? 'border-[#11172f] text-[#11172f]'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Notes
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'announcements'
                    ? 'border-[#11172f] text-[#11172f]'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Announcements
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW CONTENT */}
          {activeTab === 'overview' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-6">
              {activeClass ? (
                <>
                  {/* Class Headline & Completion Button */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#090bc2] text-white">
                        Class {activeClass.classNumber}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-ink mt-2 leading-tight">
                        {activeClass.title}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(activeClass.id)}
                      disabled={markingProgress}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        completedClasses.includes(activeClass.id)
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'bg-lemon text-[#080981] hover:brightness-105 shadow-xs'
                      }`}
                    >
                      <span>
                        {completedClasses.includes(activeClass.id)
                          ? '✓ Class Completed'
                          : 'Mark as Completed'}
                      </span>
                      <span>⭐</span>
                    </button>
                  </div>

                  {/* Course / Cohort Ratings & Meta Indicators (Udemy Style) */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-muted border-b border-[#e8e8f0] pb-5">
                    <span className="flex items-center gap-1 text-[#b4690e]">
                      <span className="text-sm font-black">5.0</span>
                      <span>★★★★★</span>
                      <span className="text-muted font-normal">(Cohort 1)</span>
                    </span>

                    <span className="flex items-center gap-1 text-ink">
                      <span>👥</span>
                      <span>Active Builders</span>
                    </span>

                    {activeClass.duration && (
                      <span className="flex items-center gap-1 text-ink">
                        <span>⏱️</span>
                        <span>{activeClass.duration}</span>
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-slate-500">
                      <span>🗓️</span>
                      <span>November 2026 Immersion</span>
                    </span>
                  </div>

                  {/* Slide Download Banner */}
                  {activeClass.slideUrl && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-white border border-[#090bc2]/20 flex items-center justify-between gap-4 shadow-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#090bc2] text-white text-base shrink-0">
                          📄
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-ink">Presentation Slides (PDF)</h4>
                          <p className="text-[11px] text-muted">
                            Review lecture slides, component diagrams, and reference architectures.
                          </p>
                        </div>
                      </div>

                      <a
                        href={activeClass.slideUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#090bc2] hover:bg-[#080981] text-white text-xs font-black transition shrink-0"
                      >
                        <span>Download PDF</span>
                        <span>↓</span>
                      </a>
                    </div>
                  )}

                  {/* Class Notes / Overview Text */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-black text-ink">About this class</h3>
                    {activeClass.notes ? (
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {activeClass.notes}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        In this session, you learn step-by-step how to conceptualize, design, and deploy full-stack web applications using cutting-edge AI workflows. Watch the video above and follow along in your development environment!
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted text-xs">
                  Select a class from the course content sidebar to view details.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SLIDES & RESOURCES */}
          {activeTab === 'slides' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-6">
              <h3 className="text-lg font-black text-ink">Lesson Slides &amp; Resources</h3>
              {activeClass?.slideUrl ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📑</span>
                      <div>
                        <h4 className="text-sm font-black text-ink">{activeClass.title} — Slide Deck</h4>
                        <p className="text-xs text-muted mt-0.5">
                          Official PDF slides with code snippets and design references.
                        </p>
                      </div>
                    </div>

                    <a
                      href={activeClass.slideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="primary-button py-2.5 px-4 text-xs font-black shrink-0"
                    >
                      <span>Open Slide Deck (PDF)</span>
                      <span>↗</span>
                    </a>
                  </div>

                  {/* Embedded PDF Viewer if valid URL */}
                  <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-line bg-slate-100 shadow-inner">
                    <iframe
                      src={activeClass.slideUrl}
                      title="Slide Preview"
                      className="h-full w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center rounded-2xl bg-white border border-line p-6">
                  <span className="text-3xl">📄</span>
                  <p className="text-xs font-bold text-muted mt-2">
                    No PDF slides uploaded for this class yet. Watch the video above!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Q&A & COMMUNITY */}
          {activeTab === 'qa' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-[#090bc2]/10 to-transparent border border-emerald-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💬</span>
                  <div>
                    <h3 className="text-base font-black text-ink">Official Student WhatsApp Community</h3>
                    <p className="text-xs text-muted">
                      Direct 24/7 access to mentors, live Q&amp;A sessions, code debugging, and cohort peers.
                    </p>
                  </div>
                </div>

                <a
                  href="https://chat.whatsapp.com/JX9whdzwMAdG1NhD5M5XvS?s=cl&p=a&mlu=4&ilr=4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition"
                >
                  <span>👉 Join Student WhatsApp Group</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: NOTES */}
          {activeTab === 'notes' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-4">
              <h3 className="text-lg font-black text-ink">Your Personal Notes</h3>
              <p className="text-xs text-muted">
                Keep quick timestamps and code snippets handy while watching lessons.
              </p>
              <textarea
                rows={6}
                placeholder="Type your notes for this class here..."
                className="w-full rounded-2xl border border-line p-4 text-xs text-ink focus:border-[#090bc2] focus:outline-none"
              />
            </div>
          )}

          {/* TAB 5: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-4">
              <h3 className="text-lg font-black text-ink">Cohort Announcements</h3>
              <div className="p-4 rounded-2xl bg-white border border-line text-xs space-y-1">
                <div className="flex items-center justify-between text-muted text-[10px] font-bold">
                  <span>Chat2Build Admissions</span>
                  <span>November 2026</span>
                </div>
                <h4 className="font-black text-ink text-sm">Welcome to Cohort 1! 🎉</h4>
                <p className="text-slate-600 leading-relaxed pt-1">
                  Classes are structured into 2 intensive immersion weeks. Complete Week 1 to unlock the full-stack database and AI integration exercises in Week 2!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: UDEMY-STYLE COURSE CONTENT SIDEBAR          */}
        {/* ======================================================== */}
        {sidebarOpen && (
          <aside className="w-full lg:w-[30%] xl:w-[27%] bg-white border-l border-[#e8e8f0] flex flex-col h-[500px] lg:h-auto overflow-y-auto shrink-0 shadow-xs">
            {/* Sidebar Header Bar */}
            <div className="p-4 border-b border-[#e8e8f0] flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-sm font-black text-ink">Course content</h2>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 text-xs font-bold cursor-pointer"
                title="Collapse sidebar"
              >
                ✕
              </button>
            </div>

            {/* Sections Accordion */}
            <div className="divide-y divide-[#e8e8f0]">
              {modules.map((mod, modIdx) => {
                const isExpanded = expandedModules[mod.id] ?? true
                const modClasses = mod.classes || []
                const modCompletedCount = modClasses.filter((c) =>
                  completedClasses.includes(c.id)
                ).length

                return (
                  <div key={mod.id} className="bg-white">
                    {/* Section Header Button */}
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="w-full p-4 text-left bg-[#f7f7fc] hover:bg-slate-100/80 transition flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <h3 className="text-xs font-black text-ink leading-snug">
                          Section {modIdx + 1}: Week {mod.weekNumber} - {mod.title}
                        </h3>
                        <p className="text-[11px] text-muted tabular-num">
                          {modCompletedCount} / {modClasses.length} completed
                        </p>
                      </div>

                      <span
                        className={`text-slate-400 text-xs font-bold transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </button>

                    {/* Classes in Section */}
                    {isExpanded && (
                      <div className="divide-y divide-[#f0f0f5]">
                        {modClasses.length > 0 ? (
                          modClasses.map((cls) => {
                            const isActive = activeClass?.id === cls.id
                            const isDone = completedClasses.includes(cls.id)

                            return (
                              <div
                                key={cls.id}
                                onClick={() => setActiveClass(cls)}
                                className={`p-3.5 pl-4 transition flex items-start gap-3 cursor-pointer select-none ${
                                  isActive
                                    ? 'bg-[#f0f0fa] border-l-4 border-[#090bc2]'
                                    : 'hover:bg-[#fafafc]'
                                }`}
                              >
                                {/* Interactive Checkbox */}
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={(e) => handleToggleCompleted(cls.id, e as any)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-0.5 h-4 w-4 rounded text-[#090bc2] focus:ring-[#090bc2] cursor-pointer"
                                />

                                {/* Class Info */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-xs leading-snug ${
                                      isActive
                                        ? 'font-black text-[#090bc2]'
                                        : isDone
                                        ? 'text-slate-600'
                                        : 'font-semibold text-ink'
                                    }`}
                                  >
                                    {cls.classNumber}. {cls.title}
                                  </p>

                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                                    <span className="flex items-center gap-1">
                                      <span>▶</span>
                                      <span>{cls.duration || 'Video'}</span>
                                    </span>
                                    {cls.slideUrl && (
                                      <span className="text-[#090bc2] font-bold">
                                        • 📄 Slides
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="p-3 text-center text-[11px] text-muted italic">
                            No classes uploaded yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
