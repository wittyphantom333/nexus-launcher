import launcherBg from '../assets/launcher-bg.png'
import { useStore } from '../store'

export default function BackgroundLayer() {
  const { backgroundType, backgroundPath } = useStore(s => s.settings)

  if (backgroundType === 'image' && backgroundPath) {
    return (
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${CSS.escape(backgroundPath)})` }}
      >
        <div className="absolute inset-0 bg-nexus-bg/75 backdrop-blur-sm" />
      </div>
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
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-nexus-bg/70 backdrop-blur-sm" />
      </div>
    )
  }

  // Default: use the bundled launcher background image
  return (
    <div
      className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${launcherBg})` }}
    />
  )
}
