'use client'

import React, { useState, useEffect } from 'react'
import { getYouTubeEmbedUrl, extractYouTubeVideoId } from '../../lib/youtube'

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
}

interface CurriculumModule {
  id: string
  title: string
  weekNumber: number
  order: number
  description?: string
  classCount: number
}

export function CurriculumManager() {
  const [modules, setModules] = useState<CurriculumModule[]>([])
  const [classes, setClasses] = useState<CurriculumClass[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')

  // Modal / Form states
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editingModule, setEditingModule] = useState<CurriculumModule | null>(null)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleWeek, setModuleWeek] = useState(1)
  const [moduleDesc, setModuleDesc] = useState('')

  const [showClassModal, setShowClassModal] = useState(false)
  const [editingClass, setEditingClass] = useState<CurriculumClass | null>(null)
  const [classTitle, setClassTitle] = useState('')
  const [classNumber, setClassNumber] = useState(1)
  const [classYoutubeUrl, setClassYoutubeUrl] = useState('')
  const [classSlideUrl, setClassSlideUrl] = useState('')
  const [classDuration, setClassDuration] = useState('')
  const [classNotes, setClassNotes] = useState('')

  const [previewClass, setPreviewClass] = useState<CurriculumClass | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  // Load modules and classes
  const fetchData = async () => {
    setLoading(true)
    try {
      const [modRes, classRes] = await Promise.all([
        fetch('/api/admin/curriculum/modules'),
        fetch('/api/admin/curriculum/classes'),
      ])
      const modData = await modRes.json()
      const classData = await classRes.json()

      if (modRes.ok && modData.modules) {
        setModules(modData.modules)
        if (modData.modules.length > 0 && !selectedModuleId) {
          setSelectedModuleId(modData.modules[0].id)
        }
      }
      if (classRes.ok && classData.classes) {
        setClasses(classData.classes)
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch curriculum data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Open Module Creator / Editor
  const handleOpenModuleModal = (mod?: CurriculumModule) => {
    if (mod) {
      setEditingModule(mod)
      setModuleTitle(mod.title)
      setModuleWeek(mod.weekNumber)
      setModuleDesc(mod.description || '')
    } else {
      setEditingModule(null)
      const nextWeek = modules.length + 1
      setModuleTitle(`Week ${nextWeek}: Web App Foundations`)
      setModuleWeek(nextWeek)
      setModuleDesc('')
    }
    setShowModuleModal(true)
  }

  // Save Module
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moduleTitle.trim()) {
      showToast('error', 'Module title is required.')
      return
    }

    setSaving(true)
    try {
      const payload = {
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
        fetchData()
      } else {
        showToast('error', data.error || 'Failed to save module.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error saving module.')
    } finally {
      setSaving(false)
    }
  }

  // Delete Module
  const handleDeleteModule = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its classes?`)) return
    try {
      const res = await fetch(`/api/admin/curriculum/modules?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'Module deleted.')
        if (selectedModuleId === id) setSelectedModuleId('')
        fetchData()
      } else {
        showToast('error', data.error || 'Failed to delete module.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error deleting module.')
    }
  }

  // Open Class Creator / Editor
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
      const currentModuleClasses = classes.filter((c) => c.moduleId === selectedModuleId)
      const nextNum = currentModuleClasses.length + 1
      setClassTitle(`Class ${nextNum}: `)
      setClassNumber(nextNum)
      setClassYoutubeUrl('')
      setClassSlideUrl('')
      setClassDuration('45 mins')
      setClassNotes('')
    }
    setShowClassModal(true)
  }

  // Save Class
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
        fetchData()
      } else {
        showToast('error', data.error || 'Failed to save class.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error saving class.')
    } finally {
      setSaving(false)
    }
  }

  // Delete Class
  const handleDeleteClass = async (id: string, title: string) => {
    if (!window.confirm(`Delete class "${title}"?`)) return
    try {
      const res = await fetch(`/api/admin/curriculum/classes?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast('success', 'Class deleted.')
        fetchData()
      } else {
        showToast('error', data.error || 'Failed to delete class.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error deleting class.')
    }
  }

  const activeModule = modules.find((m) => m.id === selectedModuleId) || modules[0]
  const moduleClasses = classes.filter((c) => c.moduleId === selectedModuleId)

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="cursor-pointer text-slate-500">
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-line shadow-card">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#090BC2]/10 text-[#090BC2] border border-[#090BC2]/20">
            <span>📚 Course Management</span>
          </div>
          <h2 className="text-xl font-black text-ink mt-1">Bootcamp Curriculum &amp; Modules</h2>
          <p className="text-xs text-muted">
            Manage Week 1 &amp; Week 2 modules, video lessons (YouTube embed), and PDF slides for students on{' '}
            <strong className="text-ink">app.chat2build.pro</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenModuleModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#090BC2] hover:bg-[#080981] text-white text-xs font-black shadow-sm transition cursor-pointer"
          >
            <span>+ Add Module (Week)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#090BC2] border-t-transparent mx-auto" />
          <p className="text-xs font-bold text-muted mt-3">Loading curriculum modules...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-line p-8">
          <span className="text-4xl">📘</span>
          <h3 className="text-base font-bold text-ink mt-3">No modules created yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1">
            Create your first module (e.g. Week 1: Ideation &amp; UI Architecture) to start adding classes.
          </p>
          <button
            type="button"
            onClick={() => handleOpenModuleModal()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#090BC2] hover:bg-[#080981] text-white text-xs font-black cursor-pointer shadow-sm"
          >
            <span>+ Create Week 1 Module</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Modules / Weeks Selector (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-black uppercase tracking-wider text-muted">
                Modules ({modules.length})
              </span>
              <button
                type="button"
                onClick={() => handleOpenModuleModal()}
                className="text-[11px] font-bold text-[#090BC2] hover:underline cursor-pointer"
              >
                + New Week
              </button>
            </div>

            <div className="space-y-2.5">
              {modules.map((mod) => {
                const isSelected = mod.id === selectedModuleId
                return (
                  <div
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative ${
                      isSelected
                        ? 'border-[#090BC2] bg-blue-50/50 shadow-sm ring-2 ring-[#090BC2]/20'
                        : 'border-line bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-lemon text-[#080981]">
                          Week {mod.weekNumber}
                        </span>
                        <h4 className="text-sm font-black text-ink mt-1.5 leading-snug">{mod.title}</h4>
                        {mod.description && (
                          <p className="text-[11px] text-muted line-clamp-1 mt-0.5">{mod.description}</p>
                        )}
                        <span className="inline-block text-[11px] font-bold text-[#090BC2] mt-2">
                          {classes.filter((c) => c.moduleId === mod.id).length} classes uploaded
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenModuleModal(mod)}
                          title="Edit Module"
                          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 text-xs cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(mod.id, mod.title)}
                          title="Delete Module"
                          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 text-xs cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Classes in Selected Module (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-line">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted">Active Module</span>
                <h3 className="text-base font-black text-ink">
                  {activeModule ? activeModule.title : 'Select a Module'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleOpenClassModal()}
                disabled={!activeModule}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lemon hover:brightness-105 text-[#080981] text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <span>+ Upload Class Video &amp; Slides</span>
              </button>
            </div>

            {moduleClasses.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-white border border-line p-6">
                <span className="text-3xl">🎥</span>
                <h4 className="text-sm font-bold text-ink mt-2">No classes in this module yet</h4>
                <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                  Click the button above to upload Class 1 with its YouTube video URL and PDF slide link.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenClassModal()}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#090BC2] text-white text-xs font-black cursor-pointer"
                >
                  <span>+ Add First Class</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {moduleClasses.map((cls) => {
                  const videoId = extractYouTubeVideoId(cls.youtubeUrl)
                  const hasSlide = Boolean(cls.slideUrl && cls.slideUrl.trim())

                  return (
                    <div
                      key={cls.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-line hover:border-slate-300 shadow-card transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#090BC2]/10 text-[#090BC2] text-xs font-black shrink-0">
                            {cls.classNumber}
                          </span>
                          <div>
                            <h4 className="text-sm font-black text-ink">{cls.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {cls.duration && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted">
                                  <span>⏱️</span>
                                  <span>{cls.duration}</span>
                                </span>
                              )}
                              {hasSlide ? (
                                <a
                                  href={cls.slideUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#090BC2] bg-blue-50 px-2 py-0.5 rounded-md hover:underline"
                                >
                                  <span>📄 PDF Slides</span>
                                  <span>↗</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-muted italic">No slide attached</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setPreviewClass(cls)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
                          >
                            <span>▶ Preview Player</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenClassModal(cls)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 text-xs cursor-pointer"
                            title="Edit Class"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(cls.id, cls.title)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 text-xs cursor-pointer"
                            title="Delete Class"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* YouTube video preview thumbnail or link */}
                      <div className="flex items-center gap-2 text-[11px] text-muted bg-slate-50 p-2.5 rounded-xl border border-line truncate">
                        <span className="font-bold text-red-600">YouTube URL:</span>
                        <a
                          href={cls.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-[#090BC2] hover:underline"
                        >
                          {cls.youtubeUrl}
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module Create/Edit Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-line p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-black text-ink">
                {editingModule ? 'Edit Module / Week' : 'Create New Module / Week'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Week Number</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={moduleWeek}
                  onChange={(e) => setModuleWeek(Number(e.target.value))}
                  className="w-full rounded-xl border border-line p-2.5 text-xs font-bold text-ink focus:border-[#090BC2] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Module Title</label>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Week 1: Ideation &amp; UI Architecture"
                  className="w-full rounded-xl border border-line p-2.5 text-xs text-ink focus:border-[#090BC2] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Description (Optional)</label>
                <textarea
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  placeholder="What students will build during this week..."
                  rows={3}
                  className="w-full rounded-xl border border-line p-2.5 text-xs text-ink focus:border-[#090BC2] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#090BC2] hover:bg-[#080981] text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingModule ? 'Update Module' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Create/Edit Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-line p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-lemon bg-[#080981] px-2 py-0.5 rounded-md">
                  {activeModule?.title || 'Selected Module'}
                </span>
                <h3 className="text-base font-black text-ink mt-1">
                  {editingClass ? 'Edit Class Video & Slides' : 'Upload New Class'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClassModal(false)}
                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-ink mb-1">Class #</label>
                  <input
                    type="number"
                    min="1"
                    value={classNumber}
                    onChange={(e) => setClassNumber(Number(e.target.value))}
                    className="w-full rounded-xl border border-line p-2.5 text-xs font-bold text-ink focus:border-[#090BC2] focus:outline-none"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-ink mb-1">Duration (e.g. 45 mins)</label>
                  <input
                    type="text"
                    value={classDuration}
                    onChange={(e) => setClassDuration(e.target.value)}
                    placeholder="45 mins"
                    className="w-full rounded-xl border border-line p-2.5 text-xs text-ink focus:border-[#090BC2] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Class Topic / Title</label>
                <input
                  type="text"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  placeholder="e.g. Introduction to UI/UX &amp; Wireframing"
                  className="w-full rounded-xl border border-line p-2.5 text-xs text-ink focus:border-[#090BC2] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  YouTube Video URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={classYoutubeUrl}
                  onChange={(e) => setClassYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-line p-2.5 text-xs text-ink focus:border-[#090BC2] focus:outline-none"
                  required
                />
                <p className="text-[10px] text-muted mt-1">
                  Paste the normal YouTube video link or unlisted video URL. It will automatically be embedded inside the
                  2/3 video player.
                </p>
              </div>

              {/* Live Embed Preview if valid URL */}
              {classYoutubeUrl && (
                <div className="rounded-xl overflow-hidden border border-line aspect-video bg-black">
                  <iframe
                    src={getYouTubeEmbedUrl(classYoutubeUrl)}
                    title="YouTube Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-ink mb-1">PDF Slide Link (Optional)</label>
                <input
                  type="url"
                  value={classSlideUrl}
                  onChange={(e) => setClassSlideUrl(e.target.value)}
                  placeholder="https://.../presentation.pdf (Google Drive, Canva, Storage URL)"
                  className="w-full rounded-xl border border-line p-2.5 text-xs text-ink focus:border-[#090BC2] focus:outline-none"
                />
                <p className="text-[10px] text-muted mt-1">
                  Students can click the slide button beside the player to view or download the presentation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Class Notes / Summary (Optional)</label>
                <textarea
                  value={classNotes}
                  onChange={(e) => setClassNotes(e.target.value)}
                  placeholder="Key takeaways or homework exercises..."
                  rows={2}
                  className="w-full rounded-xl border border-line p-2.5 text-xs text-ink focus:border-[#090BC2] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#090BC2] hover:bg-[#080981] text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingClass ? 'Update Class' : 'Upload Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classroom Player Live Preview Modal */}
      {previewClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-4xl rounded-3xl bg-[#0c0d1e] border border-white/10 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-lemon">
                  Classroom Player Simulation
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">{previewClass.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewClass(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Video Iframe (2/3 Simulator) */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
              <iframe
                src={previewClass.embedUrl || getYouTubeEmbedUrl(previewClass.youtubeUrl)}
                title={previewClass.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>

            {/* Action Buttons Below Video */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {previewClass.slideUrl && (
                  <a
                    href={previewClass.slideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lemon text-[#080981] text-xs font-black hover:brightness-105"
                  >
                    <span>📄 Download Slides (PDF)</span>
                  </a>
                )}
                {previewClass.duration && (
                  <span className="text-xs text-white/60 font-bold">⏱️ Duration: {previewClass.duration}</span>
                )}
              </div>

              <span className="text-xs text-white/60 italic">This is how students will see this video on app.chat2build.pro</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
