import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || ''
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const DEFAULT_FROM = process.env.RESEND_FROM || 'Chat2Build Portal <admissions@chat2build.pro>'

export async function sendOtpEmail({
  to,
  name,
  otp,
}: {
  to: string
  name?: string
  otp: string
}) {
  const cleanName = name || 'Student'
  const subject = `Your Chat2Build Login Code: ${otp}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7fc; margin: 0; padding: 24px; color: #11172f; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e8e8f0; padding: 36px 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .badge { display: inline-block; background: #090bc2; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.1em; }
          h1 { font-size: 24px; font-weight: 900; color: #11172f; margin: 16px 0 8px 0; letter-spacing: -0.03em; }
          p { font-size: 14px; line-height: 1.6; color: #6e7084; margin: 0 0 16px 0; }
          .otp-box { background: #f7f7fc; border: 2px dashed #090bc2; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 0.25em; color: #090bc2; font-family: monospace; }
          .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #6e7084; border-top: 1px solid #e8e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">Chat2Build • Student Classroom</span>
            <h1>Your Verification Code</h1>
            <p>Hello ${cleanName}, use the 6-digit code below to log in to your student classroom on <strong>app.chat2build.pro</strong>.</p>
          </div>

          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>

          <p style="font-size: 12px; text-align: center;">This code will expire in <strong>10 minutes</strong>. If you did not request this login, please ignore this email.</p>

          <div class="footer">
            &copy; 2026 Chat2Build Bootcamp. All rights reserved.<br/>
            Need help? Reply directly to this email.
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Hello ${cleanName},

Your Chat2Build Student Portal verification code is:

${otp}

This code will expire in 10 minutes.

If you did not request this login, you can safely ignore this email.

Chat2Build Team
  `

  if (resendClient) {
    try {
      const res = await resendClient.emails.send({
        from: DEFAULT_FROM,
        to: [to],
        subject,
        html,
        text,
      })
      if (res.error) {
        console.error('[Resend OTP Error]:', res.error)
        return { success: false, error: res.error }
      }
      return { success: true, id: res.data?.id }
    } catch (err: any) {
      console.error('[Resend Exception]:', err)
      return { success: false, error: err.message }
    }
  }

  // Local development mock fallback
  console.log(`[Email Mock OTP] Sent to ${to}: ${otp}`)
  return { success: true, mocked: true }
}
