import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { hashPassword, createSessionToken } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').trim().toLowerCase()
    const password = (body.password || '').trim()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    // Fetch existing student info if any
    const userDocRef = doc(db, 'student_users', email)
    const existingSnap = await getDoc(userDocRef)
    const existingData = existingSnap.exists() ? existingSnap.data() : {}

    let studentName: string = existingData.name || ''
    if (!studentName || studentName.trim().toLowerCase() === 'student') {
      try {
        const regSnap = await getDocs(query(collection(db, 'registrations'), where('email', '==', email)))
        if (!regSnap.empty) {
          const regData = regSnap.docs[0].data()
          studentName = (regData.fullname || regData.name || '').trim()
        }
      } catch {}
    }

    if (!studentName) {
      studentName = email.split('@')[0]
    }

    await setDoc(
      userDocRef,
      {
        email,
        name: studentName,
        passwordHash,
        hasPasswordSet: true,
        updatedAt: serverTimestamp(),
        ...(!existingSnap.exists() && {
          createdAt: serverTimestamp(),
          completedClasses: [],
        }),
      },
      { merge: true }
    )

    const token = createSessionToken({
      email,
      name: studentName,
      loginTime: Date.now(),
    })

    const res = NextResponse.json({
      success: true,
      message: 'Password set successfully!',
      token,
    })

    res.cookies.set('c2b_student_session', token, {
      path: '/',
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    })

    return res
  } catch (err: any) {
    console.error('[Set Password Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to set password.' }, { status: 500 })
  }
}
