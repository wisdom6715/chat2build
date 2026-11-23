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

export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')

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
      // Fallback if index isn't ready
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
        embedUrl: data.embedUrl || getYouTubeEmbedUrl(data.youtubeUrl || ''),
        slideUrl: data.slideUrl || '',
        duration: data.duration || '',
        notes: data.notes || '',
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
      return NextResponse.json({ error: 'Please select a module/week.' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Class title is required.' }, { status: 400 })
    }

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube video URL is required.' }, { status: 400 })
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
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      classItem: {
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
      return NextResponse.json({ error: 'Class ID is required.' }, { status: 400 })
    }

    const moduleId = body.moduleId?.trim()
    const title = body.title?.trim()
    const classNumber = body.classNumber !== undefined ? Number(body.classNumber) : undefined
    const order = body.order !== undefined ? Number(body.order) : undefined
    const youtubeUrl = body.youtubeUrl?.trim()
    const slideUrl = body.slideUrl?.trim()
    const duration = body.duration?.trim()
    const notes = body.notes?.trim()

    const classDocRef = doc(db, 'curriculum_classes', id)
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    }

    if (moduleId) updateData.moduleId = moduleId
    if (title) updateData.title = title
    if (classNumber !== undefined) updateData.classNumber = classNumber
    if (order !== undefined) updateData.order = order
    if (youtubeUrl !== undefined) {
      updateData.youtubeUrl = youtubeUrl
      updateData.embedUrl = getYouTubeEmbedUrl(youtubeUrl)
    }
    if (slideUrl !== undefined) updateData.slideUrl = slideUrl
    if (duration !== undefined) updateData.duration = duration
    if (notes !== undefined) updateData.notes = notes

    await updateDoc(classDocRef, updateData)

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
