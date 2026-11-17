/**
 * Shared application constants & traffic attribution helpers
 */

// Official WhatsApp Community & Group link (both community and group use this exact link)
export const WHATSAPP_COMMUNITY_URL =
  'https://chat.whatsapp.com/JX9whdzwMAdG1NhD5M5XvS?s=cl&p=a&mlu=4&ilr=4'

export const WHATSAPP_GROUP_URL = WHATSAPP_COMMUNITY_URL

// Virtual Assistant support phone number
export const ASSISTANT_PHONE = '09139249580'
export const ASSISTANT_DIGITS = '2349139249580'

/**
 * Normalizes any incoming campaign source parameter into standard categories:
 * - 'x' (𝕏 / Twitter Ads & organic posts)
 * - 'meta' (Meta, Facebook, Instagram Ads & posts)
 * - 'google' (Google Search, YouTube, Display Ads)
 * - 'direct' (Direct or untagged organic traffic)
 * - Or the sanitized string if another specific custom platform is passed.
 */
export function normalizeSource(raw?: string | null): string {
  if (!raw) return 'direct'
  const s = raw.toLowerCase().trim()
  if (!s || s === 'direct' || s === 'null' || s === 'undefined' || s === 'none') {
    return 'direct'
  }

  // 1. 𝕏 / Twitter (handles ?utm_source=X, ?utm_source=x, ?source=x, ?sources=x, twitter, t.co, etc.)
  if (
    s === 'x' ||
    s === 'twitter' ||
    s === 't.co' ||
    s.startsWith('x_') ||
    s.endsWith('_x') ||
    s.includes('twitter') ||
    s.includes('t.co')
  ) {
    return 'x'
  }

  // 2. Meta / Facebook / Instagram (handles ?sources=meta, ?source=facebook, ?utm_source=fb, etc.)
  if (
    s === 'meta' ||
    s === 'facebook' ||
    s === 'fb' ||
    s === 'instagram' ||
    s === 'ig' ||
    s.includes('meta') ||
    s.includes('facebook') ||
    s.includes('fb') ||
    s.includes('instagram') ||
    s.includes('ig')
  ) {
    return 'meta'
  }

  // 3. Google / YouTube (handles ?sources=google, ?source=google, ?utm_source=youtube, etc.)
  if (
    s === 'google' ||
    s === 'youtube' ||
    s === 'yt' ||
    s === 'adwords' ||
    s === 'gads' ||
    s.includes('google') ||
    s.includes('youtube') ||
    s.includes('yt') ||
    s.includes('adwords') ||
    s.includes('gads')
  ) {
    return 'google'
  }

  return s
}

/**
 * Extracts campaign source from a URLSearchParams object or an object with get(key).
 * Checks in order of preference:
 * 1. sources
 * 2. source
 * 3. utm_source
 * 4. ref / referrer
 */
export function extractSourceFromParams(
  params: URLSearchParams | { get: (k: string) => string | null }
): string | null {
  const raw =
    params.get('sources') ||
    params.get('source') ||
    params.get('utm_source') ||
    params.get('ref') ||
    params.get('referrer')

  if (raw && raw.trim()) {
    return normalizeSource(raw)
  }
  return null
}
