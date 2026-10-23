import { NextRequest, NextResponse } from 'next/server'

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
        console.log(`[Bachs Webhook] Checkout completed for session ${data?.checkout_id || data?.id}`)
        break

      case 'collection.succeeded':
        console.log(`[Bachs Webhook] Payment collection succeeded! Amount: ${data?.amount} ${data?.currency}, Charge ID: ${data?.charge_id}`)
        break

      case 'collection.failed':
        console.warn(`[Bachs Webhook] Payment failed for checkout ${data?.checkout_id}`)
        break

      default:
        console.log(`[Bachs Webhook] Unhandled event type: ${type}`)
        break
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Bachs Webhook Error]:', err)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
