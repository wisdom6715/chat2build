/**
 * Utility functions for Canva Video URLs & Embeds
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
  if (!url || url.includes('canva.com')) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.trim().match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export function getYouTubeThumbnailUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url)
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }
  return ''
}

export function getVideoEmbedUrl(url: string): string {
  return getCanvaEmbedUrl(url)
}

// Kept as alias for backwards compatibility
export function getYouTubeEmbedUrl(url: string): string {
  return getCanvaEmbedUrl(url)
}
