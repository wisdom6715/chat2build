import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { verifyPassword, createSessionToken } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').trim().toLowerCase()
    const password = (body.password || '').trim()

    if (!email || !password) {
      return NextResponse.json({ error: 'Please enter your email and password.' }, { status: 400 })
    }

    const userDocRef = doc(db, 'student_users', email)
    const userSnap = await getDoc(userDocRef)

    if (!userSnap.exists() || !userSnap.data()?.passwordHash) {
      return NextResponse.json(
        { error: 'No password is set for this account yet. Please log in with a verification code.' },
        { status: 400 }
      )
    }

    const isValid = await verifyPassword(password, userSnap.data().passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password. Please try again or reset your password.' }, { status: 401 })
    }

    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
    }).catch(() => null)

    const token = createSessionToken({
      email,
      name: userSnap.data()?.name || 'Student',
      loginTime: Date.now(),
    })

    const res = NextResponse.json({
      success: true,
      message: 'Logged in successfully!',
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
    console.error('[Login Password Error]:', err)
    return NextResponse.json({ error: err.message || 'Login failed.' }, { status: 500 })
  }
}
