'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { extractSourceFromParams } from '../lib/constants'

function TrackerInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const detected = extractSourceFromParams(searchParams)

    if (detected && detected !== 'direct') {
      try {
        sessionStorage.setItem('c2b_source', detected)
        localStorage.setItem('c2b_source', detected)
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
