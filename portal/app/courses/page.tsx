'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ClassItem {
  id: string
  moduleId: string
  title: string
  classNumber: number
  order: number
  youtubeUrl: string
  embedUrl: string
  thumbnailUrl?: string
  slideUrl?: string
  duration?: string
  notes?: string
  viewCount?: number
  todayViews?: number
}

interface ModuleItem {
  id: string
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
  thumbnailUrl?: string
  introTitle?: string
  introVideoUrl?: string
  introEmbedUrl?: string
  introSlideUrl?: string
  introDuration?: string
  introNotes?: string
  introViewCount?: number
  todayViews?: number
  moduleCount?: number
  totalLessons?: number
  modules?: ModuleItem[]
}

interface StudentUser {
  email: string
  name: string
  completedClasses: string[]
}

export default function StudentCoursesPage() {
  const router = useRouter()
  const [student, setStudent] = useState<StudentUser | null>(null)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [expandedCourseModules, setExpandedCourseModules] = useState<Record<string, boolean>>({})

  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      try {
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

        const currRes = await fetch('/api/curriculum')
        const currData = await currRes.json()

        if (currRes.ok && currData.courses) {
          setCourses(currData.courses)

          // Expand all course modules by default
          const initialExpanded: Record<string, boolean> = {}
          currData.courses.forEach((c: CourseItem) => {
            (c.modules || []).forEach((m) => {
              initialExpanded[`${c.id}-${m.id}`] = true
            })
          })
          setExpandedCourseModules(initialExpanded)
        }
      } catch (err) {
        console.error('Failed to load student courses:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.replace('/')
    }
  }

  const scrollCarouselRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 360, behavior: 'smooth' })
    }
  }

  const toggleCourseModule = (courseId: string, modId: string) => {
    const key = `${courseId}-${modId}`
    setExpandedCourseModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Get Initials for Avatar (e.g. "Olayiwola" -> "OI", "Wisdom" -> "WI")
  const getInitials = (name?: string) => {
    if (!name) return 'OI'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Find quick resume lessons for the "Let's start learning" carousel
  const carouselItems = React.useMemo(() => {
    const items: Array<{
      id: string
      courseId: string
      courseTitle: string
      lessonTitle: string
      duration: string
      type: 'lecture' | 'slide'
      thumbnailUrl?: string
      slideUrl?: string
      classId?: string
    }> = []

    courses.forEach((course) => {
      // 1. Course Introduction Class
      items.push({
        id: `intro-${course.id}`,
        courseId: course.id,
        courseTitle: course.title,
        lessonTitle: course.introTitle || 'Orientation & Course Overview',
        duration: course.introDuration || '15m',
        type: 'lecture',
        thumbnailUrl: course.thumbnailUrl,
        slideUrl: course.introSlideUrl,
        classId: 'intro',
      })

      // 2. Each Class inside modules
      ;(course.modules || []).forEach((mod) => {
        (mod.classes || []).forEach((cls) => {
          items.push({
            id: cls.id,
            courseId: course.id,
            courseTitle: course.title,
            lessonTitle: `Day ${cls.classNumber} - ${cls.title}`,
            duration: cls.duration ? cls.duration.replace('mins', 'm').replace('min', 'm') : '10m',
            type: 'lecture',
            thumbnailUrl: cls.thumbnailUrl || course.thumbnailUrl,
            slideUrl: cls.slideUrl,
            classId: cls.id,
          })
        })
      })

      // 3. Slide deck card
      if (course.introSlideUrl) {
        items.push({
          id: `slides-${course.id}`,
          courseId: course.id,
          courseTitle: 'Chat2Build Curriculum Slides',
          lessonTitle: 'Quick Note: Presentation Slides & Blueprints',
          duration: '1m',
          type: 'slide',
          slideUrl: course.introSlideUrl,
          classId: 'intro',
        })
      }
    })

    return items
  }, [courses])

  const firstName = student?.name ? student.name.split(' ')[0].toLowerCase() : 'builder'

  return (
    <div className="min-h-screen bg-white text-[#11172f] flex flex-col font-sans selection:bg-[#090bc2] selection:text-white">
      {/* 1. TOP NAV BAR (FULL WHITE / LIGHT MODE) */}
      <header className="h-16 bg-white border-b border-[#e8e8f0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/courses" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#090bc2] text-white font-black text-sm shadow-xs">
              C2B
            </div>
            <span className="text-base font-black tracking-tight text-slate-900 hidden sm:inline">
              Chat2Build <span className="text-[#090bc2]">LMS</span>
            </span>
          </Link>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">Student Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          {/* WhatsApp Community Link */}
          <a
            href="https://chat.whatsapp.com/JX9whdzwMAdG1NhD5M5XvS?s=cl&p=a&mlu=4&ilr=4"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition border border-emerald-200"
          >
            <span>💬 Community</span>
            <span>↗</span>
          </a>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white font-black text-xs ring-2 ring-slate-100 shadow-xs">
                {getInitials(student?.name)}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden md:inline truncate max-w-[120px]">
                {student?.name || 'Student'}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-11 w-56 rounded-xl bg-white border border-[#e8e8f0] shadow-xl p-3 z-50 text-xs animate-in fade-in">
                <div className="pb-2 border-b border-[#e8e8f0]">
                  <p className="font-black text-sm truncate text-slate-900">{student?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{student?.email}</p>
                </div>
                <div className="pt-2 space-y-1">
                  <a
                    href="https://chat.whatsapp.com/JX9whdzwMAdG1NhD5M5XvS?s=cl&p=a&mlu=4&ilr=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-[#090bc2] font-bold"
                  >
                    <span>💬 WhatsApp Group</span>
                    <span>↗</span>
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

      {/* 2. USER GREETING HEADER (EXACTLY MATCHING USER SCREENSHOT) */}
      <section className="bg-white border-b border-[#e8e8f0] pt-8 pb-6 px-4 sm:px-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Black Avatar Circle with Bold Initials */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-white font-black text-base shadow-xs select-none">
            {getInitials(student?.name)}
          </div>

          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome back, {firstName}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span>Full Stack Web Developer</span>
              <span className="text-[#6b21a8] hover:underline font-semibold cursor-pointer">
                Edit occupation and interests
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "LET'S START LEARNING" HORIZONTAL CAROUSEL (UDEMY STYLE FROM USER SCREENSHOT) */}
      <section className="bg-white py-8 px-4 sm:px-10 border-b border-[#e8e8f0]">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Let&apos;s start learning
            </h2>
            <Link
              href="#courses-section"
              className="text-sm font-bold text-[#6b21a8] hover:underline"
            >
              My learning
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400">Loading lessons...</div>
          ) : carouselItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No classes found yet.</div>
          ) : (
            <div className="relative">
              {/* Horizontal Scroll Track */}
              <div
                ref={carouselRef}
                className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
              >
                {carouselItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/classroom?courseId=${item.courseId}${item.classId ? `&classId=${item.classId}` : ''}`}
                    className="flex shrink-0 w-[320px] sm:w-[360px] h-[105px] border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition group cursor-pointer overflow-hidden rounded-xs"
                  >
                    {/* Left Thumbnail or Icon with Play Button */}
                    <div className="w-[110px] sm:w-[125px] h-full shrink-0 relative bg-slate-900 flex items-center justify-center overflow-hidden">
                      {item.type === 'slide' ? (
                        <div className="w-full h-full bg-[#e0e7ff] flex items-center justify-center text-2xl text-[#4338ca]">
                          📄
                        </div>
                      ) : item.thumbnailUrl ? (
                        <>
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <div className="h-9 w-9 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition">
                              <span className="text-xs ml-0.5 font-black">▶</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <div className="h-9 w-9 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition">
                            <span className="text-xs ml-0.5 font-black">▶</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Info Details */}
                    <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {item.courseTitle}
                        </p>
                        <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#090bc2] transition">
                          {item.lessonTitle}
                        </h3>
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium">
                        {item.type === 'slide' ? 'Article • 1m' : `Lecture • ${item.duration}`}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Next Arrow Button (like Udemy screenshot) */}
              {carouselItems.length > 2 && (
                <button
                  type="button"
                  onClick={scrollCarouselRight}
                  className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-300 shadow-md text-slate-800 hover:bg-slate-50 cursor-pointer z-10 transition hover:scale-105"
                  title="Scroll right"
                >
                  <span className="text-base font-bold">›</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. FULL COURSES & CLASS SELECTOR LIST (CHOOSE CLASS TO WATCH) */}
      <main id="courses-section" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-10 py-10 space-y-8 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              All Courses &amp; Curriculum
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any class below to start watching immediately.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
          </span>
        </div>

        {courses.map((course) => {
          const courseMods = course.modules || []

          return (
            <div
              key={course.id}
              className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden space-y-0"
            >
              {/* Course Main Banner Header */}
              <div className="p-6 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#090bc2] text-white">
                      Bootcamp Course
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Enrolled
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {course.description ||
                      'Learn step-by-step how to conceptualize, design, and deploy full-stack web applications using cutting-edge AI workflows.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-1">
                    <span>📚 {course.moduleCount || courseMods.length} Weeks</span>
                    <span>•</span>
                    <span>🎥 {course.totalLessons || 7} Classes</span>
                  </div>
                </div>

                <Link
                  href={`/classroom?courseId=${course.id}&classId=intro`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-lemon hover:brightness-105 text-[#080981] font-black text-xs transition shadow-xs cursor-pointer shrink-0"
                >
                  <span>Start Course ▶</span>
                </Link>
              </div>

              {/* 1. TOP PINNED: COURSE INTRODUCTION & ORIENTATION CLASS */}
              <div className="p-4 sm:p-5 bg-blue-50/40 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#090bc2] text-white text-base shrink-0 font-bold shadow-xs">
                      ⭐
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-lemon text-[#080981]">
                          Intro Class
                        </span>
                        <h4 className="text-sm font-black text-slate-900">
                          {course.introTitle || 'Orientation & Course Overview'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>⏱️ {course.introDuration || '15 mins'}</span>
                        {course.introSlideUrl && (
                          <span className="text-[#090bc2] font-bold">• 📄 PDF Slides</span>
                        )}
                        {/* Live viewer count: 👁️ 0 viewers • 0 today */}
                        <span className="font-bold text-[#090bc2]">
                          • 👁️ {course.introViewCount || 0} viewers • {course.todayViews || 0} today
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {course.introSlideUrl && (
                      <a
                        href={course.introSlideUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
                      >
                        📄 Slides PDF
                      </a>
                    )}
                    <Link
                      href={`/classroom?courseId=${course.id}&classId=intro`}
                      className="px-4 py-2 rounded-lg bg-[#090bc2] hover:bg-[#080981] text-white text-xs font-black transition cursor-pointer shadow-xs"
                    >
                      Watch Intro ▶
                    </Link>
                  </div>
                </div>
              </div>

              {/* 2. SECTIONS & CLASSES BREAKDOWN */}
              <div className="divide-y divide-slate-200">
                {courseMods.map((mod, modIdx) => {
                  const key = `${course.id}-${mod.id}`
                  const isExpanded = expandedCourseModules[key] ?? true
                  const classes = mod.classes || []

                  return (
                    <div key={mod.id} className="bg-white">
                      {/* Week Header Accordion */}
                      <button
                        type="button"
                        onClick={() => toggleCourseModule(course.id, mod.id)}
                        className="w-full text-left p-4 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer select-none bg-slate-50/30"
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            Section {modIdx + 1}: Week {mod.weekNumber} - {mod.title}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {classes.length} classes available in this module
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 font-bold">
                          {isExpanded ? '▲ Collapse' : '▼ View Classes'}
                        </span>
                      </button>

                      {/* Classes in Week */}
                      {isExpanded && (
                        <div className="divide-y divide-slate-100 bg-white">
                          {classes.length === 0 ? (
                            <div className="p-4 text-xs text-slate-400 italic">
                              No classes published in this section yet.
                            </div>
                          ) : (
                            classes.map((cls) => {
                              const isDone = student?.completedClasses?.includes(cls.id)

                              return (
                                <div
                                  key={cls.id}
                                  className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`h-5 w-5 rounded-sm border flex items-center justify-center text-[10px] mt-0.5 shrink-0 ${
                                        isDone
                                          ? 'bg-[#090bc2] border-[#090bc2] text-white'
                                          : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {isDone && '✓'}
                                    </div>

                                    <div>
                                      <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                                        Class {cls.classNumber}: {cls.title}
                                      </h5>
                                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                                        {cls.duration && <span>⏱️ {cls.duration}</span>}
                                        {cls.slideUrl && (
                                          <span className="text-[#090bc2] font-semibold">
                                            • 📄 Slides Attached
                                          </span>
                                        )}
                                        {/* Viewer metrics: 👁️ 0 viewers • 0 today */}
                                        <span className="font-semibold text-slate-700">
                                          • 👁️ {cls.viewCount || 0} viewers • {cls.todayViews || 0} today
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                    {cls.slideUrl && (
                                      <a
                                        href={cls.slideUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                                      >
                                        Slides 📄
                                      </a>
                                    )}
                                    <Link
                                      href={`/classroom?courseId=${course.id}&classId=${cls.id}`}
                                      className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-[#090bc2] text-white text-xs font-bold transition cursor-pointer"
                                    >
                                      Watch Class ▶
                                    </Link>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-[#e8e8f0] py-6 px-4 text-center text-xs text-slate-400">
        <p>© 2026 Chat2Build LMS Portal. Pure light mode learning platform.</p>
      </footer>
    </div>
  )
}
