import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Mail, Users, BookOpen, Calendar } from 'lucide-react'
import type { Student } from '@/types'
import type { DashboardClass } from '@/components/ClassList/ClassList'

interface StudentListProps {
  classInfo: DashboardClass
  students: Student[]
  onBack: () => void
}

const StudentList: React.FC<StudentListProps> = ({ classInfo, students, onBack }) => {
  const formatDate = (timestamp?: Student['createdAt']) => {
    if (!timestamp) return '--'
    try {
      return timestamp.toDate().toLocaleDateString('vi-VN')
    } catch (err) {
      console.error(err)
      return '--'
    }
  }

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

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
              <p className='text-blue-100 mt-1'>{classInfo.semester}</p>
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
                <p className='text-2xl font-bold text-slate-800'>{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg hover-lift animate-slide-in-right' style={{ animationDelay: '0.1s' }}>
          <CardContent className='p-6'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center'>
                <BookOpen className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Bài kiểm tra</p>
                <p className='text-2xl font-bold text-slate-800'>{classInfo.examCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg hover-lift animate-slide-in-right' style={{ animationDelay: '0.2s' }}>
          <CardContent className='p-6'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center'>
                <Calendar className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Học kỳ</p>
                <p className='text-2xl font-bold text-slate-800'>{classInfo.semester}</p>
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
                  <TableHead className='font-semibold'>#</TableHead>
                  <TableHead className='font-semibold'>MSSV</TableHead>
                  <TableHead className='font-semibold'>Họ tên</TableHead>
                  <TableHead className='font-semibold'>Email</TableHead>
                  <TableHead className='font-semibold text-right'>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow
                    key={student.id}
                    className='hover:bg-slate-50 transition-colors duration-200 animate-fade-in-up'
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <TableCell className='font-medium'>{index + 1}</TableCell>
                    <TableCell className='font-medium'>{student.mssv}</TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-3'>
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback className='bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs'>
                            {getInitials(student.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className='font-medium'>{student.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-2 text-sm'>
                        <Mail className='w-3 h-3 text-slate-400' />
                        <span className='text-slate-600'>{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-right text-slate-600'>{formatDate(student.createdAt)}</TableCell>
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
