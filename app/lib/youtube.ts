/**
 * Utility functions for YouTube URLs & Embeds
 */

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  const clean = url.trim()

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

export function getYouTubeEmbedUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) return url
  return `https://www.youtube-nocookie.com/embed/${videoId}`
}

export function getYouTubeThumbnailUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
