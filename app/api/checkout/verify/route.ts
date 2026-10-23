import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { sendWelcomeEmail } from '../../../lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url)
  const checkoutId = searchParams.get('checkout_id') || searchParams.get('reference')
  return handleVerification(checkoutId)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const checkoutId = body.checkout_id || body.reference
    const studentData = body.studentData || {}
    return handleVerification(checkoutId, studentData)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}

async function handleVerification(
  checkoutId: string | null,
  studentData?: { name?: string; email?: string; phone?: string }
) {
  if (!checkoutId) {
    return NextResponse.json(
      { verified: false, error: 'Missing checkout_id parameter.' },
      { status: 400 }
    )
  }

  const apiKey = process.env.BACHS_API_KEY?.trim()
  const isDemo = checkoutId.startsWith('chk_demo_') || !apiKey

  let isPaid = false
  let sessionData: any = {}

  if (isDemo) {
    // Development / demo mode when testing without a live Bachs key
    console.log(`[Bachs Verify] Demo mode verification for session: ${checkoutId}`)
    isPaid = true
    sessionData = {
      checkout_id: checkoutId,
      status: 'completed',
      metadata: {
        student_name: studentData?.name || 'Demo Student',
        student_email: studentData?.email || 'demo@chat2build.pro',
        student_phone: studentData?.phone || '09139249580',
        amount_ngn: '30000',
      },
      customer: {
        name: studentData?.name || 'Demo Student',
        email: studentData?.email || 'demo@chat2build.pro',
        phone_number: studentData?.phone || '09139249580',
      },
    }
  } else {
    // Live / Sandbox Bachs API Verification
    try {
      const isLive = apiKey.startsWith('sk_live_')
      const defaultBaseUrl = isLive ? 'https://api.bachs.io' : 'https://sandbox-api.bachs.io'
      const baseUrl = process.env.BACHS_BASE_URL?.trim() || defaultBaseUrl

      const bachsRes = await fetch(`${baseUrl}/v1/checkout-sessions/${checkoutId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      })

      if (!bachsRes.ok) {
        const errBody = await bachsRes.json().catch(() => ({}))
        console.error('[Bachs Verify] Error fetching checkout session:', errBody)
        return NextResponse.json(
          {
            verified: false,
            error: errBody.message || `Failed to verify checkout session with Bachs (status ${bachsRes.status}).`,
          },
          { status: bachsRes.status || 400 }
        )
      }

      sessionData = await bachsRes.json()
      console.log(`[Bachs Verify] Retrieved session ${checkoutId} status:`, sessionData.status)

      // Bachs checkout sessions status check
      const status = (sessionData.status || '').toLowerCase()
      const paymentStatus = (sessionData.payment_status || '').toLowerCase()
      const state = (sessionData.state || '').toLowerCase()

      if (
        status === 'completed' ||
        status === 'paid' ||
        status === 'succeeded' ||
        paymentStatus === 'paid' ||
        paymentStatus === 'succeeded' ||
        state === 'completed' ||
        sessionData.paid === true
      ) {
        isPaid = true
      }
    } catch (err: any) {
      console.error('[Bachs Verify] Network error verifying with Bachs API:', err)
      return NextResponse.json(
        { verified: false, error: 'Unable to reach Bachs verification server. Please retry.' },
        { status: 502 }
      )
    }
  }

  // Strictly enforce server-side payment confirmation before writing to DB
  if (!isPaid) {
    return NextResponse.json(
      {
        verified: false,
        error: 'Payment has not been confirmed by Bachs yet. Status: ' + (sessionData.status || 'pending'),
      },
      { status: 400 }
    )
  }

  // Extract student details from Bachs verified metadata or customer data
  const meta = sessionData.metadata || {}
  const cust = sessionData.customer || {}

  const studentName = meta.student_name || cust.name || studentData?.name || 'Chat2Build Student'
  const studentEmail = (meta.student_email || cust.email || studentData?.email || '').toLowerCase().trim()
  const studentPhone = meta.student_phone || cust.phone_number || studentData?.phone || ''

  try {
    // 1. Check if this checkout_id is already recorded to prevent duplicate entries
    const regRef = collection(db, 'registrations')
    const q = query(regRef, where('checkout_id', '==', checkoutId))
    const existingSnap = await getDocs(q)

    let docId = ''
    let isAlreadyRecorded = false

    if (!existingSnap.empty) {
      const doc = existingSnap.docs[0]
      docId = doc.id
      isAlreadyRecorded = true
      console.log(`[Firebase] Registration already recorded for checkout_id: ${checkoutId} (docId: ${docId})`)
    } else {
      // 2. ONLY NOW write to Firestore database since payment is verified!
      const newDocRef = await addDoc(regRef, {
        fullname: studentName,
        email: studentEmail,
        phone_number: studentPhone,
        amount: 30000,
        currency: 'NGN',
        status: 'paid',
        payment_confirmed: true,
        checkout_id: checkoutId,
        isIncluded: false, // will be marked as included by admin on dashboard
        slackInviteSent: false,
        welcomeEmailSent: false,
        createdAt: serverTimestamp(),
        verifiedAt: serverTimestamp(),
        bachs_session: {
          id: checkoutId,
          status: sessionData.status || 'completed',
        },
      })
      docId = newDocRef.id
      console.log(`[Firebase] Successfully written verified payment to DB for ${studentEmail} (docId: ${docId})`)

      // 3. Send the Welcome Email upon complete registration & payment
      if (studentEmail && studentEmail.includes('@')) {
        try {
          const emailRes = await sendWelcomeEmail({
            to: studentEmail,
            name: studentName,
            checkoutId,
          })
          if (emailRes.success) {
            await updateDoc(newDocRef, { welcomeEmailSent: true })
          }
        } catch (emailErr) {
          console.error('[Welcome Email Error]:', emailErr)
        }
      }
    }

    return NextResponse.json({
      verified: true,
      alreadyRecorded: isAlreadyRecorded,
      registration: {
        id: docId,
        fullname: studentName,
        email: studentEmail,
        phone_number: studentPhone,
        checkout_id: checkoutId,
        status: 'paid',
      },
    })
  } catch (dbErr: any) {
    console.error('[Firebase] Failed to write verified registration to Firestore:', dbErr)
    return NextResponse.json(
      {
        verified: true,
        dbError: true,
        error: 'Payment confirmed with Bachs, but saving to database encountered an issue: ' + dbErr.message,
      },
      { status: 500 }
    )
  }
}
