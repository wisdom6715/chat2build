'use client'

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getCanvaEmbedUrl } from '../../lib/youtube'

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
  viewCount?: number
  todayViews?: number
}

interface ModuleItem {
  id: string
  courseId?: string
  title: string
  weekNumber: number
  order: number
  description?: string
  classes: ClassItem[]
}

interface CourseItem {
  id: string
  title: string
  description?: string
  introTitle?: string
  introVideoUrl?: string
  introEmbedUrl?: string
  introSlideUrl?: string
  introDuration?: string
  introNotes?: string
  introViewCount?: number
  todayViews?: number
}

interface StudentUser {
  email: string
  name: string
  completedClasses: string[]
}

interface ActiveLesson {
  id: string
  isIntro: boolean
  title: string
  classNumber?: number
  duration?: string
  embedUrl: string
  youtubeUrl: string
  slideUrl?: string
  notes?: string
  viewCount: number
  todayViews: number
}

type TabType = 'overview' | 'qa' | 'notes' | 'slides' | 'announcements'

function ClassroomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseIdParam = searchParams.get('courseId')
  const classIdParam = searchParams.get('classId')

  const [student, setStudent] = useState<StudentUser | null>(null)
  const [course, setCourse] = useState<CourseItem | null>(null)
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null)
  const [completedClasses, setCompletedClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [markingProgress, setMarkingProgress] = useState(false)

  // Layout states (All Light / White Mode)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [userMenuOpen])

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

        // Fetch curriculum for course
        const url = courseIdParam ? `/api/curriculum?courseId=${courseIdParam}` : '/api/curriculum'
        const currRes = await fetch(url)
        const currData = await currRes.json()

        if (currRes.ok) {
          const activeCourse: CourseItem = currData.activeCourse || currData.courses?.[0]
          setCourse(activeCourse)

          if (currData.modules) {
            setModules(currData.modules)

            // Expand all modules by default
            const initialExpanded: Record<string, boolean> = {}
            currData.modules.forEach((m: ModuleItem) => {
              initialExpanded[m.id] = true
            })
            setExpandedModules(initialExpanded)
          }

          // Check if a specific class was requested via URL ?classId=...
          let specificLesson: ActiveLesson | null = null
          if (classIdParam && classIdParam !== 'intro' && currData.modules) {
            for (const m of currData.modules) {
              const matched = (m.classes || []).find((c: ClassItem) => c.id === classIdParam)
              if (matched) {
                specificLesson = {
                  id: matched.id,
                  isIntro: false,
                  title: matched.title,
                  classNumber: matched.classNumber,
                  duration: matched.duration || '',
                  embedUrl: matched.embedUrl,
                  youtubeUrl: matched.youtubeUrl,
                  slideUrl: matched.slideUrl || '',
                  notes: matched.notes || '',
                  viewCount: matched.viewCount || 0,
                  todayViews: matched.todayViews || 0,
                }
                break
              }
            }
          }

          if (specificLesson) {
            setActiveLesson(specificLesson)
          } else if (activeCourse) {
            // Default to Course Introduction Class at the top
            setActiveLesson({
              id: `intro-${activeCourse.id}`,
              isIntro: true,
              title: activeCourse.introTitle || 'Orientation & Course Overview',
              duration: activeCourse.introDuration || '15 mins',
              embedUrl: getCanvaEmbedUrl(activeCourse.introEmbedUrl || activeCourse.introVideoUrl || ''),
              youtubeUrl: activeCourse.introVideoUrl || '',
              slideUrl: activeCourse.introSlideUrl || '',
              notes:
                activeCourse.introNotes ||
                'Welcome to Chat2Build! Watch this orientation class to learn about the schedule, tools, and community.',
              viewCount: activeCourse.introViewCount || 0,
              todayViews: activeCourse.todayViews || 0,
            })
          }
        }
      } catch (err) {
        console.error('Classroom initialization error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [courseIdParam, classIdParam, router])

  // 2. Track Video View when activeLesson changes (Unique person tracking)
  useEffect(() => {
    if (!activeLesson) return

    const recordView = async () => {
      try {
        let deviceId = ''
        try {
          deviceId = localStorage.getItem('c2b_viewer_id') || ''
          if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substring(2, 15)
            localStorage.setItem('c2b_viewer_id', deviceId)
          }
        } catch {}

        const res = await fetch('/api/views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: activeLesson.isIntro ? '' : activeLesson.id,
            courseId: course?.id || '',
            isIntro: activeLesson.isIntro,
            viewerId: student?.email || deviceId,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setActiveLesson((prev) => {
            if (!prev) return null
            return {
              ...prev,
              viewCount: data.viewCount,
              todayViews: data.todayViews,
            }
          })
        }
      } catch (err) {
        // Silently handle
      }
    }

    recordView()
  }, [activeLesson?.id, activeLesson?.isIntro, course?.id, student?.email])

  // Select Introduction Class
  const handleSelectIntro = () => {
    if (!course) return
    setActiveLesson({
      id: `intro-${course.id}`,
      isIntro: true,
      title: course.introTitle || 'Orientation & Course Overview',
      duration: course.introDuration || '15 mins',
      embedUrl: course.introEmbedUrl || '',
      youtubeUrl: course.introVideoUrl || '',
      slideUrl: course.introSlideUrl || '',
      notes: course.introNotes || '',
      viewCount: course.introViewCount || 0,
      todayViews: course.todayViews || 0,
    })
  }

  // Select a Class inside a module
  const handleSelectClass = (cls: ClassItem) => {
    setActiveLesson({
      id: cls.id,
      isIntro: false,
      title: cls.title,
      classNumber: cls.classNumber,
      duration: cls.duration,
      embedUrl: cls.embedUrl,
      youtubeUrl: cls.youtubeUrl,
      slideUrl: cls.slideUrl,
      notes: cls.notes,
      viewCount: cls.viewCount || 0,
      todayViews: cls.todayViews || 0,
    })
  }

  // Toggle Module accordion collapse
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  // Toggle class completion status
  const handleToggleCompleted = async (lessonId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (markingProgress) return
    setMarkingProgress(true)

    const isCurrentlyCompleted = completedClasses.includes(lessonId)
    const nextState = !isCurrentlyCompleted

    // Optimistic UI update
    setCompletedClasses((prev) =>
      nextState ? [...prev, lessonId] : prev.filter((id) => id !== lessonId)
    )

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: lessonId,
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
    navigator.clipboard?.writeText(window.location.href)
    setShareToast(true)
    setTimeout(() => setShareToast(false), 3000)
  }

  // Overall course statistics
  const totalClassesCount = useMemo(
    () => 1 + modules.reduce((sum, m) => sum + (m.classes?.length || 0), 0),
    [modules]
  )
  const completedCount = completedClasses.length
  const progressPercent =
    totalClassesCount > 0 ? Math.round((completedCount / totalClassesCount) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-900">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#090bc2] border-t-transparent mx-auto" />
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Loading Course Classroom...
          </p>
        </div>
      </div>
    )
  }

  const isCurrentCompleted = activeLesson ? completedClasses.includes(activeLesson.id) : false

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#11172f] flex flex-col font-sans">
      {/* ======================================================== */}
      {/* 1. TOP NAV BAR (FULL WHITE / LIGHT MODE)                 */}
      {/* ======================================================== */}
      <header className="bg-white text-slate-900 h-[64px] border-b border-[#e8e8f0] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 select-none shadow-2xs">
        {/* Left: Brand Logo & Course Title & Back Link */}
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href="/courses"
            className="flex items-center gap-2 hover:opacity-85 transition"
            title="Return to Course Catalog"
          >
            <img
              src="/logo.jpg"
              alt="Chat2Build"
              className="h-8 w-8 rounded-lg object-cover shadow-xs"
            />
            <span className="font-black text-sm tracking-tight hidden sm:inline text-slate-900">
              Chat2Build
            </span>
          </Link>

          <span className="text-slate-300 text-base font-light hidden sm:inline">|</span>

          <Link
            href="/courses"
            className="text-xs font-bold text-slate-500 hover:text-[#090bc2] transition flex items-center gap-1 hidden md:flex shrink-0 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg"
          >
            <span>←</span>
            <span>All Courses</span>
          </Link>

          <span className="text-slate-300 text-base font-light hidden md:inline">|</span>

          <h1 className="text-xs sm:text-[13px] font-bold text-slate-800 truncate max-w-[240px] sm:max-w-sm lg:max-w-xl">
            {course?.title || 'Chat2Build — Web App Bootcamp'}
          </h1>
        </div>

        {/* Right: Certificate / Progress, Share, & Profile Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Progress / Certificate Pill */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 border border-slate-200">
            <svg className="w-3.5 h-3.5 text-[#090bc2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="tabular-num">
              {completedCount} / {totalClassesCount} completed ({progressPercent}%)
            </span>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>{shareToast ? 'Link Copied!' : 'Share'}</span>
          </button>

          {/* Toggle Course Content Sidebar Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse course content' : 'Open course content'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 transition cursor-pointer"
          >
            <span>{sidebarOpen ? 'Close list' : 'Course content'}</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-[#090bc2] hover:brightness-110 text-white font-black text-xs cursor-pointer ring-2 ring-slate-100 shadow-xs"
            >
              {student?.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-10 w-56 rounded-xl bg-white border border-[#e8e8f0] shadow-xl p-3 text-ink z-50 text-xs animate-in fade-in duration-100">
                <div className="pb-2 border-b border-[#e8e8f0]">
                  <p className="font-black text-sm truncate">{student?.name}</p>
                  <p className="text-[11px] text-muted truncate">{student?.email}</p>
                </div>
                <div className="pt-2 space-y-1">
                  <Link
                    href="/courses"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-800 font-bold"
                  >
                    <span>My Courses</span>
                    <span>&rarr;</span>
                  </Link>
                  <a
                    href="https://chat.whatsapp.com/JX9whdzwMAdG1NhD5M5XvS?s=cl&p=a&mlu=4&ilr=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-[#090bc2] font-bold"
                  >
                    <span>WhatsApp Community</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M7 7h10v10" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left p-2 rounded-lg hover:bg-red-50 text-red-600 font-bold cursor-pointer"
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
      {/* 2. MAIN WORKSPACE (FULL LIGHT / WHITE MODE)               */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden bg-white">
        {/* ======================================================== */}
        {/* LEFT COLUMN: PLAYER + TABS + OVERVIEW                     */}
        {/* ======================================================== */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 overflow-y-auto ${
            sidebarOpen ? 'lg:w-[68%] xl:w-[72%]' : 'w-full'
          }`}
        >
          {/* Video Player Stage on Clean Backdrop */}
          <div className="bg-slate-950 w-full flex justify-center items-center">
            <div className="w-full max-w-[1400px]">
              <div className="relative aspect-video w-full bg-slate-950">
                {activeLesson && (activeLesson.embedUrl || activeLesson.youtubeUrl) ? (
                  <iframe
                    key={activeLesson.id}
                    loading="lazy"
                    src={getCanvaEmbedUrl(activeLesson.embedUrl || activeLesson.youtubeUrl)}
                    title={activeLesson.title}
                    allow="fullscreen"
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

          {/* Sub-Navigation Tabs Bar */}
          <div className="bg-white border-b border-[#e8e8f0] px-4 sm:px-8">
            <div className="flex items-center gap-6 overflow-x-auto text-[13px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'overview'
                    ? 'border-[#090bc2] text-[#090bc2]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('slides')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'slides'
                    ? 'border-[#090bc2] text-[#090bc2]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Slides &amp; Resources</span>
                {activeLesson?.slideUrl && (
                  <span className="h-2 w-2 rounded-full bg-[#090bc2] animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qa')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'qa'
                    ? 'border-[#090bc2] text-[#090bc2]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Q&amp;A &amp; WhatsApp Mentors
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'notes'
                    ? 'border-[#090bc2] text-[#090bc2]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Notes
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className={`py-3.5 border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'announcements'
                    ? 'border-[#090bc2] text-[#090bc2]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Announcements
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW CONTENT */}
          {activeTab === 'overview' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-6 bg-white">
              {activeLesson ? (
                <>
                  {/* Class Headline & TOP ROW: Title on Left, Slide Button + Completion Button OPPOSITE */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#090bc2] text-white">
                        {activeLesson.isIntro
                          ? 'Course Introduction Class'
                          : `Class ${activeLesson.classNumber || 1}`}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 leading-tight">
                        {activeLesson.title}
                      </h2>
                    </div>

                    {/* OPPOSITE THE TOPIC: Vivid Slide Download Button & Completion Button */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                      {/* VIVID SLIDE DOWNLOAD BUTTON OPPOSITE TOPIC */}
                      {activeLesson.slideUrl ? (
                        <a
                          href={activeLesson.slideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-[#090bc2] hover:bg-[#080981] text-white shadow-md hover:shadow-lg transition cursor-pointer ring-2 ring-[#090bc2]/20"
                          title="Click to view and download presentation slide PDF immediately"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Download Slides</span>
                        </a>
                      ) : null}

                      {/* Completion Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleCompleted(activeLesson.id)}
                        disabled={markingProgress}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                          isCurrentCompleted
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-lemon text-[#080981] hover:brightness-105 shadow-xs'
                        }`}
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>
                          {isCurrentCompleted ? 'Class Completed' : 'Mark as Completed'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Course / Cohort Ratings & Meta Indicators */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500 border-b border-[#e8e8f0] pb-5">
                    <span className="flex items-center gap-1 text-[#b4690e]">
                      <span className="text-sm font-black">5.0</span>
                      <span>★★★★★</span>
                      <span className="text-slate-400 font-normal">(Cohort 1)</span>
                    </span>

                    <span className="flex items-center gap-1.5 text-slate-700">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Active Builders</span>
                    </span>

                    {activeLesson.duration && (
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{activeLesson.duration}</span>
                      </span>
                    )}

                    {/* LIVE VIEWER COUNTER */}
                    <span className="flex items-center gap-1.5 bg-blue-50 text-[#090bc2] px-3 py-1 rounded-lg border border-[#090bc2]/20 font-black">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="tabular-num">{activeLesson.viewCount} viewers</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="tabular-num text-emerald-700 font-black">
                        {activeLesson.todayViews} today
                      </span>
                    </span>
                  </div>

                  {/* About This Class & Lesson Notes */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-black text-slate-900">About this class</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {activeLesson.notes ||
                        'In this session, you learn step-by-step how to conceptualize, design, and deploy full-stack web applications using cutting-edge AI workflows. Watch the video above and follow along in your development environment!'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Please select a class from the course content sidebar to begin learning.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SLIDES & RESOURCES TAB */}
          {activeTab === 'slides' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-6 bg-white">
              <h3 className="text-base font-black text-slate-900">Lecture Slides &amp; Resources</h3>
              {activeLesson?.slideUrl ? (
                <div className="p-6 rounded-2xl bg-white border border-[#e8e8f0] space-y-4 shadow-xs">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#090bc2] text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{activeLesson.title} — Slide Deck</h4>
                        <p className="text-xs text-slate-500">Official lecture slides and architecture blueprints</p>
                      </div>
                    </div>

                    <a
                      href={activeLesson.slideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-lemon hover:brightness-105 text-[#080981] font-black text-xs transition"
                    >
                      <span>Open PDF in New Tab</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 17L17 7M7 7h10v10" />
                      </svg>
                    </a>
                  </div>

                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <iframe
                      src={activeLesson.slideUrl}
                      title="Presentation Slide Deck"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 border border-[#e8e8f0] text-center space-y-2">
                  <p className="text-sm font-bold text-slate-800">No slides attached to this class yet.</p>
                  <p className="text-xs text-slate-500">Check back soon or ask in the WhatsApp group.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Q&A & WHATSAPP MENTORS */}
          {activeTab === 'qa' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-6 bg-white">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-blue-50 border border-emerald-200 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">Official WhatsApp Cohort Group</h3>
                    <p className="text-xs text-slate-600">
                      Connect with mentors, ask technical questions, and troubleshoot alongside other builders.
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <a
                    href="https://chat.whatsapp.com/JX9whdzwMAdG1NhD5M5XvS?s=cl&p=a&mlu=4&ilr=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs"
                  >
                    <span>Join WhatsApp Community</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 17L17 7M7 7h10v10" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTES */}
          {activeTab === 'notes' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-6 bg-white">
              <h3 className="text-base font-black text-slate-900">Personal Class Notes</h3>
              <div className="bg-slate-50 rounded-2xl border border-[#e8e8f0] p-6 space-y-3">
                <p className="text-xs text-slate-500">
                  Take notes during this video class. Notes are kept local to your learning environment.
                </p>
                <textarea
                  rows={8}
                  placeholder="Type your notes, shortcuts, and ideas here..."
                  className="w-full p-4 rounded-xl border border-slate-200 text-xs focus:border-[#090bc2] focus:outline-hidden bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 5: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="p-4 sm:p-8 max-w-4xl space-y-6 bg-white">
              <h3 className="text-base font-black text-slate-900">Cohort Announcements</h3>
              <div className="bg-slate-50 rounded-2xl border border-[#e8e8f0] p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#090bc2]">Welcome to Chat2Build</span>
                  <span className="text-[11px] text-slate-400">Pinned Announcement</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Welcome to the Chat2Build learning platform! Start with the Course Introduction class above to get familiar with our building approach. Live office hours and mentor review sessions are announced in the WhatsApp community.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: FULL WHITE / LIGHT MODE SIDEBAR             */}
        {/* ======================================================== */}
        {sidebarOpen && (
          <aside className="w-full lg:w-[32%] xl:w-[28%] bg-white border-t lg:border-t-0 lg:border-l border-[#e8e8f0] flex flex-col shrink-0 text-slate-900 max-h-[500px] lg:max-h-none overflow-y-auto">
            {/* Sidebar Header (White Mode) */}
            <div className="p-4 border-b border-[#e8e8f0] flex items-center justify-between sticky top-0 bg-white z-10 shadow-2xs">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-slate-900">Course content</h3>
                <span className="text-xs font-semibold text-slate-500">
                  ({completedCount}/{totalClassesCount})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                title="Hide course content"
              >
                ✕
              </button>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 0. COURSE INTRODUCTION CLASS (AT VERY TOP BEFORE WEEKS) */}
            {/* ---------------------------------------------------- */}
            {course && (
              <div className="border-b border-[#e8e8f0] bg-slate-50/80">
                <button
                  type="button"
                  onClick={handleSelectIntro}
                  className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                    activeLesson?.isIntro
                      ? 'bg-blue-50/80 border-l-4 border-[#090bc2]'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  {/* Completion Checkbox for Intro */}
                  <div
                    onClick={(e) => handleToggleCompleted(`intro-${course.id}`, e)}
                    className="mt-0.5 shrink-0 cursor-pointer"
                    title="Mark orientation completed"
                  >
                    <div
                      className={`h-4 w-4 rounded-sm border flex items-center justify-center text-[10px] transition ${
                        completedClasses.includes(`intro-${course.id}`)
                          ? 'bg-[#090bc2] border-[#090bc2] text-white'
                          : 'border-slate-400 bg-white hover:border-slate-600'
                      }`}
                    >
                      {completedClasses.includes(`intro-${course.id}`) && '✓'}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-lemon text-[#080981]">
                        Course Intro
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {course.introTitle || 'Orientation & Course Overview'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                        <span>{course.introDuration || '15 mins'}</span>
                      </span>
                      {course.introSlideUrl && (
                        <span className="text-[#090bc2] font-bold">&bull; Slides</span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* 1. SECTIONS ACCORDION (WEEK 1, WEEK 2, etc.)          */}
            {/* ---------------------------------------------------- */}
            <div className="divide-y divide-[#e8e8f0] flex-1 bg-white">
              {modules.map((mod, modIdx) => {
                const isExpanded = expandedModules[mod.id] ?? true
                const modClasses = mod.classes || []
                const modCompleted = modClasses.filter((c) =>
                  completedClasses.includes(c.id)
                ).length

                return (
                  <div key={mod.id} className="bg-white">
                    {/* Module Accordion Header (Light Mode) */}
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="w-full text-left p-3.5 hover:bg-slate-50 bg-slate-50/50 transition flex items-start justify-between gap-3 cursor-pointer select-none border-b border-slate-100"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          Section {modIdx + 1}: Week {mod.weekNumber} - {mod.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 tabular-num">
                          {modCompleted} / {modClasses.length} completed
                        </p>
                      </div>

                      <span className="text-xs text-slate-400 shrink-0 mt-0.5 font-bold">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {/* Classes inside Section (Light Mode) */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 bg-white">
                        {modClasses.length === 0 ? (
                          <div className="p-4 text-xs text-slate-400 italic">
                            No classes published in this section yet.
                          </div>
                        ) : (
                          modClasses.map((cls) => {
                            const isCurrentActive =
                              !activeLesson?.isIntro && activeLesson?.id === cls.id
                            const isDone = completedClasses.includes(cls.id)

                            return (
                              <button
                                key={cls.id}
                                type="button"
                                onClick={() => handleSelectClass(cls)}
                                className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                                  isCurrentActive
                                    ? 'bg-blue-50/70 border-l-4 border-[#090bc2]'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {/* Checkbox for class completion */}
                                <div
                                  onClick={(e) => handleToggleCompleted(cls.id, e)}
                                  className="mt-0.5 shrink-0 cursor-pointer"
                                  title="Mark class completed"
                                >
                                  <div
                                    className={`h-4 w-4 rounded-sm border flex items-center justify-center text-[10px] transition ${
                                      isDone
                                        ? 'bg-[#090bc2] border-[#090bc2] text-white'
                                        : 'border-slate-300 bg-white hover:border-slate-500'
                                    }`}
                                  >
                                    {isDone && '✓'}
                                  </div>
                                </div>

                                {/* Class Item Details */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-xs font-semibold leading-snug truncate ${
                                      isCurrentActive
                                        ? 'text-[#090bc2] font-black'
                                        : 'text-slate-800'
                                    }`}
                                  >
                                    {cls.classNumber}. {cls.title}
                                  </p>

                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                                    {cls.duration && (
                                      <span className="inline-flex items-center gap-1">
                                        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                        </svg>
                                        <span>{cls.duration}</span>
                                      </span>
                                    )}
                                    {cls.slideUrl && (
                                      <span className="text-[#090bc2] font-bold">&bull; Slides</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })
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

export default function StudentClassroomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white text-slate-900">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#090bc2] border-t-transparent" />
        </div>
      }
    >
      <ClassroomContent />
    </Suspense>
  )
}
