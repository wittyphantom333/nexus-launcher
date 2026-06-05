import launcherBg from '../assets/launcher-bg.png'
import { useStore } from '../store'

export default function BackgroundLayer() {
  const { backgroundType, backgroundPath } = useStore(s => s.settings)

  // User-set custom background
  if (backgroundType === 'image' && backgroundPath) {
    return (
      <img
        src={backgroundPath}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ objectFit: 'cover', objectPosition: 'top center' }}
      />
    )
  }

  if (backgroundType === 'video' && backgroundPath) {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src={backgroundPath}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', objectPosition: 'top center' }}
        />
      </div>
    )
  }

  // Default: the bundled WildStar-style launcher art — fills the window exactly
  return (
    <img
      src={launcherBg}
      alt=""
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ objectFit: 'fill' }}
    />
  )
}

