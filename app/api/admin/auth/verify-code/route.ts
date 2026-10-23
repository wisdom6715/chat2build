import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { verifySync } from 'otplib'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').trim().toLowerCase()
    // Strip spaces/dashes that user might enter (e.g. "123 456" -> "123456")
    const enteredCode = String(body.authCode || body.code || '').replace(/[\s-]/g, '').trim()

    if (!email || !enteredCode) {
      return NextResponse.json(
        { success: false, error: 'Email and 6-digit authentication code are required.' },
        { status: 400 }
      )
    }

    let adminDocRef: any = null
    let adminRecord: any = null

    // 1. Try querying 'admins' collection by document ID or email field
    try {
      const docDirect = await getDoc(doc(db, 'admins', email))
      if (docDirect.exists()) {
        adminDocRef = docDirect.ref
        adminRecord = docDirect.data()
      } else {
        const q1 = query(collection(db, 'admins'), where('email', '==', email))
        const snap1 = await getDocs(q1)
        if (!snap1.empty) {
          adminDocRef = snap1.docs[0].ref
          adminRecord = snap1.docs[0].data()
        }
      }
    } catch (err) {
      console.warn('[Admin Auth] Error checking `admins` collection:', err)
    }

    // 2. Also check fallback collection named 'admin' if not found in 'admins'
    if (!adminRecord) {
      try {
        const docDirect2 = await getDoc(doc(db, 'admin', email))
        if (docDirect2.exists()) {
          adminDocRef = docDirect2.ref
          adminRecord = docDirect2.data()
        } else {
          const q2 = query(collection(db, 'admin'), where('email', '==', email))
          const snap2 = await getDocs(q2)
          if (!snap2.empty) {
            adminDocRef = snap2.docs[0].ref
            adminRecord = snap2.docs[0].data()
          }
        }
      } catch (err) {
        console.warn('[Admin Auth] Error checking `admin` collection:', err)
      }
    }

    let isValid = false

    // 3. Verify rotating TOTP code using Google Authenticator secret
    if (adminRecord) {
      const totpSecret = String(
        adminRecord.totpSecret ||
        adminRecord.authSecret ||
        adminRecord.totp_secret ||
        adminRecord.secret ||
        adminRecord.authCode ||
        ''
      ).trim()

      if (totpSecret && totpSecret.length >= 16) {
        try {
          const verification = verifySync({
            token: enteredCode,
            secret: totpSecret,
            epochTolerance: 30, // Allow +/- 30s window drift
          })

          if (verification && verification.valid) {
            isValid = true
            console.log(`[Admin Auth] Successfully validated rotating TOTP code for ${email}`)
          }
        } catch (totpErr) {
          console.warn('[Admin Auth] TOTP verifySync error:', totpErr)
        }
      }

      // Check if static authCode was also matched as fallback
      if (!isValid && adminRecord.authCode && String(adminRecord.authCode).trim() === enteredCode) {
        isValid = true
      }
    }

    // 4. Optional fallback to environment variable ADMIN_AUTH_CODE (for initial emergency access)
    const envAuthCode = process.env.ADMIN_AUTH_CODE?.trim()
    if (!isValid && envAuthCode && enteredCode === envAuthCode) {
      console.log(`[Admin Auth] Authenticated via ADMIN_AUTH_CODE env fallback for ${email}`)
      isValid = true
    }

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid Google Authenticator code. Please check the current 6-digit rotating code in your Google Authenticator app and try again.',
        },
        { status: 401 }
      )
    }

    // Update last login timestamp in Firestore if doc exists
    if (adminDocRef) {
      try {
        await updateDoc(adminDocRef, {
          lastLoginAt: new Date().toISOString(),
        })
      } catch (e) {
        // Non-critical
      }
    }

    // Create session cookie
    const sessionPayload = {
      email,
      authenticated: true,
      timestamp: Date.now(),
    }

    const response = NextResponse.json({
      success: true,
      email,
      role: adminRecord?.role || 'admin',
    })

    response.cookies.set('c2b_admin_session', JSON.stringify(sessionPayload), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error: any) {
    console.error('[Admin Auth Verify Code Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify admin authentication code.' },
      { status: 500 }
    )
  }
}
