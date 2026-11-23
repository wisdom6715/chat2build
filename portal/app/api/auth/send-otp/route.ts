import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { generateOTP } from '../../../../lib/auth'
import { sendOtpEmail } from '../../../../lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawEmail = (body.email || '').trim().toLowerCase()

    if (!rawEmail || !rawEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // 1. Must be registered on main site
    const regRef = collection(db, 'registrations')
    const q = query(regRef, where('email', '==', rawEmail))
    const regSnap = await getDocs(q)

    if (regSnap.empty) {
      return NextResponse.json(
        {
          error: 'Account does not exist. Please register on chat2build.pro first.',
          registrationUrl: 'https://chat2build.pro/registration',
        },
        { status: 403 }
      )
    }

    const studentName = regSnap.docs[0].data()?.fullname || regSnap.docs[0].data()?.name || 'Student'

    // 2. Generate 6-digit OTP
    const otp = generateOTP()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // 3. Save OTP in Firestore
    await setDoc(doc(db, 'student_otps', rawEmail), {
      email: rawEmail,
      otp,
      expiresAt,
      used: false,
      updatedAt: serverTimestamp(),
    })

    // 4. Send email via Resend
    const emailResult = await sendOtpEmail({
      to: rawEmail,
      name: studentName,
      otp,
    })

    if (!emailResult.success && !emailResult.mocked) {
      return NextResponse.json({ error: 'Failed to send login code. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
      mocked: emailResult.mocked || false,
    })
  } catch (err: any) {
    console.error('[Send OTP Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to send verification code.' }, { status: 500 })
  }
}
