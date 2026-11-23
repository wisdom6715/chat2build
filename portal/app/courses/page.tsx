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
        console.error('Failed to load courses:', err)
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

  // Get Initials for Avatar (e.g. "Olayiwola" -> "OI", "Wisdom" -> "WI")
  const getInitials = (name?: string) => {
    if (!name) return 'OI'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const firstName = student?.name ? student.name.split(' ')[0].toLowerCase() : 'builder'
  const completedCount = student?.completedClasses?.length || 0

  return (
    <div className="min-h-screen bg-white text-[#11172f] flex flex-col font-sans selection:bg-[#090bc2] selection:text-white">
      {/* 1. TOP NAV BAR (FULL WHITE MODE) */}
      <header className="h-16 bg-white border-b border-[#e8e8f0] px-4 sm:px-10 flex items-center justify-between sticky top-0 z-40">
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
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">My Learning</span>
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

      {/* 2. USER GREETING HEADER (EXACT UDEMY REFERENCE) */}
      <section className="bg-white border-b border-[#e8e8f0] pt-8 pb-6 px-4 sm:px-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {/* Black Avatar Circle */}
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

      {/* 3. "LET'S START LEARNING" (RESUME LEARNING ROW) */}
      <section className="bg-white py-8 px-4 sm:px-10 border-b border-[#e8e8f0]">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Let&apos;s start learning
            </h2>
            <span className="text-xs font-bold text-[#6b21a8] hover:underline cursor-pointer">
              My learning
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading your courses...</div>
          ) : courses.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No courses available.</div>
          ) : (
            <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/classroom?courseId=${course.id}`}
                  className="flex shrink-0 w-[340px] sm:w-[380px] h-[105px] border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition group cursor-pointer overflow-hidden rounded-xs"
                >
                  {/* Left Course Cover with Play Button */}
                  <div className="w-[120px] h-full shrink-0 relative bg-gradient-to-br from-[#090bc2] via-[#080981] to-[#11172f] flex items-center justify-center p-2 text-center overflow-hidden">
                    <span className="text-[11px] font-black text-white/90 leading-tight line-clamp-2">
                      Chat2Build
                    </span>
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition">
                        <span className="text-xs ml-0.5 font-black">▶</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Course Details */}
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-500 font-semibold truncate">
                        {course.title}
                      </p>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#090bc2] transition">
                        {course.introTitle || 'Orientation & Course Overview'}
                      </h3>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Lecture • {course.introDuration || '15m'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. CLEAN COURSE CATALOG (JUST LIST COURSES — NO NESTED ACCORDIONS!) */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-10 py-10 space-y-6 bg-white">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Courses
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Click on your course to open the classroom and watch the Introduction, Week 1, and Week 2.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
            No courses assigned yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="border border-slate-200 rounded-2xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Course Banner Cover */}
                <div className="h-40 bg-gradient-to-br from-[#090bc2] via-[#0e129c] to-[#11172f] p-6 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between z-10">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                      2-Week Intensive Track
                    </span>
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ Enrolled
                    </span>
                  </div>

                  <div className="z-10">
                    <h3 className="text-lg font-black text-white leading-tight group-hover:text-lemon transition">
                      {course.title}
                    </h3>
                  </div>

                  {/* Decorative background glow */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-lemon/10 blur-xl pointer-events-none" />
                </div>

                {/* Course Description & Action */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {course.description ||
                      'Learn step-by-step how to conceptualize, design, and deploy full-stack web applications using cutting-edge AI workflows.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>📚 {course.moduleCount || 2} Weeks</span>
                    <span>•</span>
                    <span>🎥 Video Lectures &amp; Slides</span>
                    <span>•</span>
                    <span>⭐ 5.0 Rating</span>
                  </div>

                  <Link
                    href={`/classroom?courseId=${course.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lemon hover:brightness-105 text-[#080981] font-black text-xs transition shadow-xs cursor-pointer"
                  >
                    <span>Continue Learning</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-[#e8e8f0] py-6 px-4 text-center text-xs text-slate-400">
        <p>© 2026 Chat2Build LMS Portal.</p>
      </footer>
    </div>
  )
}
