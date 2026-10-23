import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id, isIncluded, adminEmail } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing registration document ID.' }, { status: 400 })
    }

    const regDocRef = doc(db, 'registrations', id)

    const updatePayload: Record<string, any> = {
      isIncluded: Boolean(isIncluded),
      status: isIncluded ? 'included' : 'paid',
    }

    if (isIncluded) {
      updatePayload.includedAt = serverTimestamp()
      updatePayload.includedBy = adminEmail || 'Admin'
      updatePayload.impersonationLocked = true
    } else {
      updatePayload.includedAt = null
      updatePayload.includedBy = null
      updatePayload.impersonationLocked = false
    }

    await updateDoc(regDocRef, updatePayload)

    console.log(
      `[Admin] Updated inclusion status for doc ${id}: isIncluded = ${isIncluded} by ${adminEmail}`
    )

    return NextResponse.json({
      success: true,
      id,
      isIncluded: Boolean(isIncluded),
      includedAt: isIncluded ? new Date().toISOString() : null,
      includedBy: isIncluded ? adminEmail || 'Admin' : null,
    })
  } catch (err: any) {
    console.error('[Admin Mark Included Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to update inclusion status.' },
      { status: 500 }
    )
  }
}
