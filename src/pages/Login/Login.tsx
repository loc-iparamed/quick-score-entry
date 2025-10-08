import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../firebase-config.ts'
import './Login.css'

interface LoginProps {
  onLogin: () => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation cơ bản
    if (!username || !password) {
      setError('Vui lòng nhập tài khoản và mật khẩu.')
      setLoading(false)
      return
    }

    try {
      // Đăng nhập với Firebase Auth
      await signInWithEmailAndPassword(auth, username, password)
      console.log('Đăng nhập thành công')
      onLogin() // Chuyển sang dashboard
    } catch (error: unknown) {
      console.error('Lỗi đăng nhập:', error)
      const firebaseError = error as { code?: string }
      if (firebaseError.code === 'auth/user-not-found') {
        setError('Tài khoản không tồn tại.')
      } else if (firebaseError.code === 'auth/wrong-password') {
        setError('Mật khẩu không đúng.')
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Email không hợp lệ.')
      } else {
        setError('Lỗi đăng nhập. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login-container'>
      <div className='login-form'>
        <h2>Đăng Nhập</h2>
        <p>Hệ thống nhập điểm nhanh</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className='form-group'>
            <label htmlFor='username'>Tài khoản</label>
            <input
              type='text'
              id='username'
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder='ví dụ: admin'
              required
            />
          </div>
          <div className='form-group'>
            <label htmlFor='password'>Mật Khẩu</label>
            <input
              type='password'
              id='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='ví dụ: admin'
              required
            />
          </div>
          {error && <div className='error-message'>{error}</div>}
          <button type='submit' disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>
        <div className='login-links'>
          <p>
            Chưa có tài khoản? <a href='/register'>Đăng ký ngay</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
