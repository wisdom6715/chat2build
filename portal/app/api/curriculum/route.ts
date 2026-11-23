import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

function getYouTubeEmbedUrl(url: string): string {
  if (!url) return ''
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.trim().match(regExp)
  if (match && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}`
  }
  return url
}

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch modules
    const modulesRef = collection(db, 'curriculum_modules')
    let modulesSnap
    try {
      const q = query(modulesRef, orderBy('order', 'asc'))
      modulesSnap = await getDocs(q)
    } catch {
      modulesSnap = await getDocs(modulesRef)
    }

    // 2. Fetch classes
    const classesRef = collection(db, 'curriculum_classes')
    let classesSnap
    try {
      const q = query(classesRef, orderBy('order', 'asc'))
      classesSnap = await getDocs(q)
    } catch {
      classesSnap = await getDocs(classesRef)
    }

    const classesByModule: Record<string, any[]> = {}
    classesSnap.docs.forEach((docSnap) => {
      const d = docSnap.data()
      const mId = d.moduleId
      if (!mId) return
      if (!classesByModule[mId]) classesByModule[mId] = []
      classesByModule[mId].push({
        id: docSnap.id,
        moduleId: mId,
        title: d.title || 'Untitled Class',
        classNumber: d.classNumber ?? 1,
        order: d.order ?? 1,
        youtubeUrl: d.youtubeUrl || '',
        embedUrl: d.embedUrl || getYouTubeEmbedUrl(d.youtubeUrl || ''),
        slideUrl: d.slideUrl || '',
        duration: d.duration || '',
        notes: d.notes || '',
      })
    })

    // Sort classes within each module
    Object.keys(classesByModule).forEach((mId) => {
      classesByModule[mId].sort((a, b) => a.order - b.order)
    })

    const modules = modulesSnap.docs.map((docSnap) => {
      const d = docSnap.data()
      return {
        id: docSnap.id,
        title: d.title || '',
        weekNumber: d.weekNumber ?? 1,
        order: d.order ?? 1,
        description: d.description || '',
        classes: classesByModule[docSnap.id] || [],
      }
    })

    modules.sort((a, b) => a.order - b.order)

    return NextResponse.json({
      success: true,
      modules,
    })
  } catch (err: any) {
    console.error('[Portal Curriculum GET Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to load curriculum.' }, { status: 500 })
  }
}
