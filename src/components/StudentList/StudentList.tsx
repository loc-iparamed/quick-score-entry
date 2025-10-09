import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Mail, Phone, GraduationCap, Users, TrendingUp, Edit, Eye, Star } from 'lucide-react'

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

interface StudentListProps {
  classInfo: Class
  onBack: () => void
}

const StudentList: React.FC<StudentListProps> = ({ classInfo, onBack }) => {
  const getGpaBadgeVariant = (gpa: number) => {
    if (gpa >= 3.5) return 'default' // green
    if (gpa >= 3.0) return 'secondary' // yellow
    return 'destructive' // red
  }

  return (
    <div className='space-y-6 animate-fade-in-up'>
      {/* Header */}
      <Card className='border-0 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white animate-scale-in'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <Button
              onClick={onBack}
              variant='outline'
              size='sm'
              className='bg-white/20 border-white/30 text-white hover:bg-white/30 hover-lift'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại
            </Button>
            <div className='text-center'>
              <CardTitle className='text-2xl font-bold text-white'>{classInfo.name}</CardTitle>
              <p className='text-blue-100 mt-1'>
                {classInfo.subject} • {classInfo.semester}
              </p>
            </div>
            <div className='w-20' /> {/* Spacer */}
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='border-0 shadow-lg hover-lift animate-slide-in-right'>
          <CardContent className='p-6'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center'>
                <Users className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Tổng sinh viên</p>
                <p className='text-2xl font-bold text-slate-800'>{classInfo.students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg hover-lift animate-slide-in-right' style={{ animationDelay: '0.1s' }}>
          <CardContent className='p-6'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center'>
                <GraduationCap className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Đang học</p>
                <p className='text-2xl font-bold text-slate-800'>
                  {classInfo.students.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg hover-lift animate-slide-in-right' style={{ animationDelay: '0.2s' }}>
          <CardContent className='p-6'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>GPA trung bình</p>
                <p className='text-2xl font-bold text-slate-800'>
                  {(classInfo.students.reduce((sum, s) => sum + s.gpa, 0) / classInfo.students.length).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className='border-0 shadow-lg animate-fade-in-up' style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle className='text-xl font-bold text-slate-800'>Danh sách sinh viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='bg-slate-50'>
                  <TableHead className='font-semibold'>Mã SV</TableHead>
                  <TableHead className='font-semibold'>Họ tên</TableHead>
                  <TableHead className='font-semibold'>Liên hệ</TableHead>
                  <TableHead className='font-semibold'>Ngành học</TableHead>
                  <TableHead className='font-semibold'>GPA</TableHead>
                  <TableHead className='font-semibold'>Trạng thái</TableHead>
                  <TableHead className='font-semibold'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classInfo.students.map((student, index) => (
                  <TableRow
                    key={student.id}
                    className='hover:bg-slate-50 transition-colors duration-200 animate-fade-in-up'
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <TableCell className='font-medium'>{student.studentId}</TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-3'>
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback className='bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs'>
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className='font-medium'>{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <div className='flex items-center space-x-2 text-sm'>
                          <Mail className='w-3 h-3 text-slate-400' />
                          <span className='text-slate-600'>{student.email}</span>
                        </div>
                        <div className='flex items-center space-x-2 text-sm'>
                          <Phone className='w-3 h-3 text-slate-400' />
                          <span className='text-slate-600'>{student.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-slate-600'>{student.major}</TableCell>
                    <TableCell>
                      <div className='space-y-2'>
                        <Badge variant={getGpaBadgeVariant(student.gpa)} className='font-semibold text-xs'>
                          {student.gpa.toFixed(1)} <Star className='w-3 h-3 ml-1 inline' />
                        </Badge>
                        <Progress value={(student.gpa / 4.0) * 100} className='h-1 w-16' />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={student.status === 'active' ? 'default' : 'secondary'}
                        className={student.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}
                      >
                        {student.status === 'active' ? 'Đang học' : 'Nghỉ học'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex space-x-2'>
                        <Button size='sm' variant='outline' className='h-8 w-8 p-0 hover-lift'>
                          <Edit className='w-3 h-3' />
                        </Button>
                        <Button size='sm' variant='outline' className='h-8 w-8 p-0 hover-lift'>
                          <Eye className='w-3 h-3' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentList
