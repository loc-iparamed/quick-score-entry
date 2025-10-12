import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, Calendar, ChevronRight, Award } from 'lucide-react'

export interface DashboardClass {
  id: string
  name: string
  semester: string
  studentCount: number
  examCount: number
  teacherName?: string
}

interface ClassListProps {
  classes: DashboardClass[]
  onClassSelect: (classItem: DashboardClass) => void
}

const ClassList: React.FC<ClassListProps> = ({ classes, onClassSelect }) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {classes.map(classItem => (
        <Card
          key={classItem.id}
          className='group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 hover-lift'
          onClick={() => onClassSelect(classItem)}
        >
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow'>
                <BookOpen className='w-6 h-6 text-white' />
              </div>
              <ChevronRight className='w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-200' />
            </div>
            <CardTitle className='text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors'>
              {classItem.name}
            </CardTitle>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-2 text-sm text-slate-600'>
              <Calendar className='w-4 h-4' />
              <span>{classItem.semester}</span>
            </div>

            {/* {classItem.teacherName && (
              <div className='flex items-center space-x-2 text-sm text-slate-600'>
                <BookOpen className='w-4 h-4' />
                <span>{classItem.teacherName}</span>
              </div>
            )} */}

            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Users className='w-4 h-4 text-slate-500' />
                <span className='text-sm text-slate-600'>{classItem.studentCount} sinh viên</span>
              </div>

              <Badge
                variant='secondary'
                className='bg-blue-100 text-blue-700 hover:bg-blue-200 group-hover:bg-blue-200 transition-colors'
              >
                Xem chi tiết
              </Badge>
            </div>

            <div className='flex items-center justify-between text-sm text-slate-600'>
              <div className='flex items-center space-x-2'>
                <Award className='w-4 h-4 text-slate-500' />
                <span>{classItem.examCount} bài kiểm tra</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default ClassList
