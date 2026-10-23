import { Resend } from 'resend'
import nodemailer from 'nodemailer'

const ASSISTANT_PHONE = process.env.NEXT_PUBLIC_VIRTUAL_ASSISTANT_PHONE || '09139249581'
const ASSISTANT_DIGITS = '234' + ASSISTANT_PHONE.replace(/\D/g, '').replace(/^0/, '')
const SLACK_INVITE_URL = process.env.SLACK_INVITE_URL || 'https://join.slack.com/t/chat2build/shared_invite/sample-invite'

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || ''
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const DEFAULT_FROM = process.env.RESEND_FROM || 'Chat2Build <admissions@chat2build.pro>'

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  }
  return null
}

export async function sendWelcomeEmail({
  to,
  name,
  checkoutId,
}: {
  to: string
  name: string
  checkoutId?: string
}) {
  const subject = 'Welcome to Chat2Build 4-Week AI Bootcamp! 🎉 [Important Next Step]'
  const cleanName = name || 'Builder'
  const waLink = `https://wa.me/${ASSISTANT_DIGITS}?text=${encodeURIComponent(
    `Hi Chat2Build Virtual Assistant! I just completed my ₦30,000 payment for the Chat2Build Bootcamp.\nName: ${cleanName}\nEmail: ${to}\nReference: ${checkoutId || 'N/A'}\n\nPlease add me to the official Slack channel!`
  )}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7fa; margin: 0; padding: 24px; color: #111; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e5ec; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .badge { display: inline-block; background-color: #fdf596; color: #080981; font-weight: 800; font-size: 11px; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.1em; }
          h1 { color: #090BC2; font-size: 26px; font-weight: 900; margin-top: 16px; margin-bottom: 8px; line-height: 1.2; }
          p { font-size: 14px; line-height: 1.6; color: #444; margin: 12px 0; }
          .action-card { background: #090BC2; color: #ffffff; border-radius: 14px; padding: 22px; margin: 24px 0; text-align: center; }
          .action-card h2 { color: #ffffff; font-size: 18px; margin: 0 0 10px 0; }
          .action-card p { color: #e0e2ff; font-size: 13px; margin: 0 0 16px 0; }
          .btn { display: inline-block; background: #fdf596; color: #080981; font-weight: 900; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; }
          .disclaimer { background: #fffbe6; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin: 24px 0; font-size: 12px; color: #78350f; line-height: 1.6; }
          .details { background: #f7f7fa; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 12px; }
          .footer { font-size: 11px; color: #888; text-align: center; margin-top: 28px; border-top: 1px solid #eee; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">Chat2Build • Payment Confirmed</span>
          <h1>Welcome to Chat2Build, ${cleanName}! 🚀</h1>
          <p>
            Congratulations! Your seat for the upcoming <strong>Chat2Build 4-Week AI Bootcamp</strong> is officially locked in. Over the next 4 weeks, you will learn how to turn ideas into fully functional, production-ready web and mobile apps using cutting-edge AI agent workflows.
          </p>

          <div class="details">
            <strong>Bootcamp Details:</strong><br>
            • Program: Chat2Build 4-Week AI Bootcamp<br>
            • Tuition: ₦30,000 NGN (Paid in Full)<br>
            • Reference ID: ${checkoutId || 'Confirmed'}<br>
            • Commencement Date: November 15, 2026
          </div>

          <div class="action-card">
            <h2>Next Step: Message Our Virtual Assistant</h2>
            <p>To receive your exclusive invitation to the official Slack channel and onboarding kit, please send a quick WhatsApp message to our Virtual Assistant:</p>
            <a href="${waLink}" class="btn">Message Virtual Assistant on WhatsApp (${ASSISTANT_PHONE})</a>
          </div>

          <div class="disclaimer">
            <strong>⚠️ Important Security Note:</strong><br>
            We do not mean to inconvenience you with this manual step, but we want to make sure only people who have legitimately paid have access to the curriculum, private community, codebase templates, and mentor support.
          </div>

          <p>
            If you have any questions or require assistance, reply to this email or reach us anytime at <a href="mailto:customersupport@chat2build.pro">customersupport@chat2build.pro</a>.
          </p>

          <div class="footer">
            © 2026 Chat2Build Bootcamp. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Welcome to Chat2Build, ${cleanName}!

Your ₦30,000 payment for the Chat2Build 4-Week AI Bootcamp is confirmed! (Ref: ${checkoutId || 'Confirmed'})

NEXT STEP:
Please message our Virtual Assistant on WhatsApp at ${ASSISTANT_PHONE} or visit:
${waLink}

We will verify your payment reference and immediately add you to the official Slack channel!

DISCLAIMER:
We do not mean to inconvenience you, but we want to make sure only people who paid have access to the value.

See you in class!
Chat2Build Team
`

  // 1. Primary email service: Resend
  if (resendClient) {
    try {
      const resendRes = await resendClient.emails.send({
        from: DEFAULT_FROM,
        to: [to],
        subject,
        html,
        text,
      })
      if (resendRes.error) {
        console.error('[Resend Error] Failed to send welcome email:', resendRes.error)
      } else {
        console.log(`[Resend] Welcome email successfully sent to ${to}, id: ${resendRes.data?.id}`)
        return { success: true, id: resendRes.data?.id }
      }
    } catch (resendErr) {
      console.error('[Resend Exception] Welcome email failed:', resendErr)
    }
  }

  // 2. Fallback to SMTP if configured
  const transporter = getSmtpTransporter()
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || DEFAULT_FROM,
        to,
        subject,
        text,
        html,
      })
      console.log(`[SMTP] Welcome email sent to ${to}`)
      return { success: true }
    } catch (err) {
      console.error('[SMTP Error] Failed to send welcome email:', err)
      return { success: false, error: err }
    }
  }

  console.log(`[Email Mock] Welcome email logged for ${to}:`, { subject, waLink })
  return { success: true, mocked: true }
}

export async function sendSlackInviteEmail({
  to,
  name,
  customInviteUrl,
}: {
  to: string
  name: string
  customInviteUrl?: string
}) {
  const subject = 'Your Chat2Build Student Slack Invitation 🚀'
  const cleanName = name || 'Builder'
  const inviteUrl = customInviteUrl || process.env.SLACK_INVITE_URL?.trim() || 'https://join.slack.com/t/chat2build/shared_invite/zt-cohort-2026'


  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7fa; margin: 0; padding: 24px; color: #111; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e5ec; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .badge { display: inline-block; background-color: #090BC2; color: #ffffff; font-weight: 800; font-size: 11px; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.1em; }
          h1 { color: #090BC2; font-size: 26px; font-weight: 900; margin-top: 16px; margin-bottom: 8px; }
          p { font-size: 14px; line-height: 1.6; color: #444; margin: 12px 0; }
          .action-card { background: #f4f4fa; border: 2px dashed #090BC2; border-radius: 14px; padding: 24px; margin: 24px 0; text-align: center; }
          .btn { display: inline-block; background: #090BC2; color: #ffffff; font-weight: 900; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; }
          .footer { font-size: 11px; color: #888; text-align: center; margin-top: 28px; border-top: 1px solid #eee; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">Chat2Build • Slack Community</span>
          <h1>Join Your Cohort on Slack! 💻</h1>
          <p>
            Hello ${cleanName},<br><br>
            Your enrollment has been verified by the Chat2Build admissions team! You are now granted full access to the official Chat2Build private student Slack workspace.
          </p>

          <div class="action-card">
            <h2 style="margin: 0 0 10px 0; color: #090BC2;">Official Slack Invite Link</h2>
            <p style="margin: 0 0 16px 0; color: #555;">Click the button below to join the private channels, access weekly class links, and connect with your mentors:</p>
            <a href="${inviteUrl}" class="btn">Accept Slack Invitation →</a>
          </div>

          <p>
            <strong>Tips upon joining:</strong><br>
            1. Set your Slack display name to your full name: <strong>${cleanName}</strong>.<br>
            2. Drop a quick intro in the <code>#introductions</code> channel!<br>
            3. Check out the pinned curriculum in <code>#announcements</code>.
          </p>

          <div class="footer">
            Need help? Reach out to <a href="mailto:customersupport@chat2build.pro">customersupport@chat2build.pro</a>.<br>
            © 2026 Chat2Build Bootcamp. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Hello ${cleanName},

Your enrollment in Chat2Build Bootcamp has been verified!
Click the link below to join the official private Slack workspace:

${inviteUrl}

Once inside, introduce yourself in #introductions and check out #announcements for the schedule!

Chat2Build Team
`

  // 1. Primary email service: Resend
  if (resendClient) {
    try {
      const resendRes = await resendClient.emails.send({
        from: DEFAULT_FROM,
        to: [to],
        subject,
        html,
        text,
      })
      if (resendRes.error) {
        console.error('[Resend Error] Failed to send slack invite email:', resendRes.error)
      } else {
        console.log(`[Resend] Slack invite email sent to ${to}, id: ${resendRes.data?.id}`)
        return { success: true, id: resendRes.data?.id }
      }
    } catch (resendErr) {
      console.error('[Resend Exception] Slack invite email failed:', resendErr)
    }
  }

  // 2. Fallback to SMTP
  const transporter = getSmtpTransporter()
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || DEFAULT_FROM,
        to,
        subject,
        text,
        html,
      })
      console.log(`[SMTP] Slack invite email sent to ${to}`)
      return { success: true }
    } catch (err) {
      console.error('[SMTP Error] Failed to send slack invite email:', err)
      return { success: false, error: err }
    }
  }

  console.log(`[Email Mock] Slack invite email logged for ${to}:`, { subject, inviteUrl })
  return { success: true, mocked: true }
}
