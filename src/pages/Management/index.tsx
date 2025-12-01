import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Edit,
  Trash2,
  Users,
  BookOpen,
  GraduationCap,
  Mail,
  Hash,
  Search,
  UserCheck,
  Award,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { userService, classService, studentService, enrollmentService } from '@/services/firestore'
import type { User, Class, Student, CreateUserData, CreateClassData, CreateStudentData, Enrollment } from '@/types'

const Management: React.FC = () => {
  const [teachers, setTeachers] = useState<User[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [currentTab, setCurrentTab] = useState('teachers')
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState<Class | null>(null)
  const [selectedStudentForEnrollment, setSelectedStudentForEnrollment] = useState<Student | null>(null)

  const [teacherFormData, setTeacherFormData] = useState<CreateUserData>({
    fullName: '',
    email: '',
    role: 'teacher',
  })

  const [classFormData, setClassFormData] = useState<CreateClassData>({
    name: '',
    semester: '',
    teacherId: '',
  })

  const [studentFormData, setStudentFormData] = useState<CreateStudentData>({
    mssv: '',
    fullName: '',
    email: '',
  })

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [teachersData, classesData, studentsData, enrollmentsData] = await Promise.all([
        userService.getAll(),
        classService.getAll(),
        studentService.getAll(),
        enrollmentService.getAll(),
      ])
      setTeachers(teachersData)
      setClasses(classesData)
      setStudents(studentsData)
      setEnrollments(enrollmentsData)
    } catch (err) {
      setError('Không thể tải dữ liệu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId)
    return teacher ? teacher.fullName : 'Không rõ'
  }

  const getEnrolledStudents = (classId: string) => {
    return enrollments
      .filter(e => e.classId === classId)
      .map(e => students.find(s => s.id === e.studentId))
      .filter(Boolean) as Student[]
  }

  const getEnrolledClasses = (studentId: string) => {
    return enrollments
      .filter(e => e.studentId === studentId)
      .map(e => classes.find(c => c.id === e.classId))
      .filter(Boolean) as Class[]
  }

  const isStudentEnrolled = (studentId: string, classId: string) => {
    return enrollments.some(e => e.studentId === studentId && e.classId === classId)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const filteredTeachers = teachers.filter(
    teacher =>
      teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch =
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTeacherName(classItem.teacherId).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSemester = selectedSemester === 'all' || classItem.semester === selectedSemester
    return matchesSearch && matchesSemester
  })

  const filteredStudents = students.filter(
    student =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mssv.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTeacher) {
        await userService.update(editingTeacher.id, {
          fullName: teacherFormData.fullName,
          email: teacherFormData.email,
        })
      } else {
        await userService.create(teacherFormData)
      }
      await loadAllData()
      resetTeacherForm()
      setIsDialogOpen(false)
    } catch (err) {
      setError(editingTeacher ? 'Không thể cập nhật giảng viên' : 'Không thể tạo giảng viên')
      console.error(err)
    }
  }

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingClass) {
        await classService.update(editingClass.id, classFormData)
      } else {
        await classService.create(classFormData)
      }
      await loadAllData()
      resetClassForm()
      setIsDialogOpen(false)
    } catch (err) {
      setError(editingClass ? 'Không thể cập nhật lớp học' : 'Không thể tạo lớp học')
      console.error(err)
    }
  }

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const emailToUse = studentFormData.email || `${studentFormData.mssv}@student.tdtu.edu.vn`

      if (!editingStudent) {
        const existingStudent = await studentService.getByMSSV(studentFormData.mssv)
        if (existingStudent) {
          setError('Mã số sinh viên đã tồn tại')
          return
        }
      }

      const studentData = {
        ...studentFormData,
        email: emailToUse,
      }

      if (editingStudent) {
        await studentService.update(editingStudent.id, studentData)
      } else {
        await studentService.create(studentData)
      }
      await loadAllData()
      resetStudentForm()
      setIsDialogOpen(false)
      setError(null)

      window.dispatchEvent(new CustomEvent('studentDataChanged'))
    } catch (err) {
      setError(editingStudent ? 'Không thể cập nhật sinh viên' : 'Không thể tạo sinh viên')
      console.error(err)
    }
  }

  const handleEditTeacher = (teacher: User) => {
    setEditingTeacher(teacher)
    setTeacherFormData({
      fullName: teacher.fullName,
      email: teacher.email,
      role: 'teacher',
    })
    setCurrentTab('teachers')
    setIsDialogOpen(true)
  }

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem)
    setClassFormData({
      name: classItem.name,
      semester: classItem.semester,
      teacherId: classItem.teacherId,
    })
    setCurrentTab('classes')
    setIsDialogOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setStudentFormData({
      mssv: student.mssv,
      fullName: student.fullName,
      email: student.email,
    })
    setCurrentTab('students')
    setIsDialogOpen(true)
  }

  const handleDeleteTeacher = async (teacher: User) => {
    if (!confirm(`Bạn có chắc muốn xóa giảng viên "${teacher.fullName}"?`)) return
    try {
      await userService.delete(teacher.id)
      await loadAllData()
    } catch (err) {
      setError('Không thể xóa giảng viên')
      console.error(err)
    }
  }

  const handleDeleteClass = async (classItem: Class) => {
    if (!confirm(`Bạn có chắc muốn xóa lớp học "${classItem.name}"?`)) return
    try {
      await classService.delete(classItem.id)
      await loadAllData()
    } catch (err) {
      setError('Không thể xóa lớp học')
      console.error(err)
    }
  }

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Bạn có chắc muốn xóa sinh viên "${student.fullName}" (${student.mssv})?`)) return
    try {
      await studentService.delete(student.id)
      await loadAllData()

      window.dispatchEvent(new CustomEvent('studentDataChanged'))
    } catch (err) {
      setError('Không thể xóa sinh viên')
      console.error(err)
    }
  }

  const resetTeacherForm = () => {
    setTeacherFormData({ fullName: '', email: '', role: 'teacher' })
    setEditingTeacher(null)
  }

  const resetClassForm = () => {
    setClassFormData({ name: '', semester: '', teacherId: '' })
    setEditingClass(null)
  }

  const resetStudentForm = () => {
    setStudentFormData({ mssv: '', fullName: '', email: '' })
    setEditingStudent(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetTeacherForm()
    resetClassForm()
    resetStudentForm()
  }

  const handleEnrollStudent = async (studentId: string, classId: string) => {
    try {
      await enrollmentService.create({ studentId, classId })
      await loadAllData()
      setError(null)
    } catch (err) {
      setError('Không thể thêm sinh viên vào lớp')
      console.error(err)
    }
  }

  const handleUnenrollStudent = async (enrollmentId: string) => {
    try {
      await enrollmentService.delete(enrollmentId)
      await loadAllData()
      setError(null)
    } catch (err) {
      setError('Không thể xóa sinh viên khỏi lớp')
      console.error(err)
    }
  }

  const semesters = Array.from(new Set(classes.map(c => c.semester))).sort()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gradient-to-r from-blue-600 to-purple-600'></div>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-7xl'>
      {}
      <div className='mb-6'>
        <Link to='/'>
          <Button variant='outline' className='flex items-center gap-2 hover:bg-gray-50'>
            <ArrowLeft className='h-4 w-4' />
            Quay về Dashboard
          </Button>
        </Link>
      </div>

      {}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent'>
              Quản lý Hệ thống
            </h1>
            <p className='text-muted-foreground mt-2'>Quản lý giảng viên, lớp học và sinh viên một cách hiệu quả</p>
          </div>
          <div className='flex items-center gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
              <Input
                placeholder='Tìm kiếm...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 w-64'
              />
            </div>
          </div>
        </div>

        {}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <Card className='bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-blue-100 text-sm font-medium'>Giảng viên</p>
                  <p className='text-3xl font-bold'>{teachers.length}</p>
                  <p className='text-blue-200 text-xs mt-1'>Đang hoạt động</p>
                </div>
                <Users className='w-12 h-12 text-blue-200' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-emerald-100 text-sm font-medium'>Lớp học</p>
                  <p className='text-3xl font-bold'>{classes.length}</p>
                  <p className='text-emerald-200 text-xs mt-1'>Đang giảng dạy</p>
                </div>
                <BookOpen className='w-12 h-12 text-emerald-200' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-purple-100 text-sm font-medium'>Sinh viên</p>
                  <p className='text-3xl font-bold'>{students.length}</p>
                  <p className='text-purple-200 text-xs mt-1'>Đang học tập</p>
                </div>
                <GraduationCap className='w-12 h-12 text-purple-200' />
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
      <Tabs value={currentTab} onValueChange={setCurrentTab} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3 bg-muted/50 p-1'>
          <TabsTrigger
            value='teachers'
            className='flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm'
          >
            <Users className='h-4 w-4' />
            Giảng viên ({teachers.length})
          </TabsTrigger>
          <TabsTrigger
            value='classes'
            className='flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm'
          >
            <BookOpen className='h-4 w-4' />
            Lớp học ({classes.length})
          </TabsTrigger>
          <TabsTrigger
            value='students'
            className='flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm'
          >
            <GraduationCap className='h-4 w-4' />
            Sinh viên ({students.length})
          </TabsTrigger>
        </TabsList>

        {}
        <TabsContent value='teachers' className='space-y-6'>
          <Card className='border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2 text-blue-900'>
                    <Users className='h-6 w-6' />
                    Danh sách Giảng viên
                  </CardTitle>
                  <CardDescription className='text-blue-700'>
                    Quản lý thông tin giảng viên trong hệ thống
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen && currentTab === 'teachers'} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        resetTeacherForm()
                        setCurrentTab('teachers')
                      }}
                      className='bg-blue-600 hover:bg-blue-700'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Thêm Giảng viên
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='sm:max-w-md'>
                    <form onSubmit={handleTeacherSubmit}>
                      <DialogHeader>
                        <DialogTitle className='flex items-center gap-2'>
                          <UserCheck className='h-5 w-5' />
                          {editingTeacher ? 'Chỉnh sửa Giảng viên' : 'Thêm Giảng viên mới'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingTeacher ? 'Cập nhật thông tin giảng viên' : 'Nhập thông tin giảng viên mới'}
                        </DialogDescription>
                      </DialogHeader>

                      <div className='space-y-4 py-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='teacher-fullName'>Họ và tên</Label>
                          <Input
                            id='teacher-fullName'
                            value={teacherFormData.fullName}
                            onChange={e => setTeacherFormData({ ...teacherFormData, fullName: e.target.value })}
                            placeholder='Nhập họ và tên'
                            required
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='teacher-email'>Email</Label>
                          <Input
                            id='teacher-email'
                            type='email'
                            value={teacherFormData.email}
                            onChange={e => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
                            placeholder='email@example.com'
                            required
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type='button' variant='outline' onClick={handleDialogClose}>
                          Hủy
                        </Button>
                        <Button type='submit' className='bg-blue-600 hover:bg-blue-700'>
                          {editingTeacher ? 'Cập nhật' : 'Tạo mới'}
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
                    <TableHead>Giảng viên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-12'>
                        <div className='text-muted-foreground'>
                          <Users className='h-16 w-16 mx-auto mb-4 opacity-20' />
                          <p className='text-lg font-medium'>Chưa có giảng viên nào</p>
                          <p className='text-sm'>Hãy thêm giảng viên đầu tiên để bắt đầu</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeachers.map(teacher => (
                      <TableRow key={teacher.id} className='hover:bg-blue-50/50 transition-colors'>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-10 w-10'>
                              <AvatarImage src='' />
                              <AvatarFallback className='bg-blue-100 text-blue-700'>
                                {getInitials(teacher.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium'>{teacher.fullName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Mail className='h-4 w-4 text-muted-foreground' />
                            {teacher.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
                            Giảng viên
                          </Badge>
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {teacher.createdAt.toDate().toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleEditTeacher(teacher)}
                              className='hover:bg-blue-50'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button variant='destructive' size='sm' onClick={() => handleDeleteTeacher(teacher)}>
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
        </TabsContent>

        {}
        <TabsContent value='classes' className='space-y-6'>
          <Card className='border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2 text-emerald-900'>
                    <BookOpen className='h-6 w-6' />
                    Danh sách Lớp học
                  </CardTitle>
                  <CardDescription className='text-emerald-700'>
                    Quản lý thông tin lớp học và phân công giảng viên
                  </CardDescription>
                </div>
                <div className='flex items-center gap-4'>
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger className='w-40'>
                      <SelectValue placeholder='Chọn học kỳ' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Tất cả học kỳ</SelectItem>
                      {semesters.map(semester => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isDialogOpen && currentTab === 'classes'} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          resetClassForm()
                          setCurrentTab('classes')
                        }}
                        className='bg-emerald-600 hover:bg-emerald-700'
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        Thêm Lớp học
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-md'>
                      <form onSubmit={handleClassSubmit}>
                        <DialogHeader>
                          <DialogTitle className='flex items-center gap-2'>
                            <BookOpen className='h-5 w-5' />
                            {editingClass ? 'Chỉnh sửa Lớp học' : 'Thêm Lớp học mới'}
                          </DialogTitle>
                          <DialogDescription>
                            {editingClass ? 'Cập nhật thông tin lớp học' : 'Nhập thông tin lớp học mới'}
                          </DialogDescription>
                        </DialogHeader>

                        <div className='space-y-4 py-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='class-name'>Tên lớp học</Label>
                            <Input
                              id='class-name'
                              value={classFormData.name}
                              onChange={e => setClassFormData({ ...classFormData, name: e.target.value })}
                              placeholder='Ví dụ: Lập trình Python - SE01'
                              required
                            />
                          </div>

                          <div className='space-y-2'>
                            <Label htmlFor='class-semester'>Học kỳ</Label>
                            <Input
                              id='class-semester'
                              value={classFormData.semester}
                              onChange={e => setClassFormData({ ...classFormData, semester: e.target.value })}
                              placeholder='Ví dụ: 2025'
                              required
                            />
                          </div>

                          <div className='space-y-2'>
                            <Label htmlFor='class-teacherId'>Giảng viên</Label>
                            <Select
                              value={classFormData.teacherId}
                              onValueChange={value => setClassFormData({ ...classFormData, teacherId: value })}
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
                          <Button type='submit' className='bg-emerald-600 hover:bg-emerald-700'>
                            {editingClass ? 'Cập nhật' : 'Tạo mới'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lớp học</TableHead>
                    <TableHead>Học kỳ</TableHead>
                    <TableHead>Giảng viên</TableHead>
                    <TableHead className='text-center'>Sinh viên</TableHead>
                    <TableHead className='text-center'>Bài kiểm tra</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-12'>
                        <div className='text-muted-foreground'>
                          <BookOpen className='h-16 w-16 mx-auto mb-4 opacity-20' />
                          <p className='text-lg font-medium'>Chưa có lớp học nào</p>
                          <p className='text-sm'>Hãy thêm lớp học đầu tiên để bắt đầu</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClasses.map(classItem => (
                      <TableRow key={classItem.id} className='hover:bg-emerald-50/50 transition-colors'>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center'>
                              <BookOpen className='h-5 w-5 text-emerald-600' />
                            </div>
                            <div>
                              <p className='font-medium'>{classItem.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='bg-emerald-50 text-emerald-700 border-emerald-200'>
                            {classItem.semester}
                          </Badge>
                        </TableCell>
                        <TableCell>{getTeacherName(classItem.teacherId)}</TableCell>
                        <TableCell className='text-center'>
                          <div className='flex items-center justify-center gap-2'>
                            <Users className='h-4 w-4 text-muted-foreground' />
                            <span className='font-medium'>{classItem.studentCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-center'>
                          <div className='flex items-center justify-center gap-2'>
                            <Award className='h-4 w-4 text-muted-foreground' />
                            <span className='font-medium'>{classItem.examCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {classItem.createdAt.toDate().toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setSelectedClassForEnrollment(classItem)}
                              className='hover:bg-emerald-50'
                            >
                              <Users className='h-4 w-4 mr-1' />
                              Sinh viên
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleEditClass(classItem)}
                              className='hover:bg-emerald-50'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button variant='destructive' size='sm' onClick={() => handleDeleteClass(classItem)}>
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
        </TabsContent>

        {}
        <Dialog open={!!selectedClassForEnrollment} onOpenChange={() => setSelectedClassForEnrollment(null)}>
          <DialogContent className='sm:max-w-2xl max-h-[80vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Quản lý sinh viên - {selectedClassForEnrollment?.name}
              </DialogTitle>
              <DialogDescription>Thêm hoặc xóa sinh viên khỏi lớp học</DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {}
              <div>
                <h4 className='text-sm font-medium text-slate-700 mb-2'>
                  Sinh viên đã đăng ký ({getEnrolledStudents(selectedClassForEnrollment?.id || '').length})
                </h4>
                <div className='space-y-2 max-h-40 overflow-y-auto'>
                  {getEnrolledStudents(selectedClassForEnrollment?.id || '').map(student => {
                    const enrollment = enrollments.find(
                      e => e.studentId === student.id && e.classId === selectedClassForEnrollment?.id,
                    )
                    return (
                      <div key={student.id} className='flex items-center justify-between p-2 bg-slate-50 rounded-lg'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarFallback className='bg-blue-100 text-blue-700 text-xs'>
                              {getInitials(student.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>{student.fullName}</p>
                            <p className='text-xs text-muted-foreground'>{student.mssv}</p>
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => enrollment && handleUnenrollStudent(enrollment.id)}
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    )
                  })}
                  {getEnrolledStudents(selectedClassForEnrollment?.id || '').length === 0 && (
                    <p className='text-sm text-muted-foreground text-center py-4'>Chưa có sinh viên nào</p>
                  )}
                </div>
              </div>

              {}
              <div>
                <h4 className='text-sm font-medium text-slate-700 mb-2'>Thêm sinh viên</h4>
                <div className='space-y-2'>
                  {students
                    .filter(student => !isStudentEnrolled(student.id, selectedClassForEnrollment?.id || ''))
                    .map(student => (
                      <div key={student.id} className='flex items-center justify-between p-2 border rounded-lg'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarFallback className='bg-green-100 text-green-700 text-xs'>
                              {getInitials(student.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>{student.fullName}</p>
                            <p className='text-xs text-muted-foreground'>{student.mssv}</p>
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEnrollStudent(student.id, selectedClassForEnrollment?.id || '')}
                          className='text-green-600 hover:text-green-700 hover:bg-green-50'
                        >
                          <Plus className='h-4 w-4 mr-1' />
                          Thêm
                        </Button>
                      </div>
                    ))}
                  {students.filter(student => !isStudentEnrolled(student.id, selectedClassForEnrollment?.id || ''))
                    .length === 0 && (
                    <p className='text-sm text-muted-foreground text-center py-4'>Tất cả sinh viên đã được thêm</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedClassForEnrollment(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {}
        <TabsContent value='students' className='space-y-6'>
          <Card className='border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2 text-purple-900'>
                    <GraduationCap className='h-6 w-6' />
                    Danh sách Sinh viên
                  </CardTitle>
                  <CardDescription className='text-purple-700'>
                    Quản lý thông tin sinh viên trong hệ thống
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen && currentTab === 'students'} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        resetStudentForm()
                        setCurrentTab('students')
                      }}
                      className='bg-purple-600 hover:bg-purple-700'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Thêm Sinh viên
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='sm:max-w-md'>
                    <form onSubmit={handleStudentSubmit}>
                      <DialogHeader>
                        <DialogTitle className='flex items-center gap-2'>
                          <GraduationCap className='h-5 w-5' />
                          {editingStudent ? 'Chỉnh sửa Sinh viên' : 'Thêm Sinh viên mới'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingStudent ? 'Cập nhật thông tin sinh viên' : 'Nhập thông tin sinh viên mới'}
                        </DialogDescription>
                      </DialogHeader>

                      <div className='space-y-4 py-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='student-mssv'>Mã số sinh viên (MSSV)</Label>
                          <Input
                            id='student-mssv'
                            value={studentFormData.mssv}
                            onChange={e => setStudentFormData({ ...studentFormData, mssv: e.target.value })}
                            placeholder='Ví dụ: B2112345'
                            required
                            disabled={!!editingStudent}
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='student-fullName'>Họ và tên</Label>
                          <Input
                            id='student-fullName'
                            value={studentFormData.fullName}
                            onChange={e => setStudentFormData({ ...studentFormData, fullName: e.target.value })}
                            placeholder='Nhập họ và tên'
                            required
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='student-email'>Email</Label>
                          <Input
                            id='student-email'
                            type='email'
                            value={studentFormData.email}
                            onChange={e => setStudentFormData({ ...studentFormData, email: e.target.value })}
                            placeholder={`Tự động: ${studentFormData.mssv}@student.tdtu.edu.vn`}
                          />
                          <p className='text-xs text-muted-foreground'>Để trống để tự động tạo email từ MSSV</p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type='button' variant='outline' onClick={handleDialogClose}>
                          Hủy
                        </Button>
                        <Button type='submit' className='bg-purple-600 hover:bg-purple-700'>
                          {editingStudent ? 'Cập nhật' : 'Tạo mới'}
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
                      <TableCell colSpan={5} className='text-center py-12'>
                        <div className='text-muted-foreground'>
                          <GraduationCap className='h-16 w-16 mx-auto mb-4 opacity-20' />
                          <p className='text-lg font-medium'>Chưa có sinh viên nào</p>
                          <p className='text-sm'>Hãy thêm sinh viên đầu tiên để bắt đầu</p>
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
                        <TableCell className='text-muted-foreground'>
                          {student.createdAt.toDate().toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setSelectedStudentForEnrollment(student)}
                              className='hover:bg-purple-50'
                            >
                              <BookOpen className='h-4 w-4 mr-1' />
                              Lớp học
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleEditStudent(student)}
                              className='hover:bg-purple-50'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button variant='destructive' size='sm' onClick={() => handleDeleteStudent(student)}>
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
        </TabsContent>

        {}
        <Dialog open={!!selectedStudentForEnrollment} onOpenChange={() => setSelectedStudentForEnrollment(null)}>
          <DialogContent className='sm:max-w-2xl max-h-[80vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <BookOpen className='h-5 w-5' />
                Quản lý lớp học - {selectedStudentForEnrollment?.fullName}
              </DialogTitle>
              <DialogDescription>Thêm hoặc xóa sinh viên khỏi các lớp học</DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {}
              <div>
                <h4 className='text-sm font-medium text-slate-700 mb-2'>
                  Lớp học đã đăng ký ({getEnrolledClasses(selectedStudentForEnrollment?.id || '').length})
                </h4>
                <div className='space-y-2 max-h-40 overflow-y-auto'>
                  {getEnrolledClasses(selectedStudentForEnrollment?.id || '').map(classItem => {
                    const enrollment = enrollments.find(
                      e => e.studentId === selectedStudentForEnrollment?.id && e.classId === classItem.id,
                    )
                    return (
                      <div key={classItem.id} className='flex items-center justify-between p-2 bg-slate-50 rounded-lg'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center'>
                            <BookOpen className='h-4 w-4 text-emerald-600' />
                          </div>
                          <div>
                            <p className='font-medium text-sm'>{classItem.name}</p>
                            <p className='text-xs text-muted-foreground'>
                              {classItem.semester} - {getTeacherName(classItem.teacherId)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => enrollment && handleUnenrollStudent(enrollment.id)}
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    )
                  })}
                  {getEnrolledClasses(selectedStudentForEnrollment?.id || '').length === 0 && (
                    <p className='text-sm text-muted-foreground text-center py-4'>Chưa đăng ký lớp học nào</p>
                  )}
                </div>
              </div>

              {}
              <div>
                <h4 className='text-sm font-medium text-slate-700 mb-2'>Thêm vào lớp học</h4>
                <div className='space-y-2'>
                  {classes
                    .filter(classItem => !isStudentEnrolled(selectedStudentForEnrollment?.id || '', classItem.id))
                    .map(classItem => (
                      <div key={classItem.id} className='flex items-center justify-between p-2 border rounded-lg'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                            <BookOpen className='h-4 w-4 text-blue-600' />
                          </div>
                          <div>
                            <p className='font-medium text-sm'>{classItem.name}</p>
                            <p className='text-xs text-muted-foreground'>
                              {classItem.semester} - {getTeacherName(classItem.teacherId)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEnrollStudent(selectedStudentForEnrollment?.id || '', classItem.id)}
                          className='text-green-600 hover:text-green-700 hover:bg-green-50'
                        >
                          <Plus className='h-4 w-4 mr-1' />
                          Thêm
                        </Button>
                      </div>
                    ))}
                  {classes.filter(classItem => !isStudentEnrolled(selectedStudentForEnrollment?.id || '', classItem.id))
                    .length === 0 && (
                    <p className='text-sm text-muted-foreground text-center py-4'>
                      Sinh viên đã đăng ký tất cả lớp học
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedStudentForEnrollment(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  )
}

export default Management
