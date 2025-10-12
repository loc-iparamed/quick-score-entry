import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Management from './pages/Management'
import StudentsManagement from './pages/StudentsManagement'
import ScoreEntry from './pages/ScoreEntry'
import ChangePassword from './pages/ChangePassword'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true'
  })

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
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path='/register' element={isLoggedIn ? <Navigate to='/' /> : <Register />} />
          <Route path='/login' element={isLoggedIn ? <Navigate to='/' /> : <Login onLogin={handleLogin} />} />
          <Route path='/' element={isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to='/login' />} />
          <Route path='/students' element={isLoggedIn ? <StudentsManagement /> : <Navigate to='/login' />} />
          <Route path='/management' element={isLoggedIn ? <Management /> : <Navigate to='/login' />} />
          <Route path='/score-entry' element={isLoggedIn ? <ScoreEntry /> : <Navigate to='/login' />} />
          <Route path='/change-password' element={isLoggedIn ? <ChangePassword /> : <Navigate to='/login' />} />

          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
