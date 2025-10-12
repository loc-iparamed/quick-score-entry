import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GraduationCap, LogOut, Users, BookOpen, Calendar, Plus, Settings, ChevronDown, User } from 'lucide-react'
import ClassList, { type DashboardClass } from '../../components/ClassList/ClassList'
import { classService, studentService, userService, enrollmentService, examService } from '@/services/firestore'
import type { Student } from '@/types'

interface DashboardProps {
  onLogout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<DashboardClass[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)

        const [classesData, studentsData, teachersData, enrollmentsData, examsData] = await Promise.all([
          classService.getAll(),
          studentService.getAll(),
          userService.getAll(),
          enrollmentService.getAll(),
          examService.getAll(),
        ])

        const teacherMap = new Map<string, string>()
        teachersData.forEach(teacher => {
          teacherMap.set(teacher.id, teacher.fullName)
        })

        const mappedClasses: DashboardClass[] = classesData.map(cls => {
          const classEnrollments = enrollmentsData.filter(e => e.classId === cls.id)
          const studentCount = classEnrollments.length

          const classExams = examsData.filter(exam => exam.classId === cls.id)
          const examCount = classExams.length

          return {
            id: cls.id,
            name: cls.name,
            semester: cls.semester,
            studentCount,
            examCount,
            teacherName: teacherMap.get(cls.teacherId),
          }
        })

        setClasses(mappedClasses)
        setStudents(studentsData)
      } catch (err) {
        console.error(err)
        setError('Không thể tải dữ liệu dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()

    const handleStudentDataChange = () => {
      loadDashboard()
    }
    window.addEventListener('studentDataChanged', handleStudentDataChange)
    return () => {
      window.removeEventListener('studentDataChanged', handleStudentDataChange)
    }
  }, [])

  const totalStudents = students.length
  const totalClasses = classes.length
  const semesterCount = useMemo(() => new Set(classes.map(cls => cls.semester)).size, [classes])

  const handleClassSelect = (classItem: DashboardClass) => {
    navigate(`/class/${classItem.id}`)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gradient-to-r from-blue-600 to-purple-600'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <header className='bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10'>
        <div className='px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg'>
                <GraduationCap className='w-7 h-7 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                  Hệ thống quản lý sinh viên
                </h1>
                <p className='text-sm text-muted-foreground'>Quản lý lớp học và điểm số</p>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='relative'>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className='flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 border border-slate-200'
                >
                  <Avatar className='h-10 w-10'>
                    <AvatarFallback className='bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                      <User className='h-6 w-6' />
                    </AvatarFallback>
                  </Avatar>
                  <div className='hidden md:block text-left'>
                    <p className='text-sm font-medium text-slate-700'>Giảng viên</p>
                    <p className='text-xs text-muted-foreground'>Đang hoạt động</p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div className='fixed inset-0 z-10' onClick={() => setIsUserMenuOpen(false)} />
                    {/* Menu */}
                    <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1'>
                      <div className='px-4 py-3 border-b border-slate-100'>
                        <p className='text-sm font-medium text-slate-900'>Giảng viên</p>
                        <p className='text-xs text-slate-500'>Chào mừng quay trở lại</p>
                      </div>

                      <Link
                        to='/change-password'
                        onClick={() => setIsUserMenuOpen(false)}
                        className='flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200'
                      >
                        <Settings className='h-4 w-4 mr-3 text-slate-500' />
                        Đổi mật khẩu
                      </Link>

                      <div className='border-t border-slate-100 my-1' />

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          onLogout()
                        }}
                        className='flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200'
                      >
                        <LogOut className='h-4 w-4 mr-3' />
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className='p-6'>
        {error && (
          <div className='mb-6 max-w-4xl mx-auto'>
            <Alert className='border-red-200 bg-red-50'>
              <AlertDescription className='text-red-800'>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className='space-y-6'>
          {/* Quick Actions */}
          <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-6 shadow-xl'>
            <div className='flex items-center justify-between max-w-4xl mx-auto'>
              <Link to='/students' className='group flex-1 mr-4'>
                <Card className='bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer'>
                  <Card className='bg-transparent border-0 shadow-none'>
                    <div className='p-4 text-center'>
                      <div className='w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg'>
                        <Users className='w-6 h-6 text-white' />
                      </div>
                      <h3 className='text-lg font-bold text-white mb-1'>Quản lý sinh viên</h3>
                      <p className='text-sm text-blue-100'>Thêm, sửa, xóa thông tin</p>
                    </div>
                  </Card>
                </Card>
              </Link>

              <Link to='/score-entry' className='group flex-1 ml-4'>
                <Card className='bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer'>
                  <Card className='bg-transparent border-0 shadow-none'>
                    <div className='p-4 text-center'>
                      <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg'>
                        <Plus className='w-6 h-6 text-white' />
                      </div>
                      <h3 className='text-lg font-bold text-white mb-1'>Nhập điểm</h3>
                      <p className='text-sm text-blue-100'>Nhập và quản lý điểm số</p>
                    </div>
                  </Card>
                </Card>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
            <Card className='p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover-lift'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-blue-100 text-sm font-medium'>Tổng số lớp</p>
                  <p className='text-3xl font-bold'>{totalClasses}</p>
                </div>
                <BookOpen className='w-8 h-8 text-blue-200' />
              </div>
            </Card>

            <Card className='p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover-lift'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-emerald-100 text-sm font-medium'>Tổng sinh viên</p>
                  <p className='text-3xl font-bold'>{totalStudents}</p>
                </div>
                <Users className='w-8 h-8 text-emerald-200' />
              </div>
            </Card>
          </div>

          <Separator />

          {/* Main Content */}
          <div>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h2 className='text-2xl font-bold text-slate-800'>Danh sách lớp học</h2>
                <p className='text-muted-foreground'>Chọn lớp để xem danh sách sinh viên</p>
              </div>
              <Badge variant='secondary' className='px-3 py-1'>
                <Calendar className='w-4 h-4 mr-1' />
                {semesterCount > 0 ? `${semesterCount} học kỳ` : 'Chưa có học kỳ'}
              </Badge>
            </div>

            <ClassList classes={classes} onClassSelect={handleClassSelect} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
