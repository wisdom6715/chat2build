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
  where,
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

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    const today = getTodayString()

    // 1. Fetch today's unique view counts from video_unique_viewers
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

    const classesRef = collection(db, 'curriculum_classes')
    let snap

    try {
      if (moduleId) {
        const q = query(classesRef, where('moduleId', '==', moduleId), orderBy('order', 'asc'))
        snap = await getDocs(q)
      } else {
        const q = query(classesRef, orderBy('order', 'asc'))
        snap = await getDocs(q)
      }
    } catch {
      if (moduleId) {
        const q = query(classesRef, where('moduleId', '==', moduleId))
        snap = await getDocs(q)
      } else {
        snap = await getDocs(classesRef)
      }
    }

    const classes = snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        moduleId: data.moduleId || '',
        title: data.title || '',
        classNumber: data.classNumber ?? 1,
        order: data.order ?? 1,
        youtubeUrl: data.youtubeUrl || '',
        embedUrl: getYouTubeEmbedUrl(data.youtubeUrl || data.embedUrl || ''),
        slideUrl: data.slideUrl || '',
        duration: data.duration || '',
        notes: data.notes || '',
        viewCount: data.viewCount || 0,
        todayViews: todayViewCounts[docSnap.id] || 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      }
    })

    classes.sort((a, b) => a.order - b.order)

    return NextResponse.json({ classes })
  } catch (err: any) {
    console.error('[Admin Classes GET error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch classes.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const moduleId = (body.moduleId || '').trim()
    const title = (body.title || '').trim()
    const classNumber = Number(body.classNumber) || 1
    const order = Number(body.order) || classNumber
    const youtubeUrl = (body.youtubeUrl || '').trim()
    const slideUrl = (body.slideUrl || '').trim()
    const duration = (body.duration || '').trim()
    const notes = (body.notes || '').trim()

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required to create a class.' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'Class title is required.' }, { status: 400 })
    }

    const embedUrl = getYouTubeEmbedUrl(youtubeUrl)

    const classesRef = collection(db, 'curriculum_classes')
    const docRef = await addDoc(classesRef, {
      moduleId,
      title,
      classNumber,
      order,
      youtubeUrl,
      embedUrl,
      slideUrl,
      duration,
      notes,
      viewCount: 0,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      class: {
        id: docRef.id,
        moduleId,
        title,
        classNumber,
        order,
        youtubeUrl,
        embedUrl,
        slideUrl,
        duration,
        notes,
        viewCount: 0,
        todayViews: 0,
      },
    })
  } catch (err: any) {
    console.error('[Admin Classes POST error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to create class.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Class ID is required for update.' }, { status: 400 })
    }

    const title = (body.title || '').trim()
    const classNumber = Number(body.classNumber) || 1
    const order = Number(body.order) ?? classNumber
    const youtubeUrl = (body.youtubeUrl || '').trim()
    const slideUrl = (body.slideUrl || '').trim()
    const duration = (body.duration || '').trim()
    const notes = (body.notes || '').trim()
    const moduleId = body.moduleId?.trim()

    const embedUrl = getYouTubeEmbedUrl(youtubeUrl)

    const classDocRef = doc(db, 'curriculum_classes', id)
    await updateDoc(classDocRef, {
      ...(moduleId && { moduleId }),
      ...(title && { title }),
      classNumber,
      order,
      youtubeUrl,
      embedUrl,
      slideUrl,
      duration,
      notes,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({ success: true, message: 'Class updated successfully.' })
  } catch (err: any) {
    console.error('[Admin Classes PUT error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to update class.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Class ID is required.' }, { status: 400 })
    }

    await deleteDoc(doc(db, 'curriculum_classes', id))

    return NextResponse.json({ success: true, message: 'Class deleted successfully.' })
  } catch (err: any) {
    console.error('[Admin Classes DELETE error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete class.' }, { status: 500 })
  }
}
