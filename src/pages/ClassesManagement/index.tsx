import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, BookOpen, Users, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { classService, userService } from '@/services/firestore'
import type { Class, CreateClassData, User } from '@/types'

const ClassesManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState<CreateClassData>({
    name: '',
    semester: '',
    teacherId: '',
  })

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      const [classesData, teachersData] = await Promise.all([classService.getAll(), userService.getAll()])
      setClasses(classesData)
      setTeachers(teachersData)
    } catch (err) {
      setError('Không thể tải dữ liệu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Get teacher name by ID
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId)
    return teacher ? teacher.fullName : 'Không rõ'
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingClass) {
        // Update existing class
        await classService.update(editingClass.id, formData)
      } else {
        // Create new class
        await classService.create(formData)
      }

      await loadData()
      resetForm()
      setIsDialogOpen(false)
    } catch (err) {
      setError(editingClass ? 'Không thể cập nhật lớp học' : 'Không thể tạo lớp học')
      console.error(err)
    }
  }

  // Handle edit
  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem)
    setFormData({
      name: classItem.name,
      semester: classItem.semester,
      teacherId: classItem.teacherId,
    })
    setIsDialogOpen(true)
  }

  // Handle delete
  const handleDelete = async (classItem: Class) => {
    if (!confirm(`Bạn có chắc muốn xóa lớp học "${classItem.name}"?`)) {
      return
    }

    try {
      await classService.delete(classItem.id)
      await loadData()
    } catch (err) {
      setError('Không thể xóa lớp học')
      console.error(err)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', semester: '', teacherId: '' })
    setEditingClass(null)
  }

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900'></div>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <BookOpen className='h-6 w-6' />
                Quản lý Lớp học
              </CardTitle>
              <CardDescription>Quản lý thông tin lớp học và phân công giảng viên</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className='h-4 w-4 mr-2' />
                  Thêm Lớp học
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingClass ? 'Chỉnh sửa Lớp học' : 'Thêm Lớp học mới'}</DialogTitle>
                    <DialogDescription>
                      {editingClass ? 'Cập nhật thông tin lớp học' : 'Nhập thông tin lớp học mới'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='name'>Tên lớp học</Label>
                      <Input
                        id='name'
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder='Ví dụ: Lập trình Python - SE01'
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='semester'>Học kỳ</Label>
                      <Input
                        id='semester'
                        value={formData.semester}
                        onChange={e => setFormData({ ...formData, semester: e.target.value })}
                        placeholder='Ví dụ: 2025'
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='teacherId'>Giảng viên</Label>
                      <Select
                        value={formData.teacherId}
                        onValueChange={value => setFormData({ ...formData, teacherId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Chọn giảng viên' />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.fullName} ({teacher.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type='button' variant='outline' onClick={handleDialogClose}>
                      Hủy
                    </Button>
                    <Button type='submit'>{editingClass ? 'Cập nhật' : 'Tạo mới'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className='mb-4'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                Tổng cộng: <Badge variant='secondary'>{classes.length}</Badge> lớp học
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên lớp</TableHead>
                  <TableHead>Học kỳ</TableHead>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead className='text-center'>Sinh viên</TableHead>
                  <TableHead className='text-center'>Bài kiểm tra</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center py-8'>
                      <div className='text-muted-foreground'>
                        <BookOpen className='h-12 w-12 mx-auto mb-4 opacity-20' />
                        <p>Chưa có lớp học nào</p>
                        <p className='text-sm'>Hãy thêm lớp học đầu tiên</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map(classItem => (
                    <TableRow key={classItem.id}>
                      <TableCell className='font-medium'>{classItem.name}</TableCell>
                      <TableCell>
                        <Badge variant='outline'>{classItem.semester}</Badge>
                      </TableCell>
                      <TableCell>{getTeacherName(classItem.teacherId)}</TableCell>
                      <TableCell className='text-center'>
                        <div className='flex items-center justify-center gap-1'>
                          <Users className='h-4 w-4' />
                          <span>{classItem.studentCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-center'>
                        <div className='flex items-center justify-center gap-1'>
                          <GraduationCap className='h-4 w-4' />
                          <span>{classItem.examCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{classItem.createdAt.toDate().toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button variant='outline' size='sm' onClick={() => handleEdit(classItem)}>
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button variant='destructive' size='sm' onClick={() => handleDelete(classItem)}>
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClassesManagement
