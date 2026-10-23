interface WelcomeEmailParams {
  to: string
  name: string
  phone?: string
  checkoutId?: string
}

interface SlackInviteEmailParams {
  to: string
  name: string
  slackInviteUrl?: string
}

const ASSISTANT_PHONE = process.env.NEXT_PUBLIC_VIRTUAL_ASSISTANT_PHONE || '09139249581'
const ASSISTANT_DIGITS = '234' + ASSISTANT_PHONE.replace(/\D/g, '').replace(/^0/, '')

export async function sendWelcomeEmail({ to, name, phone, checkoutId }: WelcomeEmailParams) {
  const cleanName = name || 'Builder'
  const waMessage = encodeURIComponent(
    `Hi Chat2Build Virtual Assistant! I just completed my ₦30,000 payment for the Chat2Build Bootcamp.\n\nName: ${cleanName}\nEmail: ${to}\nPhone: ${phone || 'N/A'}\nReference: ${checkoutId || 'Confirmed'}\n\nPlease verify and add me to the official Slack channel!`
  )
  const waUrl = `https://wa.me/${ASSISTANT_DIGITS}?text=${waMessage}`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Chat2Build AI Bootcamp</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f9; margin: 0; padding: 30px 15px; color: #111827;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #090BC2 0%, #080981 100%); padding: 36px 30px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: #E7FE00; color: #080981; font-weight: 900; font-size: 11px; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">
        Payment Confirmed • ₦30,000
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">Welcome to Chat2Build Bootcamp! 🚀</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Your 4-Week AI Application Immersion Begins Soon</p>
    </div>

    <!-- Main Body -->
    <div style="padding: 30px;">
      <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">
        Hello <strong>${cleanName}</strong>,
      </p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #374151;">
        Congratulations on securing your seat in the <strong>Chat2Build 4-Week AI Bootcamp</strong>! Your payment of <strong>₦30,000</strong> has been confirmed on the server.
      </p>

      <!-- Key Dates Card -->
      <div style="background: #f0f4ff; border-left: 4px solid #090BC2; padding: 16px; border-radius: 8px; margin: 22px 0;">
        <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #090BC2;">
          🗓️ Cohort Details:
        </p>
        <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.5;">
          • <strong>Bootcamp Commences:</strong> November 15, 2026<br>
          • <strong>Reference:</strong> ${checkoutId || 'Confirmed'}<br>
          • <strong>Live Sessions:</strong> 3 days weekly live mentor architecture teardowns &amp; 1-on-1 code debugging
        </p>
      </div>

      <!-- CRITICAL NEXT STEP -->
      <div style="background: #FFFBEB; border: 2px dashed #F59E0B; border-radius: 12px; padding: 22px; margin: 26px 0; text-align: center;">
        <h3 style="margin: 0 0 10px; font-size: 17px; font-weight: 800; color: #92400E;">
          ⚡ NEXT STEP: Message Our Virtual Assistant on WhatsApp
        </h3>
        <p style="margin: 0 0 18px; font-size: 13.5px; line-height: 1.55; color: #78350F;">
          To be officially verified and admitted into the exclusive <strong>Official Student Slack Channel</strong>, please send a quick WhatsApp message to our Virtual Assistant with your registration details.
        </p>
        <a href="${waUrl}" target="_blank" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 13px 26px; border-radius: 10px; box-shadow: 0 4px 10px rgba(37,211,102,0.3);">
          📱 Message Virtual Assistant (${ASSISTANT_PHONE})
        </a>
      </div>

      <!-- DISCLAIMER -->
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 12.5px; line-height: 1.6; color: #4B5563;">
          <strong style="color: #111827;">⚠️ Security &amp; Access Disclaimer:</strong><br>
          <em>We don't mean to inconvenience you, but we want to make sure only people who paid have access to the value, live mentor sessions, and proprietary codebase templates. Every admission is verified against our secure database to prevent impersonation.</em>
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #4B5563; margin-bottom: 0;">
        If you have any questions or require special assistance, reply to this email or reach us at <a href="mailto:customersupport@chat2build.pro" style="color: #090BC2; font-weight: 600;">customersupport@chat2build.pro</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #F3F4F6; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280;">
      <p style="margin: 0;">© 2026 Chat2Build Bootcamp. All rights reserved.</p>
      <p style="margin: 4px 0 0;">Chat2Build • Building Real Web &amp; Mobile Apps with AI</p>
    </div>
  </div>
</body>
</html>
  `

  return await dispatchEmail({
    to,
    subject: `Welcome to Chat2Build 4-Week AI Bootcamp! 🎉 Important Next Step`,
    html: htmlContent,
  })
}

export async function sendSlackInviteEmail({ to, name, slackInviteUrl }: SlackInviteEmailParams) {
  const cleanName = name || 'Builder'
  const inviteLink = slackInviteUrl || process.env.SLACK_INVITE_URL || 'https://join.slack.com/t/chat2build-cohort/shared_invite/'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Official Slack Invitation - Chat2Build</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f9; margin: 0; padding: 30px 15px; color: #111827;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <div style="background: linear-gradient(135deg, #4A154B 0%, #361038 100%); padding: 36px 30px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: #E7FE00; color: #080981; font-weight: 900; font-size: 11px; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">
        Official Slack Channel
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">Join the Chat2Build Community 💬</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Your private cohort workspace is ready</p>
    </div>

    <div style="padding: 30px;">
      <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">
        Hello <strong>${cleanName}</strong>,
      </p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #374151;">
        Your verified admission to the <strong>Chat2Build Bootcamp</strong> has been approved by the administration team. Here is your private invitation link to join our official Slack channel:
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${inviteLink}" target="_blank" style="display: inline-block; background: #090BC2; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(9,11,194,0.3);">
          👉 Click to Join Official Slack Channel
        </a>
        <p style="margin-top: 10px; font-size: 11px; color: #6B7280;">
          Direct URL: <span style="font-family: monospace; word-break: break-all;">${inviteLink}</span>
        </p>
      </div>

      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 12.5px; line-height: 1.6; color: #4B5563;">
          <strong style="color: #111827;">🔒 Individual Access Notice:</strong><br>
          This invitation link is issued specifically for <strong>${to}</strong>. To ensure high quality mentorship and protect our paid members, multi-accounting and unauthorized link sharing are automatically audited.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #4B5563; margin-bottom: 0;">
        See you inside Slack!<br>
        <strong>The Chat2Build Mentorship Team</strong>
      </p>
    </div>

    <div style="background: #F3F4F6; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280;">
      <p style="margin: 0;">© 2026 Chat2Build Bootcamp. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `

  return await dispatchEmail({
    to,
    subject: `Your Official Slack Channel Invitation - Chat2Build Bootcamp`,
    html: htmlContent,
  })
}

async function dispatchEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim()

  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'Chat2Build <onboarding@chat2build.pro>'
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: subject,
          html: html,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        console.log(`[Email Dispatched via Resend] To: ${to}, ID: ${data?.id}`)
        return { success: true, provider: 'resend', id: data?.id }
      } else {
        console.error('[Resend Error]', data)
        return { success: false, error: data?.message || 'Failed to dispatch via Resend' }
      }
    } catch (err: any) {
      console.error('[Resend Network Error]', err)
      return { success: false, error: err?.message }
    }
  }

  // Graceful simulation mode when no RESEND_API_KEY is configured yet
  console.log(`[Email Simulated (No RESEND_API_KEY set)] To: ${to}, Subject: "${subject}"`)
  return { success: true, simulated: true, note: 'Email logged (Add RESEND_API_KEY to send live)' }
}
