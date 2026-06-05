import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ServersPage from './pages/ServersPage'
import PatchNotesPage from './pages/PatchNotesPage'
import SettingsPage from './pages/SettingsPage'
import InitScreen from './components/InitScreen'

export default function App() {
  const { initialized, setInitialized, loadSettings, setUpdateState } = useStore()

  useEffect(() => {
    const init = async () => {
      await loadSettings()
      setInitialized(true)
    }
    init()

    // Wire up auto-updater events
    window.electron.onUpdateAvailable(info => {
      setUpdateState('available', info)
    })
    window.electron.onUpdateDownloading(pct => {
      setUpdateState('downloading', { version: '', percent: pct })
    })
    window.electron.onUpdateReady(() => {
      setUpdateState('ready')
    })
  }, [])

  if (!initialized) return <InitScreen />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/servers" element={<ServersPage />} />
        <Route path="/patch-notes" element={<PatchNotesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}
