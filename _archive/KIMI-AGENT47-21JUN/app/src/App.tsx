import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

const TownWorld = lazy(() => import('./pages/TownWorld'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Directory = lazy(() => import('./pages/Directory'))
const Governance = lazy(() => import('./pages/Governance'))
const Settings = lazy(() => import('./pages/Settings'))

function LoadingFallback() {
  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-void)' }}
    >
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p
          className="text-sm text-[#8A8A9A]"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Loading...
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<TownWorld />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
