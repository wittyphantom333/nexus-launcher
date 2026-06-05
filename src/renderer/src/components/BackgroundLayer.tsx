import { useEffect, useState } from 'react'
import launcherBg from '../assets/launcher-bg.png'
import { useStore } from '../store'

const SLIDES_URL =
  'https://raw.githubusercontent.com/wittyphantom333/nexus-launcher/main/slides.json'

interface SlidesConfig {
  interval?: number
  slides: string[]
}

export default function BackgroundLayer() {
  const { backgroundType, backgroundPath } = useStore(s => s.settings)

  const [ghSlides, setGhSlides] = useState<string[]>([])
  const [intervalSecs, setIntervalSecs] = useState(8)
  const [activeIdx, setActiveIdx] = useState(0)
  const [prevIdx, setPrevIdx] = useState(-1)

  // Fetch slide list from GitHub on mount (browser HTTP cache handles caching)
  useEffect(() => {
    fetch(SLIDES_URL)
      .then(r => r.json())
      .then((cfg: SlidesConfig) => {
        if (Array.isArray(cfg.slides)) setGhSlides(cfg.slides)
        if (typeof cfg.interval === 'number') setIntervalSecs(cfg.interval)
      })
      .catch(() => {})
  }, [])

  // Which images to cycle — user custom overrides GitHub slides
  const contentSlides: string[] =
    backgroundType === 'image' && backgroundPath ? [backgroundPath]
    : backgroundType === 'video' ? []
    : ghSlides

  // Auto-crossfade
  useEffect(() => {
    setActiveIdx(0)
    setPrevIdx(-1)
    if (contentSlides.length < 2) return
    const id = setInterval(() => {
      setActiveIdx(cur => {
        setPrevIdx(cur)
        return (cur + 1) % contentSlides.length
      })
    }, Math.max(3, intervalSecs) * 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentSlides.join('|'), intervalSecs])

  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>

      {/* ── Content images / video
          Clipped to the frame's inner transparent area so they never
          bleed outside the chrome and create a visible "box" ── */}
      <div
        className="absolute overflow-hidden"
        style={{ left: '6.5vw', right: '6.5vw', top: '17.5vh', bottom: '15vh' }}
      >
        {backgroundType === 'video' && backgroundPath ? (
          <video
            src={backgroundPath}
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          contentSlides.map((src, i) => (
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
          ))
        )}
      </div>

      {/* (Frame PNG rendered in Layout at z:20 — above content, below nav) */}

    </div>
  )
}
