'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CourseItem {
  id: string
  title: string
  description?: string
  thumbnailUrl?: string
  introTitle?: string
  introDuration?: string
  moduleCount?: number
  totalLessons?: number
  todayViews?: number
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

  const completedCount = student?.completedClasses?.length || 0

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col font-sans text-ink selection:bg-[#090bc2] selection:text-white">
      {/* 1. TOP HEADER */}
      <header className="h-16 bg-white border-b border-[#e8e8f0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/courses" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#090bc2] text-white font-black text-sm shadow-sm">
              C2B
            </div>
            <span className="text-base font-black tracking-tight text-ink hidden sm:inline">
              Chat2Build <span className="text-[#090bc2]">LMS</span>
            </span>
          </Link>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs font-bold text-muted hidden sm:inline">Student Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          {/* WhatsApp Community Link */}
          <a
            href="https://chat.whatsapp.com/JX9whdzwMAdG1NhD5M5XvS?s=cl&p=a&mlu=4&ilr=4"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition"
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#090bc2] text-white font-black text-xs ring-2 ring-white shadow-xs">
                {student?.name ? student.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden md:inline truncate max-w-[120px]">
                {student?.name || 'Student'}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-11 w-56 rounded-xl bg-white border border-[#e8e8f0] shadow-2xl p-3 z-50 text-xs">
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
                    <span>💬 WhatsApp Group</span>
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

      {/* 2. HERO GREETING BANNER */}
      <section className="bg-gradient-to-b from-[#11172f] via-[#1a2342] to-[#11172f] text-white py-10 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-lemon text-xs font-black uppercase tracking-wider backdrop-blur-xs">
            <span>🚀 Cohort Learning Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Welcome back, {student?.name || 'Builder'}! 👋
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Select your enrolled course below to enter your classroom, access interactive lectures, orientation videos, and download presentation slides.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-lemon">🏆</span>
              <span>{completedCount} Completed Classes</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <span>👥</span>
              <span>Active Builders Cohort</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <span>⚡</span>
              <span>Self-Paced + Live Mentorship</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. COURSES CATALOG */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">My Courses</h2>
            <p className="text-xs text-muted">Courses currently active and available to you.</p>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-50 text-[#090bc2]">
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Available
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#090bc2] border-t-transparent" />
            <p className="text-xs font-bold text-muted">Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <p className="text-sm font-bold text-slate-600">No courses published yet.</p>
            <p className="text-xs text-muted">Please contact your cohort instructor or check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, idx) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-[#e8e8f0] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Course Header Banner */}
                <div className="p-6 bg-gradient-to-br from-blue-50/60 via-slate-50 to-white border-b border-[#f0f0f5]">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#090bc2] text-white">
                      Track {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Enrolled
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-ink leading-snug group-hover:text-[#090bc2] transition">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {course.description ||
                      'Learn step-by-step how to conceptualize, design, and deploy full-stack web applications using cutting-edge AI workflows.'}
                  </p>
                </div>

                {/* Course Details & Intro Highlight */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Top Orientation Highlight */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center gap-1.5 font-black text-[#090bc2]">
                        <span>⭐</span>
                        <span>Intro Class First:</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-700 mt-0.5 truncate">
                        {course.introTitle || 'Orientation & Course Overview'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <span>📚</span>
                        <span>{course.moduleCount || 2} Weeks</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>🎥</span>
                        <span>{course.totalLessons || 7} Classes</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>⭐</span>
                        <span>5.0 Rating</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/classroom?courseId=${course.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lemon hover:brightness-105 text-[#080981] font-black text-xs transition shadow-xs cursor-pointer group-hover:scale-[1.01]"
                  >
                    <span>Enter Classroom</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-white border-t border-[#e8e8f0] py-6 px-4 text-center text-xs text-muted">
        <p>© 2026 Chat2Build LMS Portal. Built with AI for future builders.</p>
      </footer>
    </div>
  )
}
