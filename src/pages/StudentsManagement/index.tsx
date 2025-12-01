import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Users, Mail, Hash, Search, GraduationCap, ArrowLeft, UserCheck } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { studentService } from '@/services/firestore'
import type { Student, CreateStudentData } from '@/types'

const StudentsManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState<CreateStudentData>({
    mssv: '',
    fullName: '',
    email: '',
  })

  const loadStudents = async () => {
    try {
      setLoading(true)
      const data = await studentService.getAll()
      setStudents(data)
    } catch (err) {
      setError('Không thể tải danh sách sinh viên')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const refreshStudents = async () => {
    try {
      const data = await studentService.getAll()
      setStudents(data)
    } catch (err) {
      setError('Không thể tải lại danh sách sinh viên')
      console.error(err)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const getCreationDate = (student: Student) => {
    const dateField = student?.createdAt
    if (dateField && typeof dateField.toDate === 'function') {
      return dateField.toDate().toLocaleDateString('vi-VN')
    }
    return 'N/A'
  }

  const filteredStudents = students.filter(
    student =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mssv.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const emailToUse = formData.email || `${formData.mssv}@student.tdtu.edu.vn`

      if (!editingStudent) {
        const existingStudent = await studentService.getByMSSV(formData.mssv)
        if (existingStudent) {
          setError('Mã số sinh viên đã tồn tại')
          return
        }
      }

      const studentData = {
        ...formData,
        email: emailToUse,
      }

      if (editingStudent) {
        await studentService.update(editingStudent.id, studentData)
      } else {
        await studentService.create(studentData)
      }

      await refreshStudents()
      resetForm()
      setIsDialogOpen(false)
      setError(null)

      window.dispatchEvent(new CustomEvent('studentDataChanged'))
    } catch (err) {
      setError(editingStudent ? 'Không thể cập nhật sinh viên' : 'Không thể tạo sinh viên')
      console.error(err)
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      mssv: student.mssv,
      fullName: student.fullName,
      email: student.email,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (student: Student) => {
    if (!confirm(`Bạn có chắc muốn xóa sinh viên "${student.fullName}" (${student.mssv})?`)) {
      return
    }

    try {
      await studentService.delete(student.id)
      await refreshStudents()

      window.dispatchEvent(new CustomEvent('studentDataChanged'))
    } catch (err) {
      setError('Không thể xóa sinh viên')
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormData({ mssv: '', fullName: '', email: '' })
    setEditingStudent(null)
    setError(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gradient-to-r from-purple-600 to-pink-600'></div>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-7xl'>
      <div className='mb-6'>
        <Link to='/'>
          <Button variant='outline' className='flex items-center gap-2 hover:bg-gray-50'>
            <ArrowLeft className='h-4 w-4' />
            Quay về Dashboard
          </Button>
        </Link>
      </div>

      <div className='mb-8'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent'>
              Quản lý Sinh viên
            </h1>
            <p className='text-muted-foreground mt-2'>Quản lý thông tin sinh viên một cách hiệu quả và trực quan</p>
          </div>
          <div className='flex items-center gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
              <Input
                placeholder='Tìm kiếm sinh viên...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 w-64'
              />
            </div>
          </div>
        </div>

        {}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          <Card className='bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-purple-100 text-sm font-medium'>Tổng sinh viên</p>
                  <p className='text-3xl font-bold'>{students.length}</p>
                  <p className='text-purple-200 text-xs mt-1'>Đang học tập</p>
                </div>
                <GraduationCap className='w-12 h-12 text-purple-200' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-indigo-100 text-sm font-medium'>Tìm kiếm</p>
                  <p className='text-3xl font-bold'>{filteredStudents.length}</p>
                  <p className='text-indigo-200 text-xs mt-1'>Kết quả hiển thị</p>
                </div>
                <Search className='w-12 h-12 text-indigo-200' />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {}
      {error && (
        <Alert className='mb-6 border-red-200 bg-red-50'>
          <AlertDescription className='text-red-800'>{error}</AlertDescription>
        </Alert>
      )}

      {}
      <Card className='border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2 text-purple-900'>
                <GraduationCap className='h-6 w-6' />
                Danh sách Sinh viên
              </CardTitle>
              <CardDescription className='text-purple-700'>Quản lý thông tin sinh viên trong hệ thống</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => resetForm()}
                  className='bg-purple-300 hover:bg-purple-500 shadow-lg hover:shadow-xl transition-all duration-300'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Thêm Sinh viên
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border-2 border-purple-100 shadow-2xl'>
                <form onSubmit={handleSubmit}>
                  <DialogHeader className='space-y-4 pb-6'>
                    <div className='flex items-center gap-3'>
                      <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
                        <UserCheck className='h-6 w-6 text-white' />
                      </div>
                      <div>
                        <DialogTitle className='text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                          {editingStudent ? 'Chỉnh sửa Sinh viên' : 'Thêm Sinh viên mới'}
                        </DialogTitle>
                        <DialogDescription className='text-muted-foreground mt-1'>
                          {editingStudent ? 'Cập nhật thông tin sinh viên' : 'Nhập thông tin để tạo sinh viên mới'}
                        </DialogDescription>
                      </div>
                    </div>

                    {}
                    {formData.fullName && (
                      <div className='flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100'>
                        <Avatar className='h-16 w-16 shadow-md'>
                          <AvatarImage src='' />
                          <AvatarFallback className='bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg font-bold'>
                            {getInitials(formData.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-semibold text-purple-900'>{formData.fullName || 'Tên sinh viên'}</p>
                          <p className='text-sm text-purple-600'>{formData.mssv || 'MSSV'}</p>
                          <p className='text-xs text-purple-500'>
                            {formData.email || `${formData.mssv}@student.tdtu.edu.vn`}
                          </p>
                        </div>
                      </div>
                    )}
                  </DialogHeader>

                  <div className='space-y-6 py-4'>
                    <div className='grid grid-cols-1 gap-6'>
                      <div className='space-y-3'>
                        <Label htmlFor='mssv' className='text-sm font-semibold text-purple-900 flex items-center gap-2'>
                          <Hash className='h-4 w-4' />
                          Mã số sinh viên (MSSV)
                        </Label>
                        <Input
                          id='mssv'
                          value={formData.mssv}
                          onChange={e => setFormData({ ...formData, mssv: e.target.value })}
                          placeholder='Ví dụ: B2112345'
                          required
                          disabled={!!editingStudent}
                          className='border-purple-200 focus:border-purple-400 focus:ring-purple-400 transition-all duration-200'
                        />
                        {editingStudent && <p className='text-xs text-muted-foreground'>Không thể thay đổi MSSV</p>}
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <Label
                        htmlFor='fullName'
                        className='text-sm font-semibold text-purple-900 flex items-center gap-2'
                      >
                        <Users className='h-4 w-4' />
                        Họ và tên
                      </Label>
                      <Input
                        id='fullName'
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder='Nhập họ và tên đầy đủ'
                        required
                        className='border-purple-200 focus:border-purple-400 focus:ring-purple-400 transition-all duration-200'
                      />
                    </div>

                    <div className='space-y-3'>
                      <Label htmlFor='email' className='text-sm font-semibold text-purple-900 flex items-center gap-2'>
                        <Mail className='h-4 w-4' />
                        Email
                      </Label>
                      <Input
                        id='email'
                        type='email'
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder={`Tự động: ${formData.mssv}@student.tdtu.edu.vn`}
                        className='border-purple-200 focus:border-purple-400 focus:ring-purple-400 transition-all duration-200'
                      />
                      <p className='text-xs text-muted-foreground'>Để trống để tự động tạo email từ MSSV</p>
                    </div>
                  </div>

                  <DialogFooter className='flex gap-3 pt-6 border-t border-purple-100'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleDialogClose}
                      className='flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200'
                    >
                      Hủy
                    </Button>
                    <Button
                      type='submit'
                      className='flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'
                    >
                      {editingStudent ? (
                        <>
                          <Edit className='h-4 w-4 mr-2' />
                          Cập nhật
                        </>
                      ) : (
                        <>
                          <Plus className='h-4 w-4 mr-2' />
                          Tạo mới
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sinh viên</TableHead>
                <TableHead>MSSV</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-12'>
                    <div className='text-muted-foreground'>
                      <GraduationCap className='h-16 w-16 mx-auto mb-4 opacity-20' />
                      <p className='text-lg font-medium'>
                        {searchTerm ? 'Không tìm thấy sinh viên nào' : 'Chưa có sinh viên nào'}
                      </p>
                      <p className='text-sm'>
                        {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy thêm sinh viên đầu tiên để bắt đầu'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map(student => (
                  <TableRow key={student.id} className='hover:bg-purple-50/50 transition-colors'>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage src='' />
                          <AvatarFallback className='bg-purple-100 text-purple-700'>
                            {getInitials(student.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{student.fullName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Hash className='h-4 w-4 text-muted-foreground' />
                        <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200'>
                          {student.mssv}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Mail className='h-4 w-4 text-muted-foreground' />
                        {student.email}
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{getCreationDate(student)}</TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEdit(student)}
                          className='hover:bg-purple-50'
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => handleDelete(student)}
                          className='bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentsManagement
