import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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

    switch (type) {
      case 'checkout.completed':
      case 'collection.succeeded': {
        const checkoutId = data?.checkout_id || data?.id || data?.session_id
        if (!checkoutId) break

        const studentName = (data?.customer?.name || data?.metadata?.student_name || 'Builder').trim()
        const studentEmail = (data?.customer?.email || data?.metadata?.student_email || '').trim().toLowerCase()
        const studentPhone = (data?.customer?.phone_number || data?.metadata?.student_phone || '').trim()

        const docRef = doc(db, 'registrations', checkoutId)
        const existingDoc = await getDoc(docRef)

        if (!existingDoc.exists()) {
          const newRecord = {
            checkout_id: checkoutId,
            fullname: studentName,
            email: studentEmail,
            phone_number: studentPhone,
            amount: data?.amount ? Number(data.amount) : 30000,
            currency: data?.currency || 'NGN',
            payment_gateway: 'Bachs',
            status: 'paid',
            isIncluded: false,
            slackInviteSent: false,
            welcomeEmailSent: false,
            webhookVerified: true,
            verifiedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          }

          await setDoc(docRef, newRecord)
          console.log(`[Bachs Webhook] Student registration saved in Firestore for ${studentEmail}`)

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
              console.error('[Bachs Webhook] Welcome email error:', emailErr)
            }
          }
        } else {
          console.log(`[Bachs Webhook] Registration for ${checkoutId} already exists in Firestore.`)
        }
        break
      }

      case 'collection.failed':
        console.warn(`[Bachs Webhook] Payment collection failed for session ${data?.checkout_id}`)
        break

      default:
        console.log(`[Bachs Webhook] Unhandled event type: ${type}`)
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Bachs Webhook Error]:', err)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
