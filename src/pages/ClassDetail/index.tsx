import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GraduationCap, LogOut, ArrowLeft, Settings, ChevronDown, User } from 'lucide-react'
import StudentList from '../../components/StudentList/StudentList'
import { classService, studentService, userService, enrollmentService, examService } from '@/services/firestore'
import type { Student, Enrollment } from '@/types'
import type { DashboardClass } from '@/components/ClassList/ClassList'

interface ClassDetailProps {
  onLogout: () => void
}

const ClassDetail: React.FC<ClassDetailProps> = ({ onLogout }) => {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [classInfo, setClassInfo] = useState<DashboardClass | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    if (!classId) {
      navigate('/')
      return
    }

    const loadClassDetail = async () => {
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

        const currentClass = classesData.find(cls => cls.id === classId)
        if (!currentClass) {
          setError('Không tìm thấy lớp học')
          return
        }

        const teacherMap = new Map<string, string>()
        teachersData.forEach(teacher => {
          teacherMap.set(teacher.id, teacher.fullName)
        })

        // Tính toán studentCount từ enrollments
        const classEnrollments = enrollmentsData.filter(e => e.classId === currentClass.id)
        const studentCount = classEnrollments.length

        // Tính toán examCount từ exams
        const classExams = examsData.filter(exam => exam.classId === currentClass.id)
        const examCount = classExams.length

        const dashboardClass: DashboardClass = {
          id: currentClass.id,
          name: currentClass.name,
          semester: currentClass.semester,
          studentCount,
          examCount,
          teacherName: teacherMap.get(currentClass.teacherId),
        }

        setClassInfo(dashboardClass)
        setStudents(studentsData)
        setEnrollments(enrollmentsData)
      } catch (err) {
        console.error(err)
        setError('Không thể tải dữ liệu lớp học')
      } finally {
        setLoading(false)
      }
    }

    loadClassDetail()
  }, [classId, navigate])

  const refreshClassData = async () => {
    if (!classId) return

    try {
      const [classesData, studentsData, teachersData, enrollmentsData, examsData] = await Promise.all([
        classService.getAll(),
        studentService.getAll(),
        userService.getAll(),
        enrollmentService.getAll(),
        examService.getAll(),
      ])

      const currentClass = classesData.find(cls => cls.id === classId)
      if (!currentClass) return

      const teacherMap = new Map<string, string>()
      teachersData.forEach(teacher => {
        teacherMap.set(teacher.id, teacher.fullName)
      })

      // Tính toán studentCount từ enrollments
      const classEnrollments = enrollmentsData.filter(e => e.classId === currentClass.id)
      const studentCount = classEnrollments.length

      // Tính toán examCount từ exams
      const classExams = examsData.filter(exam => exam.classId === currentClass.id)
      const examCount = classExams.length

      const dashboardClass: DashboardClass = {
        id: currentClass.id,
        name: currentClass.name,
        semester: currentClass.semester,
        studentCount,
        examCount,
        teacherName: teacherMap.get(currentClass.teacherId),
      }

      setClassInfo(dashboardClass)
      setStudents(studentsData)
      setEnrollments(enrollmentsData)
    } catch (err) {
      console.error('Error refreshing class data:', err)
    }
  }

  const handleBackToDashboard = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gradient-to-r from-blue-600 to-purple-600'></div>
      </div>
    )
  }

  if (error || !classInfo) {
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

                  {isUserMenuOpen && (
                    <>
                      <div className='fixed inset-0 z-10' onClick={() => setIsUserMenuOpen(false)} />
                      <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1'>
                        <div className='px-4 py-3 border-b border-slate-100'>
                          <p className='text-sm font-medium text-slate-900'>Giảng viên</p>
                          <p className='text-xs text-slate-500'>Chào mừng quay trở lại</p>
                        </div>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            navigate('/change-password')
                          }}
                          className='flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200'
                        >
                          <Settings className='h-4 w-4 mr-3 text-slate-500' />
                          Đổi mật khẩu
                        </button>

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
          <div className='max-w-4xl mx-auto'>
            <Alert className='border-red-200 bg-red-50'>
              <AlertDescription className='text-red-800'>{error || 'Không tìm thấy lớp học'}</AlertDescription>
            </Alert>
            <div className='mt-4'>
              <button
                onClick={handleBackToDashboard}
                className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
              >
                <ArrowLeft className='w-4 h-4' />
                <span>Quay lại Dashboard</span>
              </button>
            </div>
          </div>
        </main>
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

                {isUserMenuOpen && (
                  <>
                    <div className='fixed inset-0 z-10' onClick={() => setIsUserMenuOpen(false)} />
                    <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1'>
                      <div className='px-4 py-3 border-b border-slate-100'>
                        <p className='text-sm font-medium text-slate-900'>Giảng viên</p>
                        <p className='text-xs text-slate-500'>Chào mừng quay trở lại</p>
                      </div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          navigate('/change-password')
                        }}
                        className='flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200'
                      >
                        <Settings className='h-4 w-4 mr-3 text-slate-500' />
                        Đổi mật khẩu
                      </button>

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
        <StudentList
          classInfo={classInfo}
          allStudents={students}
          enrollments={enrollments}
          onBack={handleBackToDashboard}
          onEnrollmentChange={refreshClassData}
        />
      </main>
    </div>
  )
}

export default ClassDetail
