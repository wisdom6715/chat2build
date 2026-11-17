import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../lib/firebase'
import { collection, addDoc, getDocs, query, where, updateDoc, serverTimestamp } from 'firebase/firestore'
import { sendWelcomeEmail } from '../../lib/email'
import { normalizeSource } from '../../lib/constants'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = (body.fullname || body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const phone = (body.phone_number || body.phone || '').trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Please provide your full name.' }, { status: 400 })
    }

    if (!phone) {
      return NextResponse.json({ error: 'Please provide your phone / WhatsApp number.' }, { status: 400 })
    }

    // Parse and normalize acquisition source (x, meta, google, direct, etc.)
    const source = normalizeSource(body.source || body.sources || '')

    // 1. Check if student already registered with this email
    let docId = ''
    try {
      const regRef = collection(db, 'registrations')
      const q = query(regRef, where('email', '==', email))
      const existingSnap = await getDocs(q)

      if (!existingSnap.empty) {
        docId = existingSnap.docs[0].id
        console.log(`[Registration] Email already registered: ${email} (docId: ${docId})`)
        // Update source if missing
        try {
          const existingData = existingSnap.docs[0].data()
          if (!existingData.source && source !== 'direct') {
            await updateDoc(existingSnap.docs[0].ref, { source })
          }
        } catch {}
      } else {
        // 2. Persist new free registration in Firestore
        const newDocRef = await addDoc(regRef, {
          fullname: name,
          email: email,
          phone_number: phone,
          source: source,
          amount: 0,
          currency: 'NGN',
          status: 'free_registered',
          payment_confirmed: true,
          isIncluded: false,
          slackInviteSent: false,
          welcomeEmailSent: false,
          createdAt: serverTimestamp(),
        })
        docId = newDocRef.id
        console.log(`[Registration] Successfully registered ${email} in Firestore (docId: ${docId})`)

        // 3. Immediately send the official Welcome Email with WhatsApp Community Link via Resend
        try {
          const emailRes = await sendWelcomeEmail({
            to: email,
            name: name,
          })
          if (emailRes.success) {
            await updateDoc(newDocRef, {
              welcomeEmailSent: true,
              welcomeEmailSentAt: serverTimestamp(),
            })
          }
        } catch (emailErr) {
          console.error('[Registration] Welcome email sending error:', emailErr)
        }
      }
    } catch (dbErr: any) {
      console.error('[Registration] Firestore write error:', dbErr)
      // Even if firestore errors, allow student to proceed to welcome page
    }

    // 4. Return success with redirect URL for client
    const welcomeUrl = `/welcome?name=${encodeURIComponent(name)}&email=${encodeURIComponent(
      email
    )}&phone=${encodeURIComponent(phone)}`

    return NextResponse.json({
      success: true,
      free: true,
      id: docId,
      checkout_url: welcomeUrl,
      redirect_url: welcomeUrl,
    })
  } catch (err: any) {
    console.error('[Registration API Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to complete registration. Please try again.' },
      { status: 500 }
    )
  }
}
