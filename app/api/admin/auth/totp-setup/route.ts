import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { generateSecret, generateURI } from 'otplib'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 })
    }

    let adminDocRef: any = null
    let adminData: any = null

    // Look in 'admins' collection by ID
    const directDoc = await getDoc(doc(db, 'admins', email))
    if (directDoc.exists()) {
      adminDocRef = doc(db, 'admins', email)
      adminData = directDoc.data()
    } else {
      // Look by query in 'admins'
      const q1 = query(collection(db, 'admins'), where('email', '==', email))
      const snap1 = await getDocs(q1)
      if (!snap1.empty) {
        adminDocRef = snap1.docs[0].ref
        adminData = snap1.docs[0].data()
      } else {
        // Fallback to 'admin' collection
        const directDoc2 = await getDoc(doc(db, 'admin', email))
        if (directDoc2.exists()) {
          adminDocRef = doc(db, 'admin', email)
          adminData = directDoc2.data()
        } else {
          const q2 = query(collection(db, 'admin'), where('email', '==', email))
          const snap2 = await getDocs(q2)
          if (!snap2.empty) {
            adminDocRef = snap2.docs[0].ref
            adminData = snap2.docs[0].data()
          }
        }
      }
    }

    // If admin document does not exist yet, we create it in 'admins' collection
    if (!adminDocRef) {
      adminDocRef = doc(db, 'admins', email)
      adminData = {
        email,
        role: 'admin',
        createdAt: new Date().toISOString(),
      }
      await setDoc(adminDocRef, adminData)
      console.log(`[TOTP Setup] Created new admin document for ${email}`)
    }

    // Check if admin already has a TOTP secret
    let secret =
      adminData.totpSecret ||
      adminData.authSecret ||
      adminData.totp_secret ||
      adminData.secret ||
      ''

    let isNewSecret = false

    // If secret is missing or not a valid Base32 key (less than 16 chars or contains spaces)
    if (!secret || typeof secret !== 'string' || secret.trim().length < 16) {
      secret = generateSecret()
      isNewSecret = true
      await updateDoc(adminDocRef, {
        totpSecret: secret,
        totpSetupAt: new Date().toISOString(),
      })
      console.log(`[TOTP Setup] Generated and stored new TOTP secret for ${email}`)
    }

    // Generate otpauth URL for Google Authenticator
    const otpauthUri = generateURI({
      secret: secret.trim(),
      label: email,
      issuer: 'Chat2Build Admin',
    })

    // Generate QR Code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 250,
      color: {
        dark: '#080981',
        light: '#ffffff',
      },
    })

    return NextResponse.json({
      success: true,
      hasExistingTotp: !isNewSecret,
      secret: secret.trim(),
      qrCode: qrCodeDataUrl,
      otpauthUri,
      email,
    })
  } catch (err: any) {
    console.error('[TOTP Setup Error]:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to initialize Google Authenticator 2FA.' },
      { status: 500 }
    )
  }
}
