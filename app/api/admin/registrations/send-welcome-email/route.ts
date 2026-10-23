import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { sendWelcomeEmail } from '../../../../lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id, email, name, checkoutId } = body

    if (!email) {
      return NextResponse.json({ error: 'Student email is required.' }, { status: 400 })
    }

    // 1. Send the official welcome email with WhatsApp assistant action & disclaimer
    const emailResult = await sendWelcomeEmail({
      to: email,
      name: name || 'Builder',
      checkoutId,
    })

    // 2. Update status in Firestore if registration doc ID is provided
    if (id) {
      try {
        const regDocRef = doc(db, 'registrations', id)
        await updateDoc(regDocRef, {
          welcomeEmailSent: true,
          welcomeEmailSentAt: serverTimestamp(),
        })
      } catch (dbErr) {
        console.warn('[Admin Welcome Email] DB record update warning:', dbErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Welcome email successfully sent to ${email}`,
      mocked: (emailResult as any)?.mocked || false,
    })
  } catch (err: any) {
    console.error('[Admin Send Welcome Email Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to send welcome email.' },
      { status: 500 }
    )
  }
}
