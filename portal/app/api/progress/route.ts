import { NextRequest, NextResponse } from 'next/server'
import { parseSessionToken } from '../../../lib/auth'
import { db } from '../../../lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('c2b_student_session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Please log in to update progress.' }, { status: 401 })
    }

    const session = parseSessionToken(token)
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const classId = (body.classId || '').trim()
    const completed = Boolean(body.completed)

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required.' }, { status: 400 })
    }

    const userDocRef = doc(db, 'student_users', session.email)
    const userSnap = await getDoc(userDocRef)
    const existing = userSnap.exists() ? userSnap.data() : {}
    let list: string[] = existing.completedClasses || []

    if (completed) {
      if (!list.includes(classId)) list.push(classId)
    } else {
      list = list.filter((id) => id !== classId)
    }

    await setDoc(
      userDocRef,
      {
        email: session.email,
        completedClasses: list,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({
      success: true,
      completedClasses: list,
    })
  } catch (err: any) {
    console.error('[Progress Update Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to update progress.' }, { status: 500 })
  }
}
