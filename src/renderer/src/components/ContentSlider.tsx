import { useEffect, useState } from 'react'

// Default slides — pure CSS gradients so nothing to bundle.
// Replace with real image URLs to use actual screenshots.
const DEFAULT_SLIDES: string[] = []

interface Props {
  /** Override default slides with image URLs */
  slides?: string[]
  /** Seconds per slide (default 7) */
  interval?: number
}

export default function ContentSlider({ slides = DEFAULT_SLIDES, interval = 7 }: Props) {
  const [active, setActive] = useState(0)
  const [prev, setPrev] = useState(-1)

  // Cycle slides
  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => {
      setActive(a => {
        setPrev(a)
        return (a + 1) % slides.length
      })
    }, interval * 1000)
    return () => clearInterval(id)
  }, [slides, interval])

  if (slides.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full select-none transition-opacity duration-1000"
          style={{
            objectFit: 'cover',
            opacity: i === active ? 1 : 0,
            zIndex: i === active ? 1 : i === prev ? 0 : -1,
          }}
        />
      ))}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-auto">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPrev(active); setActive(i) }}
              className="w-1.5 h-1.5 rounded-full transition-all duration-200"
              style={{
                background: i === active ? '#00e8ca' : 'rgba(0,180,160,0.3)',
                boxShadow: i === active ? '0 0 6px #00e8ca' : 'none',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
