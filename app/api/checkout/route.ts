import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, email, phone } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Please provide your full name.' }, { status: 400 })
    }

    // Determine site origin for redirects
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
    const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`

    const apiKey = process.env.BACHS_API_KEY?.trim()

    // If no Bachs API key is set yet, handle gracefully with a development demo session
    if (!apiKey) {
      console.warn(
        '[Bachs Checkout] Warning: BACHS_API_KEY is not defined in environment variables. Providing demo redirect for preview. Add your Bachs secret key (sk_live_... or sk_sandbox_...) to .env.local to activate live payments.'
      )
      const demoUrl = `${origin}/welcome?demo=true&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone || '')}`
      return NextResponse.json({
        checkout_url: demoUrl,
        checkout_id: 'chk_demo_' + Date.now(),
        demo: true,
      })
    }

    // Determine Bachs API base URL based on key prefix or override
    const isLive = apiKey.startsWith('sk_live_')
    const defaultBaseUrl = isLive ? 'https://api.bachs.io' : 'https://sandbox-api.bachs.io'
    const baseUrl = process.env.BACHS_BASE_URL?.trim() || defaultBaseUrl

    const payload: Record<string, any> = {
      pricing: {
        currency: 'NGN',
        amount: '30000.00',
      },
      customer: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
      success_url: `${origin}/welcome?checkout_id={checkout_id}`,
      cancel_url: `${origin}/#pricing`,
      metadata: {
        product: 'Chat2Build 4-Week AI Bootcamp',
        amount_ngn: '30000',
        student_name: name.trim(),
        student_email: email.trim(),
        student_phone: phone?.trim() || '',
      },
    }

    if (phone && typeof phone === 'string' && phone.trim().length > 3) {
      let formattedPhone = phone.trim()
      const digits = formattedPhone.replace(/\D/g, '')
      if (digits.startsWith('0') && digits.length === 11) {
        formattedPhone = '+234' + digits.slice(1)
      } else if (!formattedPhone.startsWith('+') && digits.startsWith('234')) {
        formattedPhone = '+' + digits
      }
      payload.customer.phone_number = formattedPhone
    }

    const bachsRes = await fetch(`${baseUrl}/v1/checkout-sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await bachsRes.json().catch(() => ({}))

    if (!bachsRes.ok) {
      console.error('[Bachs Checkout Error]:', data)
      const message = data.message || data.error || `Bachs API error (status ${bachsRes.status})`
      return NextResponse.json({ error: message }, { status: bachsRes.status || 400 })
    }

    return NextResponse.json({
      checkout_url: data.checkout_url,
      checkout_id: data.checkout_id,
    })
  } catch (error: any) {
    console.error('[Checkout Route Error]:', error)
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while initiating payment.' },
      { status: 500 }
    )
  }
}
