import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { sendSlackInviteEmail } from '../../../../lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id, email, name, customInviteUrl } = body

    if (!email) {
      return NextResponse.json({ error: 'Student email is required.' }, { status: 400 })
    }

    // 1. Send the Slack invitation email
    const emailResult = await sendSlackInviteEmail({
      to: email,
      name: name || 'Builder',
      customInviteUrl,
    })

    // 2. If registration document ID provided, update status in Firestore
    if (id) {
      try {
        const regDocRef = doc(db, 'registrations', id)
        await updateDoc(regDocRef, {
          slackInviteSent: true,
          slackInviteSentAt: serverTimestamp(),
        })
      } catch (dbErr) {
        console.warn('[Admin Slack Invite] DB record update warning:', dbErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Slack invite successfully sent to ${email}`,
      mocked: (emailResult as any)?.mocked || false,
    })
  } catch (err: any) {
    console.error('[Admin Send Slack Invite Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to send Slack invite email.' },
      { status: 500 }
    )
  }
}
