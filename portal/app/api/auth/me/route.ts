import { NextRequest, NextResponse } from 'next/server'
import { parseSessionToken } from '../../../../lib/auth'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'

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

    const email = session.email.trim().toLowerCase()

    // Fetch user progress & profile
    const userDocRef = doc(db, 'student_users', email)
    const userDoc = await getDoc(userDocRef).catch(() => null)
    const userData = userDoc?.exists() ? userDoc.data() : {}

    let resolvedName: string = userData.name || ''

    // If name is missing or generic 'Student', look it up from registrations collection
    if (!resolvedName || resolvedName.trim().toLowerCase() === 'student') {
      try {
        const regRef = collection(db, 'registrations')
        const q = query(regRef, where('email', '==', email))
        const regSnap = await getDocs(q)

        if (!regSnap.empty) {
          const regData = regSnap.docs[0].data()
          const regName = (regData.fullname || regData.name || '').trim()
          if (regName) {
            resolvedName = regName
            // Persist real name to student_users so future reads are instant
            await setDoc(userDocRef, { name: resolvedName }, { merge: true }).catch(() => null)
          }
        }
      } catch {}
    }

    if (!resolvedName) {
      resolvedName =
        session.name && session.name.trim().toLowerCase() !== 'student'
          ? session.name
          : email.split('@')[0]
    }

    return NextResponse.json({
      authenticated: true,
      email,
      name: resolvedName,
      completedClasses: userData.completedClasses || [],
      hasPasswordSet: Boolean(userData.passwordHash),
    })
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 })
  }
}
