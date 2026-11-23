import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import {
  WHATSAPP_COMMUNITY_URL,
  WHATSAPP_GROUP_URL,
  ASSISTANT_PHONE,
  ASSISTANT_DIGITS,
} from './constants'

export { WHATSAPP_COMMUNITY_URL, WHATSAPP_GROUP_URL }

export function getWhatsAppCommunityUrl(): string {
  return WHATSAPP_COMMUNITY_URL
}

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
  customCommunityUrl,
}: {
  to: string
  name: string
  checkoutId?: string
  customCommunityUrl?: string
}) {
  const subject = 'Welcome to Chat2Build 2-Week AI Bootcamp! 🎉 [Join the WhatsApp Community]'
  const cleanName = name || 'Builder'
  const communityUrl = customCommunityUrl || getWhatsAppCommunityUrl()
  const assistantWaLink = `https://wa.me/${ASSISTANT_DIGITS}?text=${encodeURIComponent(
    `Hi Chat2Build Assistant! My name is ${cleanName} (${to}). I just registered for the free Chat2Build Bootcamp!`
  )}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7fa; margin: 0; padding: 24px; color: #111; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e5ec; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .badge { display: inline-block; background-color: #fdf596; color: #080981; font-weight: 800; font-size: 11px; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.1em; }
          h1 { color: #090BC2; font-size: 26px; font-weight: 900; margin-top: 16px; margin-bottom: 8px; line-height: 1.2; }
          p { font-size: 14px; line-height: 1.6; color: #444; margin: 12px 0; }
          .action-card { background: #090BC2; color: #ffffff; border-radius: 14px; padding: 24px; margin: 24px 0; text-align: center; }
          .action-card h2 { color: #ffffff; font-size: 20px; margin: 0 0 10px 0; font-weight: 800; }
          .action-card p { color: #e0e2ff; font-size: 13px; margin: 0 0 18px 0; line-height: 1.5; }
          .btn { display: inline-block; background: #25D366; color: #ffffff; font-weight: 900; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
          .btn:hover { background: #20bd5a; }
          .steps-card { background: #f8f9ff; border: 1px solid #e0e4fc; border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
          .steps-card h3 { margin: 0 0 12px 0; font-size: 14px; color: #090BC2; font-weight: 800; }
          .steps-card ul { margin: 0; padding-left: 20px; color: #333; font-size: 13px; line-height: 1.7; }
          .assistant-box { background: #fffbe6; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin: 20px 0; font-size: 12px; color: #78350f; line-height: 1.6; }
          .footer { font-size: 11px; color: #888; text-align: center; margin-top: 28px; border-top: 1px solid #eee; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">Chat2Build • Registration Confirmed (100% Free)</span>
          <h1>Welcome to Chat2Build, ${cleanName}! 🚀</h1>
          <p>
            Congratulations! Your registration for the upcoming <strong>Chat2Build 2-Week AI Bootcamp</strong> is confirmed. Over the next 2 weeks, you will learn how to turn ideas into fully functional, production-ready web applications using cutting-edge AI agent workflows.
          </p>

          <div class="action-card">
            <h2>Join Our Official WhatsApp Community 💬</h2>
            <p>
              All live class links, assignments, lecture slides, announcements, and direct mentor Q&amp;A are hosted inside our private WhatsApp community group.
            </p>
            <a href="${communityUrl}" target="_blank" rel="noopener noreferrer" class="btn">
              👉 Click Here to Join WhatsApp Community
            </a>
          </div>

          <div class="steps-card">
            <h3>Quick Next Steps:</h3>
            <ul>
              <li><strong>Join the WhatsApp Community:</strong> Click the button above to enter the group right away.</li>
              <li><strong>Introduce Yourself:</strong> Let your fellow builders know your name and what you want to build.</li>
              <li><strong>Commencement Date:</strong> Classes officially kick off on <strong>November 22, 2026</strong>.</li>
            </ul>
          </div>

          <div class="assistant-box">
            <strong>Need any help getting in?</strong><br>
            If you encounter any issues joining the group, message our Virtual Assistant directly on WhatsApp at
            <a href="${assistantWaLink}" style="color: #080981; font-weight: bold;">${ASSISTANT_PHONE}</a> or email <a href="mailto:customersupport@chat2build.pro" style="color: #080981;">customersupport@chat2build.pro</a>.
          </div>

          <div class="footer">
            © 2026 Chat2Build Bootcamp. All rights reserved.<br>
            Empowering builders to ship real applications with AI.
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Welcome to Chat2Build, ${cleanName}!

Congratulations! Your registration for the upcoming Chat2Build 2-Week AI Bootcamp is officially confirmed (100% Free).

NEXT STEP: JOIN OUR OFFICIAL WHATSAPP COMMUNITY
Please join our official WhatsApp group right away to get access to all class schedules, live session links, assignments, and mentor support:
${communityUrl}

If you need any help, message our Virtual Assistant on WhatsApp at ${ASSISTANT_PHONE} or reply to this email.

See you in class!
The Chat2Build Team
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

  console.log(`[Email Mock] Welcome email logged for ${to}:`, { subject, communityUrl })
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
  const subject = 'Your Chat2Build WhatsApp Community Invitation 🚀'
  const cleanName = name || 'Builder'
  const inviteUrl = customInviteUrl || getWhatsAppCommunityUrl()

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
          .action-card { background: #f4f4fa; border: 2px dashed #25D366; border-radius: 14px; padding: 24px; margin: 24px 0; text-align: center; }
          .btn { display: inline-block; background: #25D366; color: #ffffff; font-weight: 900; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; }
          .footer { font-size: 11px; color: #888; text-align: center; margin-top: 28px; border-top: 1px solid #eee; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">Chat2Build • WhatsApp Community</span>
          <h1>Join Your Cohort on WhatsApp! 💬</h1>
          <p>
            Hello ${cleanName},<br><br>
            Your enrollment in Chat2Build Bootcamp is active. You are invited to join the official private student WhatsApp community group.
          </p>

          <div class="action-card">
            <h2 style="margin: 0 0 10px 0; color: #090BC2;">Official WhatsApp Community Link</h2>
            <p style="margin: 0 0 16px 0; color: #555;">Click the button below to join the group, receive class schedules, and connect with mentors:</p>
            <a href="${inviteUrl}" target="_blank" rel="noopener noreferrer" class="btn">Join WhatsApp Community →</a>
          </div>

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

Your enrollment in Chat2Build Bootcamp is active!
Click the link below to join the official private WhatsApp community:

${inviteUrl}

Once inside, introduce yourself to the group and get ready for classes!

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
        console.error('[Resend Error] Failed to send WhatsApp community invite email:', resendRes.error)
      } else {
        console.log(`[Resend] WhatsApp community invite email sent to ${to}, id: ${resendRes.data?.id}`)
        return { success: true, id: resendRes.data?.id }
      }
    } catch (resendErr) {
      console.error('[Resend Exception] WhatsApp community invite email failed:', resendErr)
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
      console.log(`[SMTP] WhatsApp community invite email sent to ${to}`)
      return { success: true }
    } catch (err) {
      console.error('[SMTP Error] Failed to send invite email:', err)
      return { success: false, error: err }
    }
  }

  console.log(`[Email Mock] WhatsApp community invite email logged for ${to}:`, { subject, inviteUrl })
  return { success: true, mocked: true }
}
