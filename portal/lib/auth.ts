/**
 * Authentication and crypto helpers using native Web Crypto
 */

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(password + 'c2b_student_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, expectedHash: string): Promise<boolean> {
  const actualHash = await hashPassword(password)
  return actualHash === expectedHash
}

export function generateOTP(): string {
  // Generate random 6-digit numeric code
  const num = Math.floor(100000 + Math.random() * 900000)
  return String(num)
}

export interface StudentSession {
  email: string
  name: string
  loginTime: number
}

export function createSessionToken(session: StudentSession): string {
  const json = JSON.stringify(session)
  return Buffer.from(json).toString('base64url')
}

export function parseSessionToken(token: string): StudentSession | null {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8')
    const session = JSON.parse(json) as StudentSession
    // 7 days expiration
    if (Date.now() - session.loginTime > 7 * 24 * 60 * 60 * 1000) {
      return null
    }
    return session
  } catch {
    return null
  }
}
