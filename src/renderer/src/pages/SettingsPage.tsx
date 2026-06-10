import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { FolderOpen, Monitor, Gamepad2, Save, Check } from 'lucide-react'
import { useStore } from '../store'
import type { Settings as SettingsType } from '../types'

type Tab = 'general' | 'game' | 'about'

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'game', label: 'Game' },
  { id: 'about', label: 'About' },
]

export default function SettingsPage() {
  const { settings, updateSettings } = useStore()
  const [tab, setTab] = useState<Tab>('general')
  const [form, setForm] = useState<Partial<SettingsType>>({})
  const [saved, setSaved] = useState(false)
  const [pathError, setPathError] = useState<string | null>(null)
  const [updateCheckMsg, setUpdateCheckMsg] = useState<string>('')

  useEffect(() => { setForm({ ...settings }) }, [settings])

  const set = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleBrowseGamePath = async () => {
    const p = await window.electron.browseFolder()
    if (!p) return
    const result = await window.electron.validateGamePath(p)
    if (result.valid) { set('gamePath', p); setPathError(null) }
    else setPathError(result.error ?? 'Invalid path')
  }

  const handleAutoDetect = async () => {
    const p = await window.electron.findGame()
    if (p) { set('gamePath', p); setPathError(null) }
    else setPathError('Could not auto-detect. Please select manually.')
  }

  const handleSave = async () => {
    await updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    /* Opaque dark fill that stops above the bottom chrome */
    <div
      className="flex flex-col"
      style={{ background: '#0a1614', height: 'calc(100% - 13vh)' }}
    >
      {/* Tab strip */}
      <div
        className="shrink-0 flex items-center gap-1 px-6 pt-4 pb-0"
        style={{ borderBottom: '1px solid rgba(0,160,140,0.25)' }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-5 py-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors relative',
              tab === t.id ? 'text-[#40ead0]' : 'text-[#3a6070] hover:text-[#80c0b8]'
            )}
          >
            {t.label}
            {tab === t.id && (
              <span
                className="absolute bottom-0 inset-x-0 h-[2px]"
                style={{ background: '#00e8ca', boxShadow: '0 0 8px #00e8ca' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {tab === 'general' && (
          <>
            <Group title="Game Installation" icon={FolderOpen}>
              <Field label="Game Path">
                <div className="flex gap-2">
                  <input
                    className="nexus-input flex-1"
                    placeholder="Select WildStar installation folder"
                    value={form.gamePath ?? ''}
                    onChange={e => set('gamePath', e.target.value)}
                  />
                  <button onClick={handleBrowseGamePath} className="btn-ghost py-2 px-3 shrink-0 text-xs">
                    Browse
                  </button>
                </div>
                {pathError && <p className="text-nexus-error text-xs mt-1">{pathError}</p>}
                <button onClick={handleAutoDetect} className="text-nexus-primary text-xs mt-1 hover:opacity-80">
                  Auto-detect from registry
                </button>
              </Field>
              <Field label="Language">
                <WsSelect
                  value={form.language ?? 'English'}
                  onChange={v => set('language', v as SettingsType['language'])}
                  options={['English', 'French', 'German']}
                />
              </Field>
              <Field label="Architecture">
                <WsSelect
                  value={form.architecture ?? '64bit'}
                  onChange={v => set('architecture', v as SettingsType['architecture'])}
                  options={['64bit', '32bit']}
                />
              </Field>
            </Group>

            <Group title="Behaviour" icon={Gamepad2}>
              <Toggle label="Close launcher after game starts" checked={form.launchAndClose ?? false} onChange={v => set('launchAndClose', v)} />
              <Toggle label="Minimize to tray on close" checked={form.closeToTray ?? false} onChange={v => set('closeToTray', v)} />
              <Toggle label="Auto-update launcher" checked={form.autoUpdate ?? true} onChange={v => set('autoUpdate', v)} />
            </Group>
          </>
        )}

        {tab === 'game' && (
          <Group title="Integrations" icon={Monitor}>
            <Toggle
              label="Discord Rich Presence"
              description="Show current server in Discord status"
              checked={form.discordRPC ?? true}
              onChange={v => set('discordRPC', v)}
            />
          </Group>
        )}

        {tab === 'about' && (
          <div className="space-y-3 pt-2">
            <p className="text-[#40ead0] font-bold text-lg tracking-wide">Nexus Launcher</p>
            <p className="text-[#5a9080] text-sm leading-relaxed">
              A modern launcher for the NexusForever WildStar private server emulator.
            </p>
            <div className="space-y-1 text-xs text-[#3a6050] font-mono">
              <p>Built with Electron + React + TypeScript</p>
              <p>Licensed under AGPL-3.0</p>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => window.electron.openExternal('https://github.com/wittyphantom333/nexus-launcher')}
                className="text-[#40ead0] text-xs hover:opacity-80 transition-opacity"
              >
                View on GitHub
              </button>
              <button
                onClick={async () => {
                  setUpdateCheckMsg('Checking…')
                  const res = await window.electron.checkForUpdates()
                  if (res.dev) setUpdateCheckMsg('Updates disabled in dev mode')
                  else if (res.error) setUpdateCheckMsg(`Error: ${res.error}`)
                  else if (res.ok) setUpdateCheckMsg(res.version ? `Latest: v${res.version}` : 'You are up to date')
                  else setUpdateCheckMsg('You are up to date')
                  setTimeout(() => setUpdateCheckMsg(''), 4000)
                }}
                className="text-[#40ead0] text-xs hover:opacity-80 transition-opacity"
              >
                Check for Updates
              </button>
              {updateCheckMsg && (
                <span className="text-[#5a9080] text-xs">{updateCheckMsg}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div
        className="shrink-0 flex justify-end px-6 py-3"
        style={{ borderTop: '1px solid rgba(0,160,140,0.2)' }}
      >
        <button
          onClick={handleSave}
          className={clsx('btn-primary flex items-center gap-2 text-sm py-2', saved && 'opacity-75')}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Group({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded" style={{ background: 'rgba(0,20,18,0.6)', border: '1px solid rgba(0,160,140,0.2)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(0,160,140,0.15)' }}>
        <Icon className="w-3.5 h-3.5 text-[#00c8b0]" />
        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#40ead0]">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[#3a7868] mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function WsSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      className="nexus-input appearance-none cursor-pointer w-full"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => <option key={o} value={o} className="bg-nexus-surface">{o}</option>)}
    </select>
  )
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[#90b8a8] text-sm">{label}</p>
        {description && <p className="text-[#3a6050] text-xs mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0',
          checked ? 'bg-[#00a880]' : 'bg-[#0d1a18] border border-[#1a3830]'
        )}
      >
        <span className={clsx(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </button>
    </div>
  )
}
