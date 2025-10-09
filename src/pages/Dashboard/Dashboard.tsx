import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GraduationCap, LogOut, Users, BookOpen, Calendar, TrendingUp } from 'lucide-react'
import ClassList from '../../components/ClassList/ClassList'
import StudentList from '../../components/StudentList/StudentList'

interface Student {
  id: string
  name: string
  studentId: string
  email: string
  phone: string
  major: string
  gpa: number
  status: 'active' | 'inactive'
}

interface Class {
  id: string
  name: string
  subject: string
  semester: string
  students: Student[]
}

// Mock data
const mockClasses: Class[] = [
  {
    id: '1',
    name: 'Lập trình Web1231233',
    subject: 'CNTT101',
    semester: '2024-1',
    students: [
      {
        id: '1',
        name: 'Nguyễn Văn A',
        studentId: 'SV001',
        email: 'nguyenvana@email.com',
        phone: '0123456789',
        major: 'Công nghệ thông tin',
        gpa: 3.5,
        status: 'active',
      },
      {
        id: '2',
        name: 'Trần Thị B',
        studentId: 'SV002',
        email: 'tranthib@email.com',
        phone: '0987654321',
        major: 'Công nghệ thông tin',
        gpa: 3.8,
        status: 'active',
      },
      {
        id: '3',
        name: 'Lê Văn C',
        studentId: 'SV003',
        email: 'levanc@email.com',
        phone: '0111111111',
        major: 'Công nghệ thông tin',
        gpa: 2.9,
        status: 'active',
      },
    ],
  },
  {
    id: '2',
    name: 'Cơ sở dữ liệu',
    subject: 'CNTT102',
    semester: '2024-1',
    students: [
      {
        id: '4',
        name: 'Phạm Thị D',
        studentId: 'SV004',
        email: 'phamthid@email.com',
        phone: '0222222222',
        major: 'Công nghệ thông tin',
        gpa: 3.2,
        status: 'active',
      },
      {
        id: '5',
        name: 'Hoàng Văn EHHU',
        studentId: 'SV005',
        email: 'hoangvane@email.com',
        phone: '0333333333',
        major: 'Công nghệ thông tin',
        gpa: 3.7,
        status: 'active',
      },
    ],
  },
  {
    id: '3',
    name: 'Thuật toán',
    subject: 'CNTT103',
    semester: '2024-1',
    students: [
      {
        id: '6',
        name: 'Đỗ Thị F',
        studentId: 'SV006',
        email: 'dothif@email.com',
        phone: '0444444444',
        major: 'Công nghệ thông tin',
        gpa: 3.9,
        status: 'active',
      },
    ],
  },
  {
    id: '4',
    name: 'Thuật toán',
    subject: 'CNTT103',
    semester: '2024-1',
    students: [
      {
        id: '6',
        name: 'Đỗ Thị F',
        studentId: 'SV006',
        email: 'dothif@email.com',
        phone: '0444444444',
        major: 'Công nghệ thông tin',
        gpa: 3.9,
        status: 'active',
      },
    ],
  },
  {
    id: '5',
    name: 'Thuật toán123',
    subject: 'CNTT103',
    semester: '2024-1',
    students: [
      {
        id: '6',
        name: 'Đỗ Thị F',
        studentId: 'SV006',
        email: 'dothif@email.com',
        phone: '0444444444',
        major: 'Công nghệ thông tin',
        gpa: 3.9,
        status: 'active',
      },
    ],
  },
  {
    id: '6',
    name: 'Thuật toánsjsj',
    subject: 'CNTT103',
    semester: '2024-1',
    students: [
      {
        id: '6',
        name: 'Đỗ Thị F123',
        studentId: 'SV006',
        email: 'dothif@email.com',
        phone: '0444444444',
        major: 'Công nghệ thông tin',
        gpa: 3.9,
        status: 'active',
      },
    ],
  },
]

interface DashboardProps {
  onLogout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [classes] = useState<Class[]>(mockClasses)

  const handleClassSelect = (classItem: Class) => {
    setSelectedClass(classItem)
  }

  const handleBackToClasses = () => {
    setSelectedClass(null)
  }

  // Tính toán thống kê
  const totalStudents = classes.reduce((total, cls) => total + cls.students.length, 0)
  const totalClasses = classes.length
  const averageGPA =
    classes.reduce((sum, cls) => {
      const classGPA = cls.students.reduce((total, student) => total + student.gpa, 0) / cls.students.length
      return sum + classGPA
    }, 0) / classes.length

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Header */}
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
              <div className='text-right'>
                <p className='text-sm font-medium text-slate-700'>Chào mừng, Giảng viên</p>
                <p className='text-xs text-muted-foreground'>Hôm nay là ngày tốt lành</p>
              </div>
              <Button
                onClick={onLogout}
                variant='outline'
                size='sm'
                className='text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
              >
                <LogOut className='w-4 h-4 mr-2' />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className='p-6'>
        {!selectedClass ? (
          <div className='space-y-6 animate-fade-in-up'>
            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Card className='p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover-lift animate-scale-in'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-blue-100 text-sm font-medium'>Tổng số lớp</p>
                    <p className='text-3xl font-bold'>{totalClasses}</p>
                  </div>
                  <BookOpen className='w-8 h-8 text-blue-200 animate-bounce-subtle' />
                </div>
              </Card>

              <Card
                className='p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover-lift animate-scale-in'
                style={{ animationDelay: '0.1s' }}
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-emerald-100 text-sm font-medium'>Tổng sinh viên</p>
                    <p className='text-3xl font-bold'>{totalStudents}</p>
                  </div>
                  <Users className='w-8 h-8 text-emerald-200 animate-bounce-subtle' />
                </div>
              </Card>

              <Card
                className='p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover-lift animate-scale-in'
                style={{ animationDelay: '0.2s' }}
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-purple-100 text-sm font-medium'>GPA trung bình</p>
                    <p className='text-3xl font-bold'>{averageGPA.toFixed(1)}</p>
                  </div>
                  <TrendingUp className='w-8 h-8 text-purple-200 animate-bounce-subtle' />
                </div>
              </Card>
            </div>

            <Separator />

            {/* Main Content */}
            <div className='animate-slide-in-right'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-2xl font-bold text-slate-800'>Danh sách lớp học</h2>
                  <p className='text-muted-foreground'>Chọn lớp để xem danh sách sinh viên</p>
                </div>
                <Badge variant='secondary' className='px-3 py-1'>
                  <Calendar className='w-4 h-4 mr-1' />
                  Học kỳ 2024-1
                </Badge>
              </div>

              <ClassList classes={classes} onClassSelect={handleClassSelect} />
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-2xl font-bold text-slate-800'>{selectedClass.name}</h2>
                <p className='text-muted-foreground'>
                  Mã môn: {selectedClass.subject} • Học kỳ: {selectedClass.semester}
                </p>
              </div>
              <Button onClick={handleBackToClasses} variant='outline'>
                ← Quay lại danh sách lớp
              </Button>
            </div>

            <StudentList classInfo={selectedClass} onBack={handleBackToClasses} />
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
