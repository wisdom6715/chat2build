import { NextRequest, NextResponse } from 'next/server'

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

    // Determine site origin for redirects:
    // IMPORTANT: Bachs API strictly requires a publicly accessible URL and rejects localhost or private IPs.
    let publicOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    if (
      !publicOrigin ||
      publicOrigin.includes('localhost') ||
      publicOrigin.includes('127.0.0.1') ||
      publicOrigin.includes('192.168.') ||
      publicOrigin.includes('10.') ||
      publicOrigin.includes('172.') ||
      !publicOrigin.startsWith('http')
    ) {
      publicOrigin = 'https://chat2build.pro'
    }

    const apiKey = process.env.BACHS_API_KEY?.trim()

    // If no Bachs API key is set yet, handle gracefully with a development demo session
    if (!apiKey) {
      console.warn(
        '[Bachs Checkout] Warning: BACHS_API_KEY is not defined in environment variables. Providing demo redirect for preview. Add your Bachs secret key (sk_live_... or sk_sandbox_...) to .env.local to activate live payments.'
      )
      const demoUrl = `${publicOrigin}/welcome?demo=true&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone || '')}`
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
      success_url: `${publicOrigin}/welcome?checkout_id={checkout_id}`,
      cancel_url: `${publicOrigin}/registration`,
      metadata: {
        product: 'Chat2Build 4-Week AI Bootcamp',
        amount_ngn: '30000',
        student_name: name.trim(),
        student_email: email.trim(),
        student_phone: phone?.trim() || '',
      },
    }

    if (phone && typeof phone === 'string' && phone.trim().length > 3) {
      const digits = phone.replace(/\D/g, '')
      let formattedPhone = '+' + digits
      if (digits.startsWith('0') && digits.length === 11) {
        formattedPhone = '+234' + digits.slice(1)
      } else if (digits.length === 10) {
        formattedPhone = '+234' + digits
      } else if (digits.startsWith('234')) {
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
      const message =
        data.detail ||
        data.message ||
        data.error ||
        (data.errors && Array.isArray(data.errors) ? data.errors.map((e: any) => e.message).join(', ') : '') ||
        `Bachs API error (status ${bachsRes.status})`
      return NextResponse.json({ error: message }, { status: bachsRes.status || 400 })
    }

    // IMPORTANT: Per strict requirement, registrations are ONLY written into the DB
    // on the Next.js server side AFTER Bachs payment has been confirmed as successful
    // via /api/checkout/verify or the Bachs webhook!


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
