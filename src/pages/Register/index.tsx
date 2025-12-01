import React, { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus, Mail, Lock, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

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
      await createUserWithEmailAndPassword(auth, email, password)
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
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4'>
      <div className='w-full max-w-lg'>
        <Card className='shadow-2xl border-0 backdrop-blur-sm bg-white/90'>
          <CardHeader className='space-y-4 text-center pb-8'>
            <div className='mx-auto w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg'>
              <UserPlus className='w-10 h-10 text-white' />
            </div>
            <CardTitle className='text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
              Đăng Ký Tài Khoản
            </CardTitle>
            <CardDescription className='text-lg text-muted-foreground'>
              Tạo tài khoản mới cho hệ thống nhập điểm nhanh
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='email' className='text-sm font-medium flex items-center gap-2'>
                  <Mail className='w-4 h-4' />
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder='example@email.com'
                  required
                  className='h-12 transition-all duration-200 focus:ring-2 focus:ring-green-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password' className='text-sm font-medium flex items-center gap-2'>
                  <Lock className='w-4 h-4' />
                  Mật khẩu
                </Label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder='Ít nhất 6 ký tự'
                  required
                  className='h-12 transition-all duration-200 focus:ring-2 focus:ring-green-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword' className='text-sm font-medium flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4' />
                  Xác nhận mật khẩu
                </Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder='Nhập lại mật khẩu'
                  required
                  className='h-12 transition-all duration-200 focus:ring-2 focus:ring-green-500'
                />
              </div>

              {error && (
                <Alert variant='destructive' className='border-red-200 bg-red-50'>
                  <AlertDescription className='text-red-800'>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type='submit'
                disabled={loading}
                className='w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl'
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng Ký'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className='justify-center'>
            <p className='text-sm text-muted-foreground'>
              Đã có tài khoản?{' '}
              <Link
                to='/login'
                className='font-medium text-green-600 hover:text-green-700 transition-colors duration-200'
              >
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Register
