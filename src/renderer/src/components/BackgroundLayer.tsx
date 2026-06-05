import { useEffect, useState } from 'react'
import launcherBg from '../assets/launcher-bg.png'
import { useStore } from '../store'

export default function BackgroundLayer() {
  const { backgroundType, backgroundPath, backgroundImages, backgroundInterval } =
    useStore(s => s.settings)

  const [activeIdx, setActiveIdx] = useState(0)
  const [prevIdx, setPrevIdx] = useState(-1)

  // Content slides (shown inside the frame's transparent area)
  const contentSlides: string[] = (() => {
    if (backgroundType === 'image' && backgroundPath) return [backgroundPath]
    if (backgroundImages && backgroundImages.length > 0) return backgroundImages
    return []
  })()

  useEffect(() => {
    setActiveIdx(0)
    setPrevIdx(-1)
    if (contentSlides.length < 2) return
    const ms = Math.max(3, backgroundInterval ?? 8) * 1000
    const id = setInterval(() => {
      setActiveIdx(cur => {
        setPrevIdx(cur)
        return (cur + 1) % contentSlides.length
      })
    }, ms)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentSlides.join('|'), backgroundInterval])

  if (backgroundType === 'video' && backgroundPath) {
    return (
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <video
          src={backgroundPath}
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', zIndex: 1 }}
        />
        {/* Frame PNG on top */}
        <img
          src={launcherBg}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full select-none pointer-events-none"
          style={{ objectFit: 'fill', zIndex: 5 }}
        />
      </div>
    )
  }

  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      {/* Content images — rendered BELOW the frame, visible through transparent content area */}
      {contentSlides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full select-none pointer-events-none transition-opacity duration-1000"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: i === activeIdx ? 1 : 0,
            zIndex: i === activeIdx ? 2 : i === prevIdx ? 1 : 0,
          }}
        />
      ))}

      {/* Frame PNG — always on top, transparent interior reveals content images */}
      <img
        src={launcherBg}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full select-none pointer-events-none"
        style={{ objectFit: 'fill', zIndex: 5 }}
      />

      {/* Slideshow dot indicators */}
      {contentSlides.length > 1 && (
        <div
          className="absolute flex gap-1.5"
          style={{ bottom: '12vh', left: '38%', zIndex: 10 }}
        >
          {contentSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPrevIdx(activeIdx); setActiveIdx(i) }}
              className="rounded-full transition-all duration-200"
              style={{
                width: 6, height: 6,
                background: i === activeIdx ? '#00e8ca' : 'rgba(0,180,160,0.3)',
                boxShadow: i === activeIdx ? '0 0 6px #00e8ca' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
