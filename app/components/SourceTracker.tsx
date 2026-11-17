'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function TrackerInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const raw =
      searchParams.get('sources') ||
      searchParams.get('source') ||
      searchParams.get('utm_source')

    if (raw) {
      const clean = raw.toLowerCase().trim()
      try {
        sessionStorage.setItem('c2b_source', clean)
        localStorage.setItem('c2b_source', clean)
      } catch {}
    }
  }, [searchParams])

  return null
}

export function SourceTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  )
}
