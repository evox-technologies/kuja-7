'use client'

import { useEffect } from 'react'

export default function ScaleDetector() {
  useEffect(() => {
    const root = document.documentElement
    const supportsZoom = typeof CSS !== 'undefined' && CSS.supports('zoom', '1')

    root.classList.toggle('supports-zoom', supportsZoom)
    root.classList.toggle('no-zoom', !supportsZoom)
  }, [])

  return null
}
