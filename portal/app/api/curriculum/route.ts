import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebase'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { getCanvaEmbedUrl, getYouTubeThumbnailUrl } from '../../../lib/youtube'

export const dynamic = 'force-dynamic'

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
      const videoUrl = data.introVideoUrl || ''
      return {
        id: d.id,
        title: data.title || 'Untitled Course',
        description: data.description || '',
        thumbnailUrl: data.thumbnailUrl || '/images/web-dev-bootcamp-ai.jpg',
        introTitle: data.introTitle || 'Orientation & Course Overview',
        introVideoUrl: videoUrl,
        introEmbedUrl: getCanvaEmbedUrl(videoUrl || data.introEmbedUrl || ''),
        introSlideUrl: data.introSlideUrl || '',
        introDuration: data.introDuration || '15 mins',
        introNotes: data.introNotes || '',
        introViewCount: data.introViewCount || 0,
        order: data.order ?? 1,
      }
    })

    // If no course exists in Firestore, fallback
    if (coursesList.length === 0) {
      coursesList = [
        {
          id: 'default-course',
          title: 'Web Development Bootcamp with AI',
          description: 'A 2-week intensive bootcamp teaching non-programmers how to design, build, and deploy production-ready web applications using modern AI workflows.',
          thumbnailUrl: '/images/web-dev-bootcamp-ai.jpg',
          introTitle: 'Orientation & Course Overview',
          introVideoUrl: '',
          introEmbedUrl: '',
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

    // 2. Fetch today's unique view counts from video_unique_viewers
    const uvRef = collection(db, 'video_unique_viewers')
    let todayViewCounts: Record<string, number> = {}
    try {
      const qToday = query(uvRef, where('lastViewedDate', '==', today))
      const snapToday = await getDocs(qToday)
      snapToday.docs.forEach((docSnap) => {
        const v = docSnap.data()
        const target = v.targetId || v.classId
        if (target) {
          todayViewCounts[target] = (todayViewCounts[target] || 0) + 1
        }
      })
    } catch (e) {}

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
      const ytUrl = d.youtubeUrl || ''
      classesByModule[mId].push({
        id: docSnap.id,
        moduleId: mId,
        title: d.title || 'Untitled Class',
        classNumber: d.classNumber ?? 1,
        order: d.order ?? 1,
        youtubeUrl: ytUrl,
        embedUrl: getCanvaEmbedUrl(ytUrl || d.embedUrl || ''),
        thumbnailUrl: getYouTubeThumbnailUrl(ytUrl),
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
    const activeModules = modulesSnap.docs
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
        if (!m.courseId && (activeCourse.id === coursesList[0]?.id || activeCourse.id === 'default-course')) return true
        return false
      })

    activeModules.sort((a, b) => a.order - b.order)

    // Complete course objects with modules and classes for Course Listing page
    const coursesWithModules = coursesList.map((course) => {
      const courseMods = modulesSnap.docs
        .filter((m) => {
          const d = m.data()
          return d.courseId === course.id || (!d.courseId && (course.id === coursesList[0]?.id || course.id === 'default-course'))
        })
        .map((m) => {
          const d = m.data()
          return {
            id: m.id,
            title: d.title || '',
            weekNumber: d.weekNumber ?? 1,
            order: d.order ?? 1,
            description: d.description || '',
            classes: classesByModule[m.id] || [],
          }
        })

      courseMods.sort((a, b) => a.order - b.order)

      let totalLessons = 1 // includes orientation
      courseMods.forEach((mod) => {
        totalLessons += (mod.classes || []).length
      })

      return {
        ...course,
        moduleCount: courseMods.length,
        totalLessons,
        modules: courseMods,
        todayViews: todayViewCounts['intro'] || 0,
      }
    })

    return NextResponse.json({
      success: true,
      courses: coursesWithModules,
      activeCourse: {
        ...activeCourse,
        todayViews: todayViewCounts['intro'] || 0,
      },
      modules: activeModules,
    })
  } catch (err: any) {
    console.error('[Portal Curriculum GET Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to load curriculum.' }, { status: 500 })
  }
}
