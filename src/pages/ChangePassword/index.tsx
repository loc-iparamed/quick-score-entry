import React, { useState } from 'react'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { auth } from '../../firebase-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.')
      return
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    setLoading(true)

    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        setError('Không thể xác định người dùng hiện tại.')
        return
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)

      setSuccess('Mật khẩu đã được thay đổi thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      console.error('Lỗi đổi mật khẩu:', error)
      const firebaseError = error as { code?: string }
      if (firebaseError.code === 'auth/wrong-password') {
        setError('Mật khẩu hiện tại không đúng.')
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Mật khẩu mới quá yếu.')
      } else if (firebaseError.code === 'auth/requires-recent-login') {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      } else {
        setError('Lỗi đổi mật khẩu. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4'>
      <div className='w-full max-w-md'>
        <Card className='shadow-2xl border-0 backdrop-blur-sm bg-white/90'>
          <CardHeader className='space-y-4 text-center pb-8'>
            <div className='mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg'>
              <Lock className='w-10 h-10 text-white' />
            </div>
            <CardTitle className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
              Đổi Mật Khẩu
            </CardTitle>
            <CardDescription className='text-lg text-muted-foreground'>
              Thay đổi mật khẩu tài khoản của bạn
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='currentPassword' className='text-sm font-medium flex items-center gap-2'>
                  <Lock className='w-4 h-4' />
                  Mật khẩu hiện tại
                </Label>
                <Input
                  id='currentPassword'
                  type='password'
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder='Nhập mật khẩu hiện tại'
                  required
                  className='h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='newPassword' className='text-sm font-medium flex items-center gap-2'>
                  <Lock className='w-4 h-4' />
                  Mật khẩu mới
                </Label>
                <Input
                  id='newPassword'
                  type='password'
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder='Nhập mật khẩu mới'
                  required
                  className='h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword' className='text-sm font-medium flex items-center gap-2'>
                  <Lock className='w-4 h-4' />
                  Xác nhận mật khẩu mới
                </Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder='Nhập lại mật khẩu mới'
                  required
                  className='h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500'
                />
              </div>

              {error && (
                <Alert variant='destructive' className='border-red-200 bg-red-50'>
                  <AlertDescription className='text-red-800'>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className='border-green-200 bg-green-50'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <AlertDescription className='text-green-800'>{success}</AlertDescription>
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
                  'Đổi Mật Khẩu'
                )}
              </Button>
            </form>
          </CardContent>

          <div className='px-6 pb-6'>
            <Link
              to='/'
              className='inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại Dashboard
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ChangePassword
