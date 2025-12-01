import React, { useState } from 'react'
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

    if (!username || !password) {
      setError('Vui lòng nhập tài khoản và mật khẩu.')
      setLoading(false)
      return
    }

    if (username !== 'admin' || password !== 'admin') {
      setError('Tài khoản hoặc mật khẩu không đúng.')
      setLoading(false)
      return
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      onLogin()
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
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
      </div>
    </div>
  )
}

export default Login
