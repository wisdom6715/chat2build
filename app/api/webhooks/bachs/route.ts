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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let event: any = {}
    try {
      event = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { type, data } = event

    console.log(`[Bachs Webhook] Received event: ${type}`, data)

    if (type === 'checkout.completed' || type === 'collection.succeeded') {
      const checkoutId = data?.checkout_id || data?.id || data?.metadata?.checkout_id
      const meta = data?.metadata || {}
      const cust = data?.customer || {}

      const studentName = meta.student_name || cust.name || 'Chat2Build Student'
      const studentEmail = (meta.student_email || cust.email || '').toLowerCase().trim()
      const studentPhone = meta.student_phone || cust.phone_number || ''

      if (checkoutId) {
        try {
          const regRef = collection(db, 'registrations')
          const q = query(regRef, where('checkout_id', '==', checkoutId))
          const existingSnap = await getDocs(q)

          if (existingSnap.empty) {
            // Write confirmed payment to Firestore
            const newDoc = await addDoc(regRef, {
              fullname: studentName,
              email: studentEmail,
              phone_number: studentPhone,
              amount: 30000,
              currency: 'NGN',
              status: 'paid',
              payment_confirmed: true,
              checkout_id: checkoutId,
              isIncluded: false,
              slackInviteSent: false,
              welcomeEmailSent: false,
              createdAt: serverTimestamp(),
              verifiedAt: serverTimestamp(),
              source: 'bachs_webhook',
            })

            console.log(`[Bachs Webhook] Payment confirmed and saved to DB for ${studentEmail}`)

            // Send welcome email
            if (studentEmail && studentEmail.includes('@')) {
              try {
                const res = await sendWelcomeEmail({
                  to: studentEmail,
                  name: studentName,
                  checkoutId,
                })
                if (res.success) {
                  await updateDoc(newDoc, { welcomeEmailSent: true })
                }
              } catch (emailErr) {
                console.error('[Bachs Webhook] Failed to send welcome email:', emailErr)
              }
            }
          } else {
            console.log(`[Bachs Webhook] Registration already recorded for checkout ${checkoutId}`)
          }
        } catch (dbErr) {
          console.error('[Bachs Webhook] DB write error:', dbErr)
        }
      }
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Bachs Webhook Error]:', err)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
