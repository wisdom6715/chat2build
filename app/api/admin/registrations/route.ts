import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

function serializeTimestamp(val: any): string | null {
  if (!val) return null
  if (typeof val === 'string') return val
  if (typeof val?.toDate === 'function') return val.toDate().toISOString()
  if (typeof val?.seconds === 'number') return new Date(val.seconds * 1000).toISOString()
  if (val instanceof Date) return val.toISOString()
  return String(val)
}

export async function GET(req: NextRequest) {
  try {
    // Check admin session cookie
    const adminCookie = req.cookies.get('c2b_admin_session')?.value
    if (!adminCookie) {
      // Also allow Authorization header
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 })
      }
    }

    const regRef = collection(db, 'registrations')
    let snap
    try {
      const q = query(regRef, orderBy('createdAt', 'desc'))
      snap = await getDocs(q)
    } catch {
      // In case index on createdAt is still building or absent
      snap = await getDocs(regRef)
    }

    const registrations = snap.docs.map((docSnap) => {
      const data = docSnap.data()

      return {
        id: docSnap.id,
        fullname: data.fullname || data.name || 'Unnamed',
        email: data.email || '',
        phone_number: data.phone_number || data.phone || '',
        amount: data.amount || 30000,
        currency: data.currency || 'NGN',
        status: data.status || 'paid',
        checkout_id: data.checkout_id || 'N/A',
        isIncluded: !!data.isIncluded,
        includedAt: serializeTimestamp(data.includedAt),
        includedBy: data.includedBy || null,
        slackInviteSent: !!data.slackInviteSent,
        slackInviteSentAt: serializeTimestamp(data.slackInviteSentAt),
        welcomeEmailSent: !!data.welcomeEmailSent,
        welcomeEmailSentAt: serializeTimestamp(data.welcomeEmailSentAt),
        createdAt: serializeTimestamp(data.createdAt) || '',
      }
    })


    return NextResponse.json({ registrations })
  } catch (err: any) {
    console.error('[Admin Registrations GET Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to fetch registrations.' },
      { status: 500 }
    )
  }
}
