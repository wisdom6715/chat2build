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

  // Get Initials for Avatar (e.g. "Olayiwola" -> "OL", "Wisdom O." -> "WO")
  const getInitials = (name?: string) => {
    if (!name) return 'C2'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const rawFirst = student?.name ? student.name.trim().split(/\s+/)[0] : ''
  const firstName = rawFirst
    ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1)
    : 'Builder'

  return (
    <div className="min-h-screen bg-white text-[#11172f] flex flex-col font-sans selection:bg-[#090bc2] selection:text-white">
      {/* 1. TOP NAV BAR (FULL WHITE MODE) */}
      <header className="h-16 bg-white border-b border-[#e8e8f0] px-4 sm:px-10 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/courses" className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="Chat2Build"
              className="h-9 w-9 rounded-xl object-cover shadow-xs"
            />
            <span className="text-base font-black tracking-tight text-slate-900 hidden sm:inline">
              Chat2Build
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
              <span className="text-xs font-bold text-slate-700 hidden md:inline truncate max-w-[140px]">
                {firstName}
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

      {/* 3. CLEAN COURSE CATALOG (MAIN COURSE COMPONENT) */}
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
            {courses.map((course) => {
              const thumbnailSrc = course.thumbnailUrl || '/images/web-dev-bootcamp-ai.jpg'

              return (
                <div
                  key={course.id}
                  className="border border-slate-200 rounded-2xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group max-w-lg"
                >
                  {/* Course Thumbnail Poster */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                    <img
                      src={thumbnailSrc}
                      alt={course.title}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = '/web-dev-bootcamp-ai.jpg'
                      }}
                      className="w-full h-full object-cover object-top group-hover:scale-102 transition duration-300"
                    />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-xs shadow-xs">
                        2-Week Intensive
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 shadow-xs">
                        ✓ Enrolled
                      </span>
                    </div>
                  </div>

                  {/* Course Details & Action */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-[#090bc2] transition">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2 line-clamp-2">
                        {course.description ||
                          'Turn your ideas into web apps and websites by simply describing what you want. No coding experience required.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>📚 2 Weeks • 100% Free</span>
                      <span>⭐ 5.0 Rating</span>
                    </div>

                    <Link
                      href={`/classroom?courseId=${course.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#090bc2] hover:bg-[#080981] text-white font-black text-xs transition shadow-xs cursor-pointer"
                    >
                      <span>Continue Learning</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* 4. FOOTER WITH LOGO */}
      <footer className="bg-white border-t border-[#e8e8f0] py-8 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Chat2Build" className="h-6 w-6 rounded-md object-cover shadow-2xs" />
            <span className="font-bold text-slate-800">Chat2Build</span>
          </div>
          <p>© 2026 Chat2Build. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
