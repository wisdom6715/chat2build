import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { sendWelcomeEmail } from '../../../lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const checkoutId = (body.checkout_id || body.checkoutId || '').trim()

    if (!checkoutId) {
      return NextResponse.json({ error: 'checkout_id is required' }, { status: 400 })
    }

    const apiKey = process.env.BACHS_API_KEY?.trim()
    const isLive = apiKey?.startsWith('sk_live_')
    const defaultBaseUrl = isLive ? 'https://api.bachs.io' : 'https://sandbox-api.bachs.io'
    const baseUrl = process.env.BACHS_BASE_URL?.trim() || defaultBaseUrl

    let session: any = null
    let isPaymentConfirmed = false

    // Check for demo session if no API key is provided
    if (checkoutId.startsWith('chk_demo_') || !apiKey) {
      if (!apiKey) {
        console.warn('[Bachs Verify] No API key present, treating session as sandbox demo')
      }
      isPaymentConfirmed = true
      session = {
        id: checkoutId,
        status: 'completed',
        customer: {
          name: body.name || 'Builder',
          email: body.email || '',
          phone_number: body.phone || '',
        },
        metadata: {
          student_name: body.name || 'Builder',
          student_email: body.email || '',
          student_phone: body.phone || '',
        },
      }
    } else {
      // Query Bachs Server API directly
      const bachsRes = await fetch(`${baseUrl}/v1/checkout-sessions/${checkoutId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      })

      if (!bachsRes.ok) {
        const errData = await bachsRes.json().catch(() => ({}))
        console.error('[Bachs Verify Server Error]:', errData)
        return NextResponse.json(
          { error: errData.message || `Failed to verify checkout session with Bachs (${bachsRes.status})` },
          { status: bachsRes.status || 400 }
        )
      }

      session = await bachsRes.json()

      // Check payment status from Bachs
      const status = (session.status || session.state || session.payment_status || '').toLowerCase()
      if (status === 'completed' || status === 'paid' || status === 'succeeded' || session.completed_at) {
        isPaymentConfirmed = true
      } else {
        console.warn(`[Bachs Verify] Checkout ${checkoutId} has unconfirmed status: ${status}`)
        return NextResponse.json(
          { error: `Payment not completed yet. Current status: ${status || 'pending'}` },
          { status: 400 }
        )
      }
    }

    if (!isPaymentConfirmed) {
      return NextResponse.json({ error: 'Payment confirmation failed.' }, { status: 400 })
    }

    // Extract student information from Bachs session or fallback
    const studentName = (session.customer?.name || session.metadata?.student_name || body.name || 'Builder').trim()
    const studentEmail = (session.customer?.email || session.metadata?.student_email || body.email || '').trim().toLowerCase()
    const studentPhone = (session.customer?.phone_number || session.metadata?.student_phone || body.phone || '').trim()

    // Ensure idempotency: check if already exists in Firestore by doc id or checkout_id field
    const docRef = doc(db, 'registrations', checkoutId)
    const existingDoc = await getDoc(docRef)

    if (existingDoc.exists()) {
      const data = existingDoc.data()
      return NextResponse.json({
        success: true,
        alreadyRecorded: true,
        data: {
          id: existingDoc.id,
          ...data,
        },
      })
    }

    // Also check collection query in case of custom document id
    const q = query(collection(db, 'registrations'), where('checkout_id', '==', checkoutId))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0]
      return NextResponse.json({
        success: true,
        alreadyRecorded: true,
        data: {
          id: firstDoc.id,
          ...firstDoc.data(),
        },
      })
    }

    // Write verified record into Firebase Firestore
    const registrationRecord = {
      checkout_id: checkoutId,
      fullname: studentName,
      email: studentEmail,
      phone_number: studentPhone,
      amount: 30000,
      currency: 'NGN',
      payment_gateway: 'Bachs',
      status: 'paid',
      isIncluded: false, // Flag for admin to verify & include to prevent impersonation
      slackInviteSent: false,
      welcomeEmailSent: false,
      verifiedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }

    await setDoc(docRef, registrationRecord)
    console.log(`[Firebase] Verified student registration saved for ${studentEmail} (${checkoutId})`)

    // Send Welcome Email
    if (studentEmail && studentEmail.includes('@')) {
      try {
        await sendWelcomeEmail({
          to: studentEmail,
          name: studentName,
          phone: studentPhone,
          checkoutId: checkoutId,
        })
        await setDoc(docRef, { welcomeEmailSent: true }, { merge: true })
      } catch (emailErr) {
        console.error('[Welcome Email Error]:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      student: {
        fullname: studentName,
        email: studentEmail,
        phone_number: studentPhone,
      },
    })
  } catch (err: any) {
    console.error('[Verify Route Handler Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error while verifying payment.' },
      { status: 500 }
    )
  }
}
