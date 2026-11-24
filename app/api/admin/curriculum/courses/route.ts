import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { getYouTubeEmbedUrl } from '../../../../lib/youtube'

export const dynamic = 'force-dynamic'

function checkAdminAuth(req: NextRequest): boolean {
  const adminCookie = req.cookies.get('c2b_admin_session')?.value
  const authHeader = req.headers.get('Authorization')
  return Boolean(adminCookie || authHeader)
}

export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 })
    }

    const coursesRef = collection(db, 'curriculum_courses')
    let snap
    try {
      const q = query(coursesRef, orderBy('order', 'asc'))
      snap = await getDocs(q)
    } catch {
      snap = await getDocs(coursesRef)
    }

    // Also get module counts per course
    const modulesRef = collection(db, 'curriculum_modules')
    const modSnap = await getDocs(modulesRef).catch(() => null)
    const modCountMap: Record<string, number> = {}
    if (modSnap) {
      modSnap.docs.forEach((d) => {
        const cId = d.data().courseId
        if (cId) modCountMap[cId] = (modCountMap[cId] || 0) + 1
      })
    }

    // If no courses exist yet, auto-seed default course
    if (snap.empty) {
      const defaultCourse = {
        title: 'Chat2Build: Build Your First Web App with AI',
        description: 'A 2-week intensive bootcamp teaching non-programmers how to design, build, and deploy production-ready web applications using modern AI workflows.',
        introTitle: 'Orientation & Course Overview',
        introVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        introEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        introSlideUrl: '',
        introDuration: '15 mins',
        introNotes: 'Welcome to Chat2Build! Watch this orientation class to learn about the curriculum schedule, Stitch UI setup, and cohort community.',
        introViewCount: 0,
        order: 1,
        createdAt: serverTimestamp(),
      }
      const newDoc = await addDoc(coursesRef, defaultCourse)
      return NextResponse.json({
        courses: [
          {
            id: newDoc.id,
            ...defaultCourse,
            moduleCount: 0,
            createdAt: new Date().toISOString(),
          },
        ],
      })
    }

    const courses = snap.docs.map((docSnap) => {
      const d = docSnap.data()
      return {
        id: docSnap.id,
        title: d.title || 'Untitled Course',
        description: d.description || '',
        thumbnailUrl: d.thumbnailUrl || '',
        introTitle: d.introTitle || 'Course Orientation & Setup',
        introVideoUrl: d.introVideoUrl || '',
        introEmbedUrl: getYouTubeEmbedUrl(d.introVideoUrl || d.introEmbedUrl || ''),
        introSlideUrl: d.introSlideUrl || '',
        introDuration: d.introDuration || '15 mins',
        introNotes: d.introNotes || '',
        introViewCount: d.introViewCount || 0,
        order: d.order ?? 1,
        moduleCount: modCountMap[docSnap.id] || 0,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null,
      }
    })

    courses.sort((a, b) => a.order - b.order)
    return NextResponse.json({ courses })
  } catch (err: any) {
    console.error('[Admin Courses GET error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch courses.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const title = (body.title || '').trim()
    const description = (body.description || '').trim()
    const introTitle = (body.introTitle || 'Course Orientation & Setup').trim()
    const introVideoUrl = (body.introVideoUrl || '').trim()
    const introSlideUrl = (body.introSlideUrl || '').trim()
    const introDuration = (body.introDuration || '15 mins').trim()
    const introNotes = (body.introNotes || '').trim()
    const order = Number(body.order) || 1

    if (!title) {
      return NextResponse.json({ error: 'Course title is required.' }, { status: 400 })
    }

    const coursesRef = collection(db, 'curriculum_courses')
    const docRef = await addDoc(coursesRef, {
      title,
      description,
      introTitle,
      introVideoUrl,
      introEmbedUrl: introVideoUrl ? getYouTubeEmbedUrl(introVideoUrl) : '',
      introSlideUrl,
      introDuration,
      introNotes,
      introViewCount: 0,
      order,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      course: {
        id: docRef.id,
        title,
        description,
        introTitle,
        introVideoUrl,
        introSlideUrl,
        introDuration,
        introNotes,
        order,
      },
    })
  } catch (err: any) {
    console.error('[Admin Courses POST error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to create course.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const id = body.id
    if (!id) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 })
    }

    const title = body.title?.trim()
    const description = body.description?.trim()
    const introTitle = body.introTitle?.trim()
    const introVideoUrl = body.introVideoUrl?.trim()
    const introSlideUrl = body.introSlideUrl?.trim()
    const introDuration = body.introDuration?.trim()
    const introNotes = body.introNotes?.trim()
    const order = body.order !== undefined ? Number(body.order) : undefined

    const courseDocRef = doc(db, 'curriculum_courses', id)
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (introTitle !== undefined) updateData.introTitle = introTitle
    if (introVideoUrl !== undefined) {
      updateData.introVideoUrl = introVideoUrl
      updateData.introEmbedUrl = getYouTubeEmbedUrl(introVideoUrl)
    }
    if (introSlideUrl !== undefined) updateData.introSlideUrl = introSlideUrl
    if (introDuration !== undefined) updateData.introDuration = introDuration
    if (introNotes !== undefined) updateData.introNotes = introNotes
    if (order !== undefined) updateData.order = order

    await updateDoc(courseDocRef, updateData)

    return NextResponse.json({ success: true, message: 'Course updated successfully.' })
  } catch (err: any) {
    console.error('[Admin Courses PUT error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to update course.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 })
    }

    await deleteDoc(doc(db, 'curriculum_courses', id))
    return NextResponse.json({ success: true, message: 'Course deleted successfully.' })
  } catch (err: any) {
    console.error('[Admin Courses DELETE error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete course.' }, { status: 500 })
  }
}
