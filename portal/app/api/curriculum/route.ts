import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebase'
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

function getYouTubeEmbedUrl(url: string): string {
  if (!url) return ''
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.trim().match(regExp)
  if (match && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}`
  }
  return url
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const courseIdParam = searchParams.get('courseId')
    const today = getTodayString()

    // 1. Fetch courses
    const coursesRef = collection(db, 'curriculum_courses')
    let coursesSnap
    try {
      const q = query(coursesRef, orderBy('order', 'asc'))
      coursesSnap = await getDocs(q)
    } catch {
      coursesSnap = await getDocs(coursesRef)
    }

    let coursesList = coursesSnap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        title: data.title || 'Untitled Course',
        description: data.description || '',
        thumbnailUrl: data.thumbnailUrl || '',
        introTitle: data.introTitle || 'Orientation & Course Overview',
        introVideoUrl: data.introVideoUrl || '',
        introEmbedUrl: data.introEmbedUrl || getYouTubeEmbedUrl(data.introVideoUrl || ''),
        introSlideUrl: data.introSlideUrl || '',
        introDuration: data.introDuration || '15 mins',
        introNotes: data.introNotes || '',
        introViewCount: data.introViewCount || 0,
        order: data.order ?? 1,
      }
    })

    // If no course exists in Firestore, provide default fallback
    if (coursesList.length === 0) {
      coursesList = [
        {
          id: 'default-course',
          title: 'Chat2Build: Build Your First Web App with AI',
          description: 'A 2-week intensive bootcamp teaching non-programmers how to design, build, and deploy production-ready web applications using modern AI workflows.',
          thumbnailUrl: '',
          introTitle: 'Orientation & Course Overview',
          introVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          introEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
          introSlideUrl: '',
          introDuration: '15 mins',
          introNotes: 'Welcome to Chat2Build! Watch this orientation class to understand the curriculum schedule, Stitch UI setup, and cohort community.',
          introViewCount: 0,
          order: 1,
        },
      ]
    }

    // Determine current selected course
    const activeCourse = (courseIdParam
      ? coursesList.find((c) => c.id === courseIdParam)
      : coursesList[0]) || coursesList[0]

    // 2. Fetch today's view counts from video_views
    const viewsRef = collection(db, 'video_views')
    let todayViewCounts: Record<string, number> = {}
    try {
      const qToday = query(viewsRef, where('date', '==', today))
      const snapToday = await getDocs(qToday)
      snapToday.docs.forEach((docSnap) => {
        const v = docSnap.data()
        const target = v.classId || (v.isIntro ? 'intro' : null)
        if (target) {
          todayViewCounts[target] = (todayViewCounts[target] || 0) + 1
        }
      })
    } catch (e) {
      // Index might be warming or empty
    }

    // 3. Fetch modules
    const modulesRef = collection(db, 'curriculum_modules')
    let modulesSnap
    try {
      const q = query(modulesRef, orderBy('order', 'asc'))
      modulesSnap = await getDocs(q)
    } catch {
      modulesSnap = await getDocs(modulesRef)
    }

    // 4. Fetch classes
    const classesRef = collection(db, 'curriculum_classes')
    let classesSnap
    try {
      const q = query(classesRef, orderBy('order', 'asc'))
      classesSnap = await getDocs(q)
    } catch {
      classesSnap = await getDocs(classesRef)
    }

    const classesByModule: Record<string, any[]> = {}
    classesSnap.docs.forEach((docSnap) => {
      const d = docSnap.data()
      const mId = d.moduleId
      if (!mId) return
      if (!classesByModule[mId]) classesByModule[mId] = []
      classesByModule[mId].push({
        id: docSnap.id,
        moduleId: mId,
        title: d.title || 'Untitled Class',
        classNumber: d.classNumber ?? 1,
        order: d.order ?? 1,
        youtubeUrl: d.youtubeUrl || '',
        embedUrl: d.embedUrl || getYouTubeEmbedUrl(d.youtubeUrl || ''),
        slideUrl: d.slideUrl || '',
        duration: d.duration || '',
        notes: d.notes || '',
        viewCount: d.viewCount || 0,
        todayViews: todayViewCounts[docSnap.id] || 0,
      })
    })

    // Sort classes within each module
    Object.keys(classesByModule).forEach((mId) => {
      classesByModule[mId].sort((a, b) => a.order - b.order)
    })

    // Filter modules for active course (or modules without courseId for the primary course)
    const modules = modulesSnap.docs
      .map((docSnap) => {
        const d = docSnap.data()
        return {
          id: docSnap.id,
          courseId: d.courseId || '',
          title: d.title || '',
          weekNumber: d.weekNumber ?? 1,
          order: d.order ?? 1,
          description: d.description || '',
          classes: classesByModule[docSnap.id] || [],
        }
      })
      .filter((m) => {
        if (!activeCourse) return true
        if (m.courseId === activeCourse.id) return true
        // If courseId not set on module, attach to the first course
        if (!m.courseId && (activeCourse.id === coursesList[0]?.id || activeCourse.id === 'default-course')) return true
        return false
      })

    modules.sort((a, b) => a.order - b.order)

    // Compute course stats for course listing
    const coursesWithStats = coursesList.map((course) => {
      const courseMods = modulesSnap.docs.filter((m) => {
        const d = m.data()
        return d.courseId === course.id || (!d.courseId && course.id === coursesList[0]?.id)
      })
      let totalLessons = 1 // including intro class
      courseMods.forEach((mod) => {
        totalLessons += (classesByModule[mod.id] || []).length
      })
      return {
        ...course,
        moduleCount: courseMods.length,
        totalLessons,
        todayViews: todayViewCounts['intro'] || 0,
      }
    })

    return NextResponse.json({
      success: true,
      courses: coursesWithStats,
      activeCourse: {
        ...activeCourse,
        todayViews: todayViewCounts['intro'] || 0,
      },
      modules,
    })
  } catch (err: any) {
    console.error('[Portal Curriculum GET Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to load curriculum.' }, { status: 500 })
  }
}
