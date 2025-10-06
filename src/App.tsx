import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import './styles/App.css'

function App() {
  // Khởi tạo trạng thái đăng nhập từ localStorage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true'
  })

  // Cập nhật localStorage mỗi khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    localStorage.setItem('isLoggedIn', String(isLoggedIn))
  }, [isLoggedIn])

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={isLoggedIn ? <Navigate to='/' /> : <Login onLogin={handleLogin} />} />
        <Route path='/' element={isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to='/login' />} />
        {/* Redirect tất cả các route không hợp lệ về trang chủ */}
        <Route path='*' element={<Navigate to='/' />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
