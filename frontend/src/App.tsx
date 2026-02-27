import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import CustomerListPage from '@/pages/customers/CustomerListPage'
import CustomerDetailPage from '@/pages/customers/CustomerDetailPage'
import CustomerFormPage from '@/pages/customers/CustomerFormPage'
import VisitFormPage from '@/pages/customers/VisitFormPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import IncomePage from '@/pages/income/IncomePage'
import SettingsPage from '@/pages/settings/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* デフォルトはログインへリダイレクト */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 認証 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 顧客管理 */}
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/customers/new" element={<CustomerFormPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
        <Route path="/customers/:id/visits/new" element={<VisitFormPage />} />

        {/* カレンダー */}
        <Route path="/calendar" element={<CalendarPage />} />

        {/* 収入・成績 */}
        <Route path="/income" element={<IncomePage />} />

        {/* 設定 */}
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
