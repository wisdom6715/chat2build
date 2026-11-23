'use client'

import React, { useState, useEffect } from 'react'
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

export default function StudentClassroomPage() {
  const router = useRouter()

  const [student, setStudent] = useState<StudentUser | null>(null)
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [activeClass, setActiveClass] = useState<ClassItem | null>(null)
  const [completedClasses, setCompletedClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [markingProgress, setMarkingProgress] = useState(false)

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

  // Toggle class completion status
  const handleToggleCompleted = async () => {
    if (!activeClass || markingProgress) return
    setMarkingProgress(true)

    const isCurrentlyCompleted = completedClasses.includes(activeClass.id)
    const nextState = !isCurrentlyCompleted

    // Optimistic UI update
    setCompletedClasses((prev) =>
      nextState ? [...prev, activeClass.id] : prev.filter((id) => id !== activeClass.id)
    )

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: activeClass.id,
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

  // Calculate overall course statistics
  const totalClassesCount = modules.reduce((sum, m) => sum + (m.classes?.length || 0), 0)
  const completedCount = completedClasses.length
  const progressPercent = totalClassesCount > 0 ? Math.round((completedCount / totalClassesCount) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafc]">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#090bc2] border-t-transparent mx-auto" />
          <p className="text-xs font-black uppercase tracking-wider text-[#090bc2]">
            Loading your classroom...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col justify-between">
      {/* Top Navbar adhering to Chat2Build brand & Jakub Krehel optical alignment */}
      <header className="border-b border-[#e8e8f0] bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          {/* Logo and Cohort Indicator */}
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#090bc2] text-white font-black text-base shadow-sm">
              C
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-ink">Chat2Build</span>
                <span className="text-[10px] font-black uppercase text-[#090bc2] bg-[#090bc2]/10 border border-[#090bc2]/20 px-2 py-0.5 rounded-full">
                  Student Portal
                </span>
              </div>
              <p className="text-[11px] text-muted">2-Week AI Web App Bootcamp</p>
            </div>
          </div>

          {/* Gamified Course Progress Bar (Center / Desktop) */}
          <div className="hidden md:flex items-center gap-3 bg-[#f7f7fc] px-4 py-2 rounded-2xl border border-[#e8e8f0]">
            <span className="text-base">⭐</span>
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-ink gap-4">
                <span>
                  Progress: {completedCount} of {totalClassesCount} classes completed
                </span>
                <span className="text-[#090bc2] font-black tabular-num">{progressPercent}%</span>
              </div>
              <div className="h-2 w-44 rounded-full bg-slate-200 overflow-hidden mt-1">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-[#090bc2] to-lemon rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>

          {/* Student Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-black text-ink">{student?.name}</span>
              <span className="block text-[10px] text-muted truncate max-w-[150px]">{student?.email}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-[#e8e8f0] bg-white hover:bg-slate-50 text-[11px] font-black text-slate-700 transition cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main 2-Column Classroom Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {modules.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-[#e8e8f0] p-8 max-w-lg mx-auto">
            <span className="text-4xl">🚀</span>
            <h2 className="text-lg font-black text-ink mt-3">Welcome to Your Classroom!</h2>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Your instructor is uploading the Module 1 and Module 2 video lessons and slides right now. Check back shortly or notify your cohort mentor!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ======================================================== */}
            {/* LEFT SIDE: 2/3 SCREEN WIDTH (8 COLS) - THEATER VIDEO     */}
            {/* ======================================================== */}
            <div className="lg:col-span-8 space-y-4">
              {activeClass ? (
                <>
                  {/* Theater Player Card adhering to R_outer = R_inner + padding */}
                  <div className="relative overflow-hidden rounded-3xl border border-[#0c0d1e] bg-[#0c0d1e] p-2.5 sm:p-3 shadow-play">
                    {/* YouTube Video Embed Player */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-inner">
                      {activeClass.embedUrl ? (
                        <iframe
                          key={activeClass.id}
                          src={`${activeClass.embedUrl}?rel=0&modestbranding=1`}
                          title={activeClass.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white/50 text-xs">
                          No video available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Class Meta & Quick Action Bar */}
                  <div className="p-5 sm:p-6 rounded-3xl border border-[#e8e8f0] bg-white shadow-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#090bc2] text-white">
                            Class {activeClass.classNumber}
                          </span>
                          {activeClass.duration && (
                            <span className="text-[11px] font-bold text-muted">
                              ⏱️ {activeClass.duration}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-ink mt-2 leading-snug">
                          {activeClass.title}
                        </h2>
                      </div>

                      {/* Complete / Toggle Button */}
                      <button
                        type="button"
                        onClick={handleToggleCompleted}
                        disabled={markingProgress}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer self-start sm:self-center shrink-0 ${
                          completedClasses.includes(activeClass.id)
                            ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                            : 'bg-lemon text-[#080981] hover:brightness-105 shadow-xs'
                        }`}
                      >
                        <span>{completedClasses.includes(activeClass.id) ? '✓ Completed' : 'Mark as Completed'}</span>
                        <span className="text-sm">⭐</span>
                      </button>
                    </div>

                    {/* Resources & Slides Download Row */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#e8e8f0]">
                      {activeClass.slideUrl ? (
                        <a
                          href={activeClass.slideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#090bc2]/10 hover:bg-[#090bc2]/15 text-[#090bc2] text-xs font-black transition"
                        >
                          <span>📄 Download Presentation Slides (PDF)</span>
                          <span className="text-xs">↗</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted italic">No slide PDF attached for this class</span>
                      )}

                      <a
                        href={activeClass.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-ink text-xs font-bold transition ml-auto"
                      >
                        <span>Watch on YouTube</span>
                        <span>↗</span>
                      </a>
                    </div>

                    {/* Class Notes / Homework if present */}
                    {activeClass.notes && (
                      <div className="p-4 rounded-2xl bg-[#f7f7fc] border border-[#e8e8f0] text-xs space-y-1">
                        <span className="font-black text-[#090bc2] uppercase tracking-wider text-[10px]">
                          Lesson Overview &amp; Exercises
                        </span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{activeClass.notes}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center rounded-3xl bg-white border border-[#e8e8f0]">
                  <p className="text-sm font-bold text-muted">Select a class on the right to start watching.</p>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* RIGHT SIDE: 1/3 SCREEN WIDTH (4 COLS) - MODULES LIST     */}
            {/* ======================================================== */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black uppercase tracking-wider text-muted">
                  Bootcamp Curriculum
                </span>
                <span className="text-[11px] font-black text-[#090bc2] bg-[#090bc2]/10 px-2.5 py-0.5 rounded-full">
                  {modules.length} Modules
                </span>
              </div>

              {/* Modules Accordion */}
              <div className="space-y-4">
                {modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="rounded-3xl border border-[#e8e8f0] bg-white overflow-hidden shadow-card"
                  >
                    {/* Module Header Bar */}
                    <div className="p-4 bg-gradient-to-r from-[#090bc2]/5 to-transparent border-b border-[#e8e8f0]">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#090bc2] text-white">
                          Week {mod.weekNumber}
                        </span>
                        <span className="text-[11px] font-bold text-muted">
                          {mod.classes?.length || 0} classes
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-ink mt-1.5">{mod.title}</h3>
                      {mod.description && (
                        <p className="text-[11px] text-muted line-clamp-1 mt-0.5">{mod.description}</p>
                      )}
                    </div>

                    {/* Classes List */}
                    <div className="p-2 space-y-1.5">
                      {mod.classes && mod.classes.length > 0 ? (
                        mod.classes.map((cls) => {
                          const isActive = activeClass?.id === cls.id
                          const isDone = completedClasses.includes(cls.id)

                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => setActiveClass(cls)}
                              className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between gap-3 cursor-pointer ${
                                isActive
                                  ? 'bg-[#090bc2] text-white shadow-md'
                                  : 'hover:bg-[#f7f7fc] text-ink'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {/* Completion Checkmark Badge */}
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                                    isDone
                                      ? isActive
                                        ? 'bg-lemon text-[#080981]'
                                        : 'bg-emerald-100 text-emerald-800'
                                      : isActive
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {isDone ? '✓' : cls.classNumber}
                                </span>

                                <div className="truncate">
                                  <p
                                    className={`text-xs font-bold truncate ${
                                      isActive ? 'text-white' : 'text-ink'
                                    }`}
                                  >
                                    {cls.title}
                                  </p>
                                  {cls.duration && (
                                    <span
                                      className={`text-[10px] block ${
                                        isActive ? 'text-white/70' : 'text-muted'
                                      }`}
                                    >
                                      ⏱️ {cls.duration}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Play Indicator */}
                              {isActive && (
                                <span className="h-2 w-2 rounded-full bg-lemon animate-ping shrink-0" />
                              )}
                            </button>
                          )
                        })
                      ) : (
                        <p className="text-xs text-muted italic p-3 text-center">Classes coming soon...</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Classroom Footer */}
      <footer className="border-t border-[#e8e8f0] bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted">
          <span>Chat2Build Student Classroom • app.chat2build.pro</span>
          <span>Need tutor debugging assistance? Message our mentor community on WhatsApp!</span>
        </div>
      </footer>
    </div>
  )
}
