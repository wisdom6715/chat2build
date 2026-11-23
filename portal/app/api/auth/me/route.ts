import { NextRequest, NextResponse } from 'next/server'
import { parseSessionToken } from '../../../../lib/auth'
import { db } from '../../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get('c2b_student_session')?.value ||
      req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const session = parseSessionToken(token)
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Fetch user progress
    const userDoc = await getDoc(doc(db, 'student_users', session.email)).catch(() => null)
    const userData = userDoc?.exists() ? userDoc.data() : {}

    return NextResponse.json({
      authenticated: true,
      email: session.email,
      name: userData.name || session.name || 'Student',
      completedClasses: userData.completedClasses || [],
      hasPasswordSet: Boolean(userData.passwordHash),
    })
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 })
  }
}
