'use client'

import React, { useState, useEffect } from 'react'
import { getYouTubeEmbedUrl, extractYouTubeVideoId } from '../../lib/youtube'

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
  order: number
  moduleCount?: number
}

interface CurriculumClass {
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

interface CurriculumModule {
  id: string
  courseId?: string
  title: string
  weekNumber: number
  order: number
  description?: string
  classCount: number
}

export function CurriculumManager() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [modules, setModules] = useState<CurriculumModule[]>([])
  const [classes, setClasses] = useState<CurriculumClass[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')

  // Course Modal state
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [courseIntroTitle, setCourseIntroTitle] = useState('')
  const [courseIntroVideoUrl, setCourseIntroVideoUrl] = useState('')
  const [courseIntroSlideUrl, setCourseIntroSlideUrl] = useState('')
  const [courseIntroDuration, setCourseIntroDuration] = useState('15 mins')
  const [courseIntroNotes, setCourseIntroNotes] = useState('')

  // Module Modal states
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editingModule, setEditingModule] = useState<CurriculumModule | null>(null)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleWeek, setModuleWeek] = useState(1)
  const [moduleDesc, setModuleDesc] = useState('')

  // Class Modal states
  const [showClassModal, setShowClassModal] = useState(false)
  const [editingClass, setEditingClass] = useState<CurriculumClass | null>(null)
  const [classTitle, setClassTitle] = useState('')
  const [classNumber, setClassNumber] = useState(1)
  const [classYoutubeUrl, setClassYoutubeUrl] = useState('')
  const [classSlideUrl, setClassSlideUrl] = useState('')
  const [classDuration, setClassDuration] = useState('')
  const [classNotes, setClassNotes] = useState('')

  // Preview & Feedback states
  const [previewVideo, setPreviewVideo] = useState<{ title: string; embedUrl: string } | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  // Load everything
  const fetchData = async (keepSelection = true) => {
    setLoading(true)
    try {
      const [coursesRes, modRes, classRes] = await Promise.all([
        fetch('/api/admin/curriculum/courses'),
        fetch('/api/admin/curriculum/modules'),
        fetch('/api/admin/curriculum/classes'),
      ])

      const coursesData = await coursesRes.json()
      const modData = await modRes.json()
      const classData = await classRes.json()

      let activeCId = selectedCourseId
      if (coursesRes.ok && coursesData.courses) {
        setCourses(coursesData.courses)
        if (!activeCId || !coursesData.courses.some((c: CourseItem) => c.id === activeCId)) {
          activeCId = coursesData.courses[0]?.id || ''
          setSelectedCourseId(activeCId)
        }
      }

      if (modData.modules) {
        setModules(modData.modules)
        // Select first module of current course if current selection is invalid
        const courseMods = modData.modules.filter(
          (m: CurriculumModule) => m.courseId === activeCId || (!m.courseId && activeCId === coursesData.courses?.[0]?.id)
        )
        if (!keepSelection || !courseMods.some((m: CurriculumModule) => m.id === selectedModuleId)) {
          if (courseMods.length > 0) {
            setSelectedModuleId(courseMods[0].id)
          } else {
            setSelectedModuleId('')
          }
        }
      }

      if (classData.classes) {
        setClasses(classData.classes)
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch curriculum data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(false)
  }, [])

  // Selected Course Object
  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0]

  // Filter modules for current course
  const currentModules = modules.filter(
    (m) => m.courseId === selectedCourseId || (!m.courseId && selectedCourseId === courses[0]?.id)
  )

  // Filter classes for selected module
  const currentClasses = classes.filter((c) => c.moduleId === selectedModuleId)

  // Total views across course
  const totalCourseViews = (currentCourse?.introViewCount || 0) + currentClasses.reduce((acc, c) => acc + (c.viewCount || 0), 0)

  // -------------------------------------------------------------
  // COURSE MODAL HANDLERS
  // -------------------------------------------------------------
  const handleOpenCourseModal = (course?: CourseItem) => {
    if (course) {
      setEditingCourse(course)
      setCourseTitle(course.title)
      setCourseDesc(course.description || '')
      setCourseIntroTitle(course.introTitle || '')
      setCourseIntroVideoUrl(course.introVideoUrl || '')
      setCourseIntroSlideUrl(course.introSlideUrl || '')
      setCourseIntroDuration(course.introDuration || '15 mins')
      setCourseIntroNotes(course.introNotes || '')
    } else {
      setEditingCourse(null)
      setCourseTitle('')
      setCourseDesc('')
      setCourseIntroTitle('Orientation & Course Overview')
      setCourseIntroVideoUrl('')
      setCourseIntroSlideUrl('')
      setCourseIntroDuration('15 mins')
      setCourseIntroNotes('Welcome students to the course and outline expectations.')
    }
    setShowCourseModal(true)
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseTitle.trim()) {
      showToast('error', 'Course title is required.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: courseTitle.trim(),
        description: courseDesc.trim(),
        introTitle: courseIntroTitle.trim() || 'Orientation & Course Overview',
        introVideoUrl: courseIntroVideoUrl.trim(),
        introSlideUrl: courseIntroSlideUrl.trim(),
        introDuration: courseIntroDuration.trim(),
        introNotes: courseIntroNotes.trim(),
      }

      let res
      if (editingCourse) {
        res = await fetch('/api/admin/curriculum/courses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCourse.id, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/curriculum/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (res.ok) {
        showToast('success', editingCourse ? 'Course updated successfully!' : 'Course created!')
        setShowCourseModal(false)
        await fetchData(true)
        if (!editingCourse && data.course?.id) {
          setSelectedCourseId(data.course.id)
        }
      } else {
        showToast('error', data.error || 'Failed to save course.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error saving course.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the course "${title}"? This will delete all its modules and classes!`)) return
    try {
      const res = await fetch(`/api/admin/curriculum/courses?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'Course deleted.')
        fetchData(false)
      } else {
        showToast('error', data.error || 'Failed to delete course.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error deleting course.')
    }
  }

  // -------------------------------------------------------------
  // MODULE HANDLERS
  // -------------------------------------------------------------
  const handleOpenModuleModal = (mod?: CurriculumModule) => {
    if (mod) {
      setEditingModule(mod)
      setModuleTitle(mod.title)
      setModuleWeek(mod.weekNumber)
      setModuleDesc(mod.description || '')
    } else {
      setEditingModule(null)
      const nextWeek = currentModules.length + 1
      setModuleTitle(`Week ${nextWeek}: Web App Foundations`)
      setModuleWeek(nextWeek)
      setModuleDesc('')
    }
    setShowModuleModal(true)
  }

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moduleTitle.trim()) {
      showToast('error', 'Module title is required.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        courseId: selectedCourseId,
        title: moduleTitle.trim(),
        weekNumber: Number(moduleWeek) || 1,
        order: Number(moduleWeek) || 1,
        description: moduleDesc.trim(),
      }

      let res
      if (editingModule) {
        res = await fetch('/api/admin/curriculum/modules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingModule.id, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/curriculum/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (res.ok) {
        showToast('success', editingModule ? 'Module updated successfully!' : 'Module created successfully!')
        setShowModuleModal(false)
        fetchData(true)
      } else {
        showToast('error', data.error || 'Failed to save module.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error saving module.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteModule = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its classes?`)) return
    try {
      const res = await fetch(`/api/admin/curriculum/modules?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'Module deleted.')
        if (selectedModuleId === id) setSelectedModuleId('')
        fetchData(true)
      } else {
        showToast('error', data.error || 'Failed to delete module.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error deleting module.')
    }
  }

  // -------------------------------------------------------------
  // CLASS HANDLERS
  // -------------------------------------------------------------
  const handleOpenClassModal = (cls?: CurriculumClass) => {
    if (cls) {
      setEditingClass(cls)
      setClassTitle(cls.title)
      setClassNumber(cls.classNumber)
      setClassYoutubeUrl(cls.youtubeUrl)
      setClassSlideUrl(cls.slideUrl || '')
      setClassDuration(cls.duration || '')
      setClassNotes(cls.notes || '')
    } else {
      setEditingClass(null)
      const nextNum = currentClasses.length + 1
      setClassTitle(`Class ${nextNum}: `)
      setClassNumber(nextNum)
      setClassYoutubeUrl('')
      setClassSlideUrl('')
      setClassDuration('45 mins')
      setClassNotes('')
    }
    setShowClassModal(true)
  }

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModuleId) {
      showToast('error', 'Please select a module/week first.')
      return
    }
    if (!classTitle.trim()) {
      showToast('error', 'Class title is required.')
      return
    }
    if (!classYoutubeUrl.trim()) {
      showToast('error', 'YouTube video URL is required.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        moduleId: selectedModuleId,
        title: classTitle.trim(),
        classNumber: Number(classNumber) || 1,
        order: Number(classNumber) || 1,
        youtubeUrl: classYoutubeUrl.trim(),
        slideUrl: classSlideUrl.trim(),
        duration: classDuration.trim(),
        notes: classNotes.trim(),
      }

      let res
      if (editingClass) {
        res = await fetch('/api/admin/curriculum/classes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingClass.id, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/curriculum/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (res.ok) {
        showToast('success', editingClass ? 'Class updated successfully!' : 'Class added to module!')
        setShowClassModal(false)
        fetchData(true)
      } else {
        showToast('error', data.error || 'Failed to save class.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error saving class.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClass = async (id: string, title: string) => {
    if (!window.confirm(`Delete class "${title}"?`)) return
    try {
      const res = await fetch(`/api/admin/curriculum/classes?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'Class deleted.')
        fetchData(true)
      } else {
        showToast('error', data.error || 'Failed to delete class.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error deleting class.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-bold flex items-center justify-between shadow-lg transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-white hover:text-white/80 font-black ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP HEADER: Course Selector & Global Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Curriculum &amp; Course Manager
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Create courses, orientation classes, week modules, lesson videos, slides, and monitor live student watch metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenCourseModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lemon text-[#080981] font-black text-xs hover:brightness-105 shadow-xs transition cursor-pointer"
          >
            <span>+</span>
            <span>Create New Course</span>
          </button>

          <a
            href="https://app.chat2build.pro/classroom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#090bc2] text-white font-bold text-xs hover:brightness-110 shadow-xs transition cursor-pointer"
          >
            <span>Preview Student Portal</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      {/* COURSE SELECTOR TABS & ACTIVE COURSE BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Select Course:
          </span>
          {currentCourse && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCourseModal(currentCourse)}
                className="text-xs font-bold text-[#090bc2] hover:underline"
              >
                ✏️ Edit Course Details
              </button>
              {courses.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteCourse(currentCourse.id, currentCourse.title)}
                  className="text-xs font-bold text-red-600 hover:underline ml-2"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Course Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {courses.map((course) => {
            const isSelected = course.id === selectedCourseId
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => {
                  setSelectedCourseId(course.id)
                  const courseMods = modules.filter(
                    (m) => m.courseId === course.id || (!m.courseId && course.id === courses[0]?.id)
                  )
                  if (courseMods.length > 0) {
                    setSelectedModuleId(courseMods[0].id)
                  } else {
                    setSelectedModuleId('')
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#090bc2] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {course.title}
              </button>
            )
          })}
        </div>

        {/* Selected Course Summary & View Metrics */}
        {currentCourse && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#090bc2]/10 text-[#090bc2]">
                  Active Course
                </span>
                <h3 className="text-sm font-black text-slate-900">{currentCourse.title}</h3>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">
                {currentCourse.description || 'No description provided.'}
              </p>
            </div>

            {/* Total Course Watch Metrics */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Total Lessons</div>
                <div className="text-base font-black text-slate-900 tabular-num">
                  {(currentCourse.moduleCount || 0) * 3 + 1}
                </div>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">All-time Views</div>
                <div className="text-base font-black text-[#090bc2] tabular-num">
                  👁️ {totalCourseViews}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COURSE ORIENTATION / INTRODUCTION CLASS CARD */}
        {currentCourse && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border border-[#090bc2]/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#090bc2] text-white text-sm shrink-0 font-bold shadow-xs">
                  ⭐
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#090bc2] text-white">
                      Course Introduction Class (At Top)
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {currentCourse.introTitle || 'Orientation & Course Overview'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    {currentCourse.introDuration && <span>⏱️ {currentCourse.introDuration}</span>}
                    {currentCourse.introVideoUrl && (
                      <span className="text-emerald-700 font-bold">✓ Video Attached</span>
                    )}
                    {currentCourse.introSlideUrl && (
                      <span className="text-blue-700 font-bold">✓ PDF Slides Ready</span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Metrics & Actions for Intro Class */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-indigo-100 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-2xs">
                  <span>👁️ {currentCourse.introViewCount || 0} views</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-indigo-600 font-extrabold">
                    {currentCourse.todayViews || 0} today
                  </span>
                </div>

                {currentCourse.introVideoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewVideo({
                        title: currentCourse.introTitle || 'Course Orientation',
                        embedUrl: getYouTubeEmbedUrl(currentCourse.introVideoUrl || ''),
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                  >
                    ▶ Play
                  </button>
                )}

                {currentCourse.introSlideUrl && (
                  <a
                    href={currentCourse.introSlideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    PDF ↗
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenCourseModal(currentCourse)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Edit Intro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODULES & CLASSES TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Modules / Weeks Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Modules / Weeks ({currentModules.length})
              </h3>
              <button
                type="button"
                onClick={() => handleOpenModuleModal()}
                className="px-2.5 py-1 rounded-lg bg-lemon text-[#080981] font-black text-xs hover:brightness-105 cursor-pointer"
              >
                + Add Week
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading modules...</div>
            ) : currentModules.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No modules found for this course. Click "+ Add Week" to create Week 1!
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {currentModules.map((m) => {
                  const isSelected = m.id === selectedModuleId
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModuleId(m.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-[#090bc2] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-[#090bc2]">
                          Week {m.weekNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenModuleModal(m)
                            }}
                            className="text-[11px] font-bold text-slate-400 hover:text-slate-700"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteModule(m.id, m.title)
                            }}
                            className="text-[11px] font-bold text-red-400 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{m.title}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                        <span>{m.classCount} classes</span>
                        {isSelected && <span className="font-bold text-[#090bc2]">Active →</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Classes & Daily View Metrics Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Classes in Selected Week ({currentClasses.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Daily viewer metrics and video lecture materials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenClassModal()}
                disabled={!selectedModuleId}
                className="px-3 py-1.5 rounded-xl bg-lemon text-[#080981] font-black text-xs hover:brightness-105 disabled:opacity-50 cursor-pointer"
              >
                + Add Class
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading classes...</div>
            ) : !selectedModuleId ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Please select or create a Week module on the left.
              </div>
            ) : currentClasses.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-xs text-slate-500">
                  No classes created in this module yet.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenClassModal()}
                  className="px-4 py-2 rounded-xl bg-lemon text-[#080981] font-black text-xs hover:brightness-105"
                >
                  + Add First Class
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {currentClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#090bc2] text-white">
                          Class {cls.classNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{cls.title}</h4>
                      </div>

                      {/* Daily Watch Metrics Badge */}
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/80 text-xs font-bold text-slate-700">
                        <span title="Total viewers all-time">
                          👁️ {cls.viewCount || 0} views
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[#090bc2] font-black" title="People who watched today">
                          📅 {cls.todayViews || 0} today
                        </span>
                      </div>
                    </div>

                    {/* Class Details & Links */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      {cls.duration && <span>⏱️ {cls.duration}</span>}
                      {cls.youtubeUrl && (
                        <span className="text-emerald-700 font-bold truncate max-w-xs">
                          🎥 YouTube Linked
                        </span>
                      )}
                      {cls.slideUrl ? (
                        <a
                          href={cls.slideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-bold hover:underline"
                        >
                          📄 Presentation Slide (PDF) ↗
                        </a>
                      ) : (
                        <span className="text-slate-400">No slides attached</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewVideo({
                            title: cls.title,
                            embedUrl: cls.embedUrl,
                          })
                        }
                        className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                      >
                        ▶ Test Player
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenClassModal(cls)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteClass(cls.id, cls.title)}
                        className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. COURSE CREATOR / EDITOR MODAL                          */}
      {/* ========================================================= */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingCourse ? 'Edit Course Details' : 'Create New Course'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 mb-1">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Chat2Build: Build Your First Web App with AI"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#090bc2] focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Description</label>
                <textarea
                  rows={2}
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="Brief summary of what students will master..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#090bc2] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1 text-[11px] font-black uppercase text-[#090bc2]">
                  <span>⭐</span>
                  <span>Course Introduction Class (Displayed at Top Before Sections)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Intro Class Title</label>
                  <input
                    type="text"
                    value={courseIntroTitle}
                    onChange={(e) => setCourseIntroTitle(e.target.value)}
                    placeholder="e.g. Orientation & Course Overview"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#090bc2] focus:outline-hidden font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Intro YouTube Video URL</label>
                    <input
                      type="url"
                      value={courseIntroVideoUrl}
                      onChange={(e) => setCourseIntroVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#090bc2] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Intro Duration</label>
                    <input
                      type="text"
                      value={courseIntroDuration}
                      onChange={(e) => setCourseIntroDuration(e.target.value)}
                      placeholder="e.g. 15 mins"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#090bc2] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Intro Presentation Slides URL (PDF link)
                  </label>
                  <input
                    type="url"
                    value={courseIntroSlideUrl}
                    onChange={(e) => setCourseIntroSlideUrl(e.target.value)}
                    placeholder="https://.../orientation-slides.pdf or Google Drive PDF link"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#090bc2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Intro Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={courseIntroNotes}
                    onChange={(e) => setCourseIntroNotes(e.target.value)}
                    placeholder="Welcome message or instructions for students..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#090bc2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-lemon text-[#080981] font-black hover:brightness-105 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODULE MODAL                                           */}
      {/* ========================================================= */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingModule ? 'Edit Week Module' : 'Create Week Module'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-black text-slate-700 mb-1">Week #</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    required
                    value={moduleWeek}
                    onChange={(e) => setModuleWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-center"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-black text-slate-700 mb-1">Module Title</label>
                  <input
                    type="text"
                    required
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="e.g. Week 1: Web App Foundations"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Module Description</label>
                <textarea
                  rows={2}
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  placeholder="What students learn this week..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-lemon text-[#080981] font-black hover:brightness-105 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingModule ? 'Save Module' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CLASS MODAL (TITLE, YOUTUBE URL, SLIDE PDF)            */}
      {/* ========================================================= */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingClass ? 'Edit Class' : 'Add Class to Week'}
              </h3>
              <button
                type="button"
                onClick={() => setShowClassModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block font-black text-slate-700 mb-1">Class #</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={classNumber}
                    onChange={(e) => setClassNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-center"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block font-black text-slate-700 mb-1">
                    Class Topic / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={classTitle}
                    onChange={(e) => setClassTitle(e.target.value)}
                    placeholder="e.g. Introduction to UI/UX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">
                  YouTube Video URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={classYoutubeUrl}
                  onChange={(e) => setClassYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This URL will automatically be embedded inside the student classroom iframe.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Presentation Slides URL (PDF)
                  </label>
                  <input
                    type="url"
                    value={classSlideUrl}
                    onChange={(e) => setClassSlideUrl(e.target.value)}
                    placeholder="https://.../slides.pdf or Google Slides PDF"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Shown opposite the topic in the classroom header.
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={classDuration}
                    onChange={(e) => setClassDuration(e.target.value)}
                    placeholder="e.g. 10 mins or 45 mins"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={classNotes}
                  onChange={(e) => setClassNotes(e.target.value)}
                  placeholder="Key takeaways or summary for students..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-lemon text-[#080981] font-black hover:brightness-105 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingClass ? 'Save Class' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. VIDEO PREVIEW MODAL                                    */}
      {/* ========================================================= */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#1c1d1f] rounded-2xl max-w-4xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-white/10">
              <h3 className="text-sm font-black truncate">{previewVideo.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="text-white/60 hover:text-white font-black"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
              <iframe
                src={`${previewVideo.embedUrl}?autoplay=1&rel=0`}
                title={previewVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
