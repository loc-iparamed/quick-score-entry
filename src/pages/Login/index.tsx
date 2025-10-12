import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../firebase-config.ts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, GraduationCap, Mail, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

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

    try {
      await signInWithEmailAndPassword(auth, username, password)
      onLogin()
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
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4'>
      <div className='w-full max-w-lg'>
        <Card className='shadow-2xl border-0 backdrop-blur-sm bg-white/90'>
          <CardHeader className='space-y-4 text-center pb-8'>
            <div className='mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg'>
              <GraduationCap className='w-10 h-10 text-white' />
            </div>
            <CardTitle className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
              Đăng Nhập
            </CardTitle>
            <CardDescription className='text-lg text-muted-foreground'>Hệ thống nhập điểm nhanh</CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='username' className='text-sm font-medium flex items-center gap-2'>
                  <Mail className='w-4 h-4' />
                  Tài khoản
                </Label>
                <Input
                  id='username'
                  type='text'
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder='Nhập email của bạn'
                  required
                  className='h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500'
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
                  placeholder='Nhập mật khẩu của bạn'
                  required
                  className='h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500'
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
                className='w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl'
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng Nhập'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className='justify-center'>
            <p className='text-sm text-muted-foreground'>
              Chưa có tài khoản?{' '}
              <Link
                to='/register'
                className='font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200'
              >
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Login
