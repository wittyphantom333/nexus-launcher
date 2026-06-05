import { useEffect, useState } from 'react'
import launcherBg from '../assets/launcher-bg.png'
import { useStore } from '../store'

export default function BackgroundLayer() {
  const { backgroundType, backgroundPath, backgroundImages, backgroundInterval } =
    useStore(s => s.settings)

  const [activeIdx, setActiveIdx] = useState(0)
  const [prevIdx, setPrevIdx] = useState(-1)

  // Slides: user-specified images list, or single custom image, or bundled default
  const slides: string[] = (() => {
    if (backgroundType === 'image' && backgroundPath) return [backgroundPath]
    if (backgroundImages && backgroundImages.length > 0) return backgroundImages
    return [launcherBg]
  })()

  // Auto-crossfade when multiple slides
  useEffect(() => {
    setActiveIdx(0)
    setPrevIdx(-1)
    if (slides.length < 2) return
    const ms = Math.max(3, backgroundInterval ?? 8) * 1000
    const id = setInterval(() => {
      setActiveIdx(cur => {
        setPrevIdx(cur)
        return (cur + 1) % slides.length
      })
    }, ms)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.join('|'), backgroundInterval])

  if (backgroundType === 'video' && backgroundPath) {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <video
          src={backgroundPath}
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'fill' }}
        />
      </div>
    )
  }

  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full select-none pointer-events-none transition-opacity duration-1000"
          style={{
            objectFit: 'fill',
            opacity: i === activeIdx ? 1 : 0,
            zIndex: i === activeIdx ? 1 : i === prevIdx ? 0 : -1,
          }}
        />
      ))}

      {slides.length > 1 && (
        <div
          className="absolute flex gap-1.5"
          style={{ bottom: '3.5vh', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPrevIdx(activeIdx); setActiveIdx(i) }}
              className="rounded-full transition-all duration-200"
              style={{
                width: 6, height: 6,
                background: i === activeIdx ? '#00e8ca' : 'rgba(0,180,160,0.3)',
                boxShadow: i === activeIdx ? '0 0 6px #00e8ca' : 'none',
                border: 'none',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
