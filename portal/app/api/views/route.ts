import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { parseSessionToken } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function sanitizeId(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_')
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

    // Identify the unique viewer (by session cookie or client viewerId)
    const token = req.cookies.get('c2b_portal_session')?.value
    const session = token ? parseSessionToken(token) : null
    let viewerId = (session?.email || body.viewerId || '').trim().toLowerCase()

    if (!viewerId) {
      viewerId = 'anonymous_viewer'
    }

    const targetId = isIntro ? `intro-${courseId || 'default'}` : classId
    const docKey = `${sanitizeId(targetId)}__${sanitizeId(viewerId)}`

    const viewerDocRef = doc(db, 'video_unique_viewers', docKey)
    const viewerDocSnap = await getDoc(viewerDocRef)

    if (!viewerDocSnap.exists()) {
      // First time this unique individual has EVER watched this video
      await setDoc(viewerDocRef, {
        targetId,
        classId: classId || '',
        courseId: courseId || '',
        isIntro,
        viewerId,
        firstViewedAt: serverTimestamp(),
        lastViewedAt: serverTimestamp(),
        lastViewedDate: today,
      })
    } else {
      // Returning view from the SAME person — update timestamp & date, do NOT duplicate
      await updateDoc(viewerDocRef, {
        lastViewedAt: serverTimestamp(),
        lastViewedDate: today,
      })
    }

    // Calculate actual unique independent viewers for this video
    const uvCollection = collection(db, 'video_unique_viewers')
    const qTotal = query(uvCollection, where('targetId', '==', targetId))
    const totalSnap = await getDocs(qTotal)
    const totalUniqueViewers = totalSnap.size

    // Calculate unique independent viewers TODAY
    let todayUniqueViewers = 0
    totalSnap.docs.forEach((d) => {
      if (d.data().lastViewedDate === today) {
        todayUniqueViewers++
      }
    })

    // Update aggregated count on course or class document for fast reads
    if (isIntro && courseId) {
      try {
        const cRef = doc(db, 'curriculum_courses', courseId)
        await updateDoc(cRef, { introViewCount: totalUniqueViewers })
      } catch {}
    } else if (classId) {
      try {
        const clRef = doc(db, 'curriculum_classes', classId)
        await updateDoc(clRef, { viewCount: totalUniqueViewers })
      } catch {}
    }

    return NextResponse.json({
      success: true,
      viewCount: totalUniqueViewers,
      todayViews: todayUniqueViewers,
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
    const courseId = searchParams.get('courseId')
    const isIntro = searchParams.get('isIntro') === 'true'
    const today = getTodayString()

    const targetId = isIntro ? `intro-${courseId || 'default'}` : classId
    if (!targetId) {
      return NextResponse.json({ viewCount: 0, todayViews: 0 })
    }

    const uvCollection = collection(db, 'video_unique_viewers')
    const qTotal = query(uvCollection, where('targetId', '==', targetId))
    const totalSnap = await getDocs(qTotal)
    const totalUniqueViewers = totalSnap.size

    let todayUniqueViewers = 0
    totalSnap.docs.forEach((d) => {
      if (d.data().lastViewedDate === today) {
        todayUniqueViewers++
      }
    })

    return NextResponse.json({
      viewCount: totalUniqueViewers,
      todayViews: todayUniqueViewers,
    })
  } catch (err: any) {
    return NextResponse.json({ viewCount: 0, todayViews: 0 })
  }
}
