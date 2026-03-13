import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import MeltyApp from './MeltyApp'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'ng'>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'ok' : 'ng')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setStatus(session ? 'ok' : 'ng')
    })
    return () => subscription.unsubscribe()
  }, [])

  if (status === 'loading') return null
  if (status === 'ng') return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* デフォルトはログインへリダイレクト */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 認証 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* メインアプリ（要認証） */}
        <Route path="/app/*" element={<ProtectedRoute><MeltyApp /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
