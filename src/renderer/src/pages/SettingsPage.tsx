import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { FolderOpen, Monitor, Settings, Palette, Bell, Gamepad2, Save, Check } from 'lucide-react'
import { useStore } from '../store'
import type { Settings as SettingsType } from '../types'

type Tab = 'general' | 'appearance' | 'notifications' | 'about'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Game', icon: Gamepad2 },
  { id: 'about', label: 'About', icon: Monitor }
]

export default function SettingsPage() {
  const { settings, updateSettings } = useStore()
  const [tab, setTab] = useState<Tab>('general')
  const [form, setForm] = useState<Partial<SettingsType>>({})
  const [saved, setSaved] = useState(false)
  const [pathValidation, setPathValidation] = useState<string | null>(null)

  useEffect(() => {
    setForm({ ...settings })
  }, [settings.gamePath, settings.language, settings.architecture,
      settings.discordRPC, settings.autoUpdate, settings.backgroundType,
      settings.backgroundPath, settings.accentColor, settings.closeToTray,
      settings.launchAndClose])

  const set = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleBrowseGamePath = async () => {
    const p = await window.electron.browseFolder()
    if (!p) return
    setPathValidation(null)
    const result = await window.electron.validateGamePath(p)
    if (result.valid) {
      set('gamePath', p)
      setPathValidation(null)
    } else {
      setPathValidation(result.error ?? 'Invalid path')
    }
  }

  const handleBrowseBackground = async () => {
    const p = await window.electron.browseFile([
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
      { name: 'Videos', extensions: ['mp4', 'webm'] }
    ])
    if (!p) return
    const isVideo = /\.(mp4|webm)$/i.test(p)
    setForm(prev => ({
      ...prev,
      backgroundPath: p,
      backgroundType: isVideo ? 'video' : 'image'
    }))
  }

  const handleAutoDetect = async () => {
    const p = await window.electron.findGame()
    if (p) {
      set('gamePath', p)
      setPathValidation(null)
    } else {
      setPathValidation('Could not auto-detect. Please select manually.')
    }
  }

  const handleSave = async () => {
    await updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-nexus-border shrink-0">
        <Settings className="w-4 h-4 text-nexus-primary" />
        <h1 className="font-display font-bold text-sm text-nexus-text-primary tracking-wide uppercase">
          Settings
        </h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left tab nav */}
        <nav className="w-36 shrink-0 border-r border-nexus-border p-2 space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all duration-150',
                tab === t.id
                  ? 'bg-nexus-primary/15 text-nexus-primary border border-nexus-primary/30'
                  : 'text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-white/5'
              )}
            >
              <t.icon className="w-3.5 h-3.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ─── General tab ─── */}
          {tab === 'general' && (
            <>
              <Section title="Game Installation" icon={FolderOpen}>
                <div>
                  <Label>Game Path</Label>
                  <div className="flex items-center gap-2">
                    <input
                      className="nexus-input flex-1"
                      placeholder="Select WildStar installation folder…"
                      value={form.gamePath ?? ''}
                      onChange={e => set('gamePath', e.target.value)}
                    />
                    <button onClick={handleBrowseGamePath} className="btn-ghost py-2.5 shrink-0">
                      Browse
                    </button>
                  </div>
                  {pathValidation && (
                    <p className="text-nexus-error text-xs mt-1">{pathValidation}</p>
                  )}
                  <button onClick={handleAutoDetect} className="text-nexus-primary text-xs mt-1.5 hover:opacity-80 transition-opacity">
                    Auto-detect from registry
                  </button>
                </div>

                <div>
                  <Label>Language</Label>
                  <Select
                    value={form.language ?? 'English'}
                    onChange={v => set('language', v as SettingsType['language'])}
                    options={['English', 'French', 'German']}
                  />
                </div>

                <div>
                  <Label>Architecture</Label>
                  <Select
                    value={form.architecture ?? '64bit'}
                    onChange={v => set('architecture', v as SettingsType['architecture'])}
                    options={['64bit', '32bit']}
                  />
                </div>
              </Section>

              <Section title="Behaviour" icon={Settings}>
                <Toggle
                  label="Close launcher after game starts"
                  checked={form.launchAndClose ?? false}
                  onChange={v => set('launchAndClose', v)}
                />
                <Toggle
                  label="Minimize to tray on close"
                  checked={form.closeToTray ?? false}
                  onChange={v => set('closeToTray', v)}
                />
                <Toggle
                  label="Auto-update launcher"
                  checked={form.autoUpdate ?? true}
                  onChange={v => set('autoUpdate', v)}
                />
              </Section>
            </>
          )}

          {/* ─── Appearance tab ─── */}
          {tab === 'appearance' && (
            <>
              <Section title="Background" icon={Palette}>
                <div>
                  <Label>Background Type</Label>
                  <Select
                    value={form.backgroundType ?? 'default'}
                    onChange={v => set('backgroundType', v as SettingsType['backgroundType'])}
                    options={['default', 'image', 'video']}
                  />
                </div>

                {(form.backgroundType === 'image' || form.backgroundType === 'video') && (
                  <div>
                    <Label>Background File</Label>
                    <div className="flex items-center gap-2">
                      <input
                        className="nexus-input flex-1 truncate"
                        readOnly
                        value={form.backgroundPath ?? ''}
                        placeholder="No file selected"
                      />
                      <button onClick={handleBrowseBackground} className="btn-ghost py-2.5 shrink-0">
                        Browse
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.accentColor ?? '#00D4FF'}
                      onChange={e => set('accentColor', e.target.value)}
                      className="w-10 h-10 rounded-xl border border-nexus-border bg-nexus-surface cursor-pointer"
                    />
                    <input
                      className="nexus-input flex-1 font-mono uppercase"
                      value={form.accentColor ?? '#00D4FF'}
                      onChange={e => set('accentColor', e.target.value)}
                      placeholder="#00D4FF"
                    />
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* ─── Game/notifications tab ─── */}
          {tab === 'notifications' && (
            <Section title="Integrations" icon={Bell}>
              <Toggle
                label="Discord Rich Presence"
                description="Show current server in Discord status"
                checked={form.discordRPC ?? true}
                onChange={v => set('discordRPC', v)}
              />
            </Section>
          )}

          {/* ─── About tab ─── */}
          {tab === 'about' && (
            <div className="nexus-card p-5 space-y-3">
              <p className="font-display font-bold text-nexus-primary text-lg">Nexus Launcher</p>
              <p className="text-nexus-text-muted text-sm">
                A modern launcher for the NexusForever WildStar private server emulator.
              </p>
              <div className="space-y-1 text-xs text-nexus-text-muted font-mono">
                <p>Built with Electron + React + TypeScript</p>
                <p>Licensed under AGPL-3.0</p>
              </div>
              <button
                onClick={() => window.electron.openExternal('https://github.com/wittyphantom333/nexus-launcher')}
                className="btn-ghost flex items-center gap-2 text-xs"
              >
                View on GitHub
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer save bar */}
      <div className="shrink-0 flex justify-end gap-2 px-5 py-3 border-t border-nexus-border">
        <button
          onClick={handleSave}
          className={clsx('btn-primary flex items-center gap-2 text-sm py-2', saved && 'opacity-80')}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ─── Small helpers ───────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="nexus-card p-4 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-nexus-border">
        <Icon className="w-3.5 h-3.5 text-nexus-primary" />
        <h3 className="font-display font-semibold text-nexus-text-primary text-sm tracking-wide uppercase">
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-nexus-text-secondary mb-1">{children}</label>
}

function Select({
  value,
  onChange,
  options
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      className="nexus-input appearance-none pr-8 cursor-pointer"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => (
        <option key={o} value={o} className="bg-nexus-surface">
          {o}
        </option>
      ))}
    </select>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-nexus-text-primary text-sm">{label}</p>
        {description && <p className="text-nexus-text-muted text-xs mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0',
          checked ? 'bg-nexus-primary' : 'bg-nexus-surface border border-nexus-border'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}
