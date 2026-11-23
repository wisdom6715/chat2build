import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { createSessionToken } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').trim().toLowerCase()
    const otp = (body.otp || '').trim()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 })
    }

    const otpDocRef = doc(db, 'student_otps', email)
    const otpSnap = await getDoc(otpDocRef)

    if (!otpSnap.exists()) {
      return NextResponse.json({ error: 'No verification code found. Please request a new code.' }, { status: 400 })
    }

    const data = otpSnap.data()
    if (data.used) {
      return NextResponse.json({ error: 'This code has already been used. Please request a new one.' }, { status: 400 })
    }

    if (Date.now() > data.expiresAt) {
      return NextResponse.json({ error: 'This code has expired. Please request a fresh code.' }, { status: 400 })
    }

    if (data.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect verification code. Please check and try again.' }, { status: 400 })
    }

    // Mark OTP as used
    await updateDoc(otpDocRef, { used: true })

    // Check if student has password set
    const userDocRef = doc(db, 'student_users', email)
    const userSnap = await getDoc(userDocRef)
    const hasPasswordSet = Boolean(userSnap.exists() && userSnap.data()?.passwordHash)

    // Create session token
    const token = createSessionToken({
      email,
      name: userSnap.data()?.name || 'Student',
      loginTime: Date.now(),
    })

    const response = NextResponse.json({
      success: true,
      verified: true,
      hasPasswordSet,
      token,
    })

    // Set cookie
    response.cookies.set('c2b_student_session', token, {
      path: '/',
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    })

    return response
  } catch (err: any) {
    console.error('[Verify OTP Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to verify code.' }, { status: 500 })
  }
}
