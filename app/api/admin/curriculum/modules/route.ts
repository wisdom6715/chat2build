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
    const courseId = searchParams.get('courseId')

    const modulesRef = collection(db, 'curriculum_modules')
    let snap
    try {
      if (courseId) {
        const q = query(modulesRef, where('courseId', '==', courseId), orderBy('order', 'asc'))
        snap = await getDocs(q)
      } else {
        const q = query(modulesRef, orderBy('order', 'asc'))
        snap = await getDocs(q)
      }
    } catch {
      snap = await getDocs(modulesRef)
    }

    // Also fetch classes count per module
    const classesRef = collection(db, 'curriculum_classes')
    const classesSnap = await getDocs(classesRef).catch(() => null)
    const classCountMap: Record<string, number> = {}

    if (classesSnap) {
      classesSnap.docs.forEach((docSnap) => {
        const mId = docSnap.data().moduleId
        if (mId) {
          classCountMap[mId] = (classCountMap[mId] || 0) + 1
        }
      })
    }

    const modules = snap.docs
      .map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          courseId: data.courseId || '',
          title: data.title || '',
          weekNumber: data.weekNumber || 1,
          order: data.order ?? 1,
          description: data.description || '',
          classCount: classCountMap[docSnap.id] || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        }
      })
      .filter((m) => {
        if (!courseId) return true
        return m.courseId === courseId || (!m.courseId && courseId === 'default')
      })

    // Sort by order ascending
    modules.sort((a, b) => a.order - b.order)

    return NextResponse.json({ modules })
  } catch (err: any) {
    console.error('[Admin Modules GET error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch modules.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const courseId = (body.courseId || '').trim()
    const title = (body.title || '').trim()
    const weekNumber = Number(body.weekNumber) || 1
    const order = Number(body.order) || weekNumber
    const description = (body.description || '').trim()

    if (!title) {
      return NextResponse.json({ error: 'Module title is required.' }, { status: 400 })
    }

    const modulesRef = collection(db, 'curriculum_modules')
    const docRef = await addDoc(modulesRef, {
      courseId: courseId || '',
      title,
      weekNumber,
      order,
      description,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      module: {
        id: docRef.id,
        courseId: courseId || '',
        title,
        weekNumber,
        order,
        description,
      },
    })
  } catch (err: any) {
    console.error('[Admin Modules POST error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to create module.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Module ID is required for update.' }, { status: 400 })
    }

    const courseId = body.courseId?.trim()
    const title = (body.title || '').trim()
    const weekNumber = Number(body.weekNumber) || 1
    const order = Number(body.order) ?? weekNumber
    const description = (body.description || '').trim()

    const moduleDocRef = doc(db, 'curriculum_modules', id)
    await updateDoc(moduleDocRef, {
      ...(courseId !== undefined && { courseId }),
      ...(title && { title }),
      weekNumber,
      order,
      description,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({ success: true, message: 'Module updated successfully.' })
  } catch (err: any) {
    console.error('[Admin Modules PUT error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to update module.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Module ID is required.' }, { status: 400 })
    }

    // 1. Delete associated classes
    const classesRef = collection(db, 'curriculum_classes')
    const q = query(classesRef, where('moduleId', '==', id))
    const classesSnap = await getDocs(q)
    for (const classDoc of classesSnap.docs) {
      await deleteDoc(classDoc.ref)
    }

    // 2. Delete module
    await deleteDoc(doc(db, 'curriculum_modules', id))

    return NextResponse.json({ success: true, message: 'Module and associated classes deleted.' })
  } catch (err: any) {
    console.error('[Admin Modules DELETE error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete module.' }, { status: 500 })
  }
}
