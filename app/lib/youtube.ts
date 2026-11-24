/**
 * Utility functions for Canva Video URLs & Embeds (with fallback support)
 */

export function getCanvaEmbedUrl(input: string): string {
  if (!input) return ''
  let clean = input.trim()

  // 1. If user pasted full Canva HTML <iframe> embed code, extract the src attribute
  const iframeSrcMatch = clean.match(/<iframe[^>]+src=["']([^"']+)["']/i)
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    clean = iframeSrcMatch[1].trim()
  }

  // Decode HTML entities if pasted from HTML (e.g. &amp;)
  clean = clean.replace(/&amp;/g, '&')

  // 2. Normalize Canva URLs to official ?embed format
  try {
    const parsed = new URL(clean)
    if (parsed.hostname.includes('canva.com')) {
      let pathname = parsed.pathname.replace(/\/+$/, '')

      // Replace /edit with /view so it can be embedded cleanly
      if (pathname.endsWith('/edit')) {
        pathname = pathname.slice(0, -5) + '/view'
      } else if (
        pathname.startsWith('/design/') &&
        !pathname.endsWith('/watch') &&
        !pathname.endsWith('/view')
      ) {
        pathname = pathname + '/view'
      }

      return `https://www.canva.com${pathname}?embed`
    }
  } catch {
    // Not a valid absolute URL, return as-is
  }

  return clean
}

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  const clean = url.trim()
  if (clean.includes('canva.com')) return null

  // Match: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/live/ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/
  const match = clean.match(regExp)

  if (match && match[2].length === 11) {
    return match[2]
  }

  // If user just pasted the 11 character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean
  }

  return null
}

export function getVideoEmbedUrl(url: string): string {
  if (!url) return ''
  const canvaEmbed = getCanvaEmbedUrl(url)
  if (canvaEmbed.includes('canva.com')) {
    return canvaEmbed
  }
  return canvaEmbed
}

// Kept as alias for backwards compatibility across API routes
export function getYouTubeEmbedUrl(url: string): string {
  return getVideoEmbedUrl(url)
}

export function getYouTubeThumbnailUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
