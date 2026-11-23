import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'

export const dynamic = 'force-dynamic'

function getTodayString(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const classId = body.classId?.trim()
    const courseId = body.courseId?.trim()
    const isIntro = Boolean(body.isIntro)
    const today = getTodayString()

    if (!classId && !courseId) {
      return NextResponse.json({ error: 'Class ID or Course ID required.' }, { status: 400 })
    }

    const viewsRef = collection(db, 'video_views')

    // 1. Record individual view event
    await addDoc(viewsRef, {
      classId: classId || 'intro',
      courseId: courseId || '',
      isIntro,
      date: today,
      createdAt: serverTimestamp(),
    })

    // 2. Increment counters on target doc
    let newTotal = 1

    if (isIntro && courseId) {
      try {
        const cRef = doc(db, 'curriculum_courses', courseId)
        await updateDoc(cRef, { introViewCount: increment(1) })
        const cSnap = await getDoc(cRef)
        newTotal = cSnap.data()?.introViewCount || 1
      } catch {}
    } else if (classId) {
      try {
        const clRef = doc(db, 'curriculum_classes', classId)
        await updateDoc(clRef, { viewCount: increment(1) })
        const clSnap = await getDoc(clRef)
        newTotal = clSnap.data()?.viewCount || 1
      } catch {}
    }

    // 3. Count today's views
    let todayCount = 1
    try {
      const targetId = isIntro ? 'intro' : classId
      const q = query(viewsRef, where('classId', '==', targetId), where('date', '==', today))
      const todaySnap = await getDocs(q)
      todayCount = todaySnap.size || 1
    } catch {}

    return NextResponse.json({
      success: true,
      viewCount: newTotal,
      todayViews: todayCount,
    })
  } catch (err: any) {
    console.error('[Views API error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to record view.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const isIntro = searchParams.get('isIntro') === 'true'
    const today = getTodayString()

    const targetId = isIntro ? 'intro' : classId
    if (!targetId) {
      return NextResponse.json({ viewCount: 0, todayViews: 0 })
    }

    const viewsRef = collection(db, 'video_views')
    let todayCount = 0
    let totalCount = 0

    try {
      const qToday = query(viewsRef, where('classId', '==', targetId), where('date', '==', today))
      const snapToday = await getDocs(qToday)
      todayCount = snapToday.size

      const qTotal = query(viewsRef, where('classId', '==', targetId))
      const snapTotal = await getDocs(qTotal)
      totalCount = snapTotal.size
    } catch {}

    return NextResponse.json({
      viewCount: totalCount,
      todayViews: todayCount,
    })
  } catch (err: any) {
    return NextResponse.json({ viewCount: 0, todayViews: 0 })
  }
}
