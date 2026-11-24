import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawEmail = (body.email || '').trim().toLowerCase()

    if (!rawEmail || !rawEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // 1. Verify against the main site registrations collection
    const regRef = collection(db, 'registrations')
    const q = query(regRef, where('email', '==', rawEmail))
    const regSnap = await getDocs(q)

    if (regSnap.empty) {
      return NextResponse.json({
        registered: false,
        error: 'Account does not exist. Please register on chat2build.pro first.',
        registrationUrl: 'https://chat2build.pro/registration',
      })
    }

    // 2. Check if student has already initialized student_users profile & password
    const studentUserDoc = await getDoc(doc(db, 'student_users', rawEmail)).catch(() => null)
    const hasPasswordSet = Boolean(studentUserDoc?.exists() && studentUserDoc.data()?.passwordHash)

    return NextResponse.json({
      success: true,
      registered: true,
      email: rawEmail,
      hasPasswordSet,
    })
  } catch (err: any) {
    console.error('[Check Email Error]:', err)
    return NextResponse.json({ error: err.message || 'Error checking account status.' }, { status: 500 })
  }
}
