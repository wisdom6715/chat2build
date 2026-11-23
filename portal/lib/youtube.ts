export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
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

export function getYouTubeEmbedUrl(url: string): string {
  if (!url) return ''
  const id = extractYouTubeVideoId(url)
  if (id) {
    return `https://www.youtube-nocookie.com/embed/${id}`
  }
  return url
}
