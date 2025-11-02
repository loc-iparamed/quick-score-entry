import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Settings, Edit3, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ClassSettingsSectionProps {
  currentClassName: string
  classId: string
  onClassNameUpdate: (newName: string) => Promise<void>
  onDeleteClass: () => Promise<void>
}

const ClassSettingsSection: React.FC<ClassSettingsSectionProps> = ({
  currentClassName,
  classId,
  onClassNameUpdate,
  onDeleteClass,
}) => {
  const [newClassName, setNewClassName] = useState(currentClassName)
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isDeletingClass, setIsDeletingClass] = useState(false)

  const handleUpdateClassName = async () => {
    if (!newClassName.trim()) {
      toast.error('Tên lớp không được để trống!')
      return
    }

    if (newClassName.trim() === currentClassName) {
      toast.info('Tên lớp không thay đổi')
      return
    }

    setIsUpdatingName(true)
    try {
      await onClassNameUpdate(newClassName.trim())
      toast.success('Đã cập nhật tên lớp thành công!')
    } catch (error) {
      console.error('Error updating class name:', error)
      toast.error('Có lỗi xảy ra khi cập nhật tên lớp')
      setNewClassName(currentClassName) // Reset to original name
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleDeleteClass = async () => {
    setIsDeletingClass(true)
    try {
      await onDeleteClass()
      toast.success('Đã xóa lớp học thành công!')
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Có lỗi xảy ra khi xóa lớp học')
    } finally {
      setIsDeletingClass(false)
    }
  }

  return (
    <div className='space-y-6 py-4'>
      <h3 className='text-lg font-semibold flex items-center gap-2'>
        <Settings className='w-5 h-5 text-gray-600' />
        Cài đặt lớp học
      </h3>

      {/* Class Name Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Edit3 className='w-4 h-4 text-blue-600' />
            Thông tin lớp học
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>Tên lớp học</label>
            <div className='flex gap-2'>
              <Input
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                placeholder='Nhập tên lớp học'
                className='flex-1'
                disabled={isUpdatingName}
              />
              <Button
                onClick={handleUpdateClassName}
                disabled={isUpdatingName || !newClassName.trim()}
                className='flex items-center gap-2'
              >
                {isUpdatingName ? (
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                ) : (
                  <Edit3 className='w-4 h-4' />
                )}
                {isUpdatingName ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
            <p className='text-sm text-muted-foreground mt-2'>
              ID lớp: <code className='bg-slate-100 px-1 py-0.5 rounded text-xs'>{classId}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dangerous Actions */}
      <Card className='border-red-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base text-red-700'>
            <AlertTriangle className='w-4 h-4' />
            Vùng nguy hiểm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
            <h4 className='font-semibold text-red-800 mb-2'>Xóa lớp học</h4>
            <p className='text-sm text-red-700 mb-4'>
              Hành động này sẽ xóa vĩnh viễn lớp học và tất cả dữ liệu liên quan (sinh viên, bài kiểm tra, điểm số).
              <strong className='block mt-1'>Không thể hoàn tác!</strong>
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant='destructive' size='sm' disabled={isDeletingClass} className='flex items-center gap-2'>
                  {isDeletingClass ? (
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                  ) : (
                    <Trash2 className='w-4 h-4' />
                  )}
                  {isDeletingClass ? 'Đang xóa...' : 'Xóa lớp học'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2 text-red-700'>
                    <AlertTriangle className='w-5 h-5' />
                    Xác nhận xóa lớp học
                  </DialogTitle>
                  <DialogDescription className='space-y-2'>
                    <p>
                      Bạn có chắc chắn muốn xóa lớp học <strong>"{currentClassName}"</strong> không?
                    </p>
                    <div className='bg-red-50 p-3 rounded-lg border border-red-200'>
                      <p className='text-sm text-red-800 font-medium'>⚠️ Hành động này sẽ xóa vĩnh viễn:</p>
                      <ul className='text-sm text-red-700 mt-2 space-y-1 list-disc list-inside'>
                        <li>Tất cả sinh viên trong lớp</li>
                        <li>Tất cả bài kiểm tra và điểm số</li>
                        <li>Mọi dữ liệu liên quan đến lớp học</li>
                      </ul>
                      <p className='text-sm text-red-800 font-semibold mt-2'>Không thể hoàn tác sau khi xóa!</p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className='gap-2'>
                  <Button variant='outline' disabled={isDeletingClass}>
                    Hủy bỏ
                  </Button>
                  <Button onClick={handleDeleteClass} disabled={isDeletingClass} variant='destructive'>
                    {isDeletingClass ? (
                      <div className='flex items-center gap-2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                        Đang xóa...
                      </div>
                    ) : (
                      <div className='flex items-center gap-2'>
                        <Trash2 className='w-4 h-4' />
                        Xóa vĩnh viễn
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClassSettingsSection
