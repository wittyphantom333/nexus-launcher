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

  // Default animated gradient
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-nexus-bg">
      {/* Deep purple glow – top-right */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-nexus-secondary/20 blur-[96px]" />
      {/* Cyan glow – bottom-left */}
      <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-nexus-primary/10 blur-[96px]" />
      {/* Center faint glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-nexus-primary/5 blur-[120px]" />
    </div>
  )
}
