import React, { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../firebase-config.ts'
import './Register.css'

interface RegisterProps {
  onRegisterSuccess?: () => void
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation cơ bản
    if (!email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      setLoading(false)
      return
    }

    try {
      // Tạo tài khoản mới với Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password)
      console.log('Đăng ký thành công')
      if (onRegisterSuccess) {
        onRegisterSuccess()
      }
    } catch (error: unknown) {
      console.error('Lỗi đăng ký:', error)
      const firebaseError = error as { code?: string }
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng.')
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Email không hợp lệ.')
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu.')
      } else {
        setError('Lỗi đăng ký. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='register-container'>
      <div className='register-form'>
        <h2>Đăng Ký Tài Khoản</h2>
        <p>Tạo tài khoản mới cho hệ thống nhập điểm nhanh</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className='form-group'>
            <label htmlFor='email'>Email</label>
            <input
              type='email'
              id='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='example@email.com'
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
              placeholder='Ít nhất 6 ký tự'
              required
            />
          </div>
          <div className='form-group'>
            <label htmlFor='confirmPassword'>Xác Nhận Mật Khẩu</label>
            <input
              type='password'
              id='confirmPassword'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder='Nhập lại mật khẩu'
              required
            />
          </div>
          {error && <div className='error-message'>{error}</div>}
          <button type='submit' disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng Ký'}
          </button>
        </form>
        <div className='register-links'>
          <p>
            Đã có tài khoản? <a href='/login'>Đăng nhập</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
