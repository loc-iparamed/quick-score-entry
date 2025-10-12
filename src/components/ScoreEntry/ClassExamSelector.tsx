import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import type { Class, Exam } from '@/types'

interface ClassExamSelectorProps {
  classes: Class[]
  selectedClassId: string
  exams: Exam[]
  selectedExamId: string
  examLoading: boolean
  onClassChange: (value: string) => void
  onExamChange: (value: string) => void
}

export const ClassExamSelector = ({
  classes,
  selectedClassId,
  exams,
  selectedExamId,
  examLoading,
  onClassChange,
  onExamChange,
}: ClassExamSelectorProps) => {
  return (
    <Card className='border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50'>
      <CardHeader>
        <CardTitle className='text-blue-900'>Chọn lớp và kỳ kiểm tra</CardTitle>
        <CardDescription className='text-blue-700'>
          Bắt đầu bằng cách chọn lớp, sau đó tiếp tục với bài kiểm tra
        </CardDescription>
      </CardHeader>
      <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <span className='text-sm font-medium text-blue-900'>Lớp học</span>
          <Select onValueChange={onClassChange} value={selectedClassId}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Chọn lớp học' />
            </SelectTrigger>
            <SelectContent className='bg-white border border-gray-200 shadow-lg min-w-[var(--radix-select-trigger-width)]'>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id} className='hover:bg-gray-50 cursor-pointer'>
                  {cls.name} ({cls.semester})
                </SelectItem>
              ))}
              <SelectItem
                value='create-new-class'
                className='text-blue-600 font-medium hover:bg-blue-50 cursor-pointer'
              >
                <div className='flex items-center gap-2'>
                  <Plus className='h-4 w-4' />
                  Thêm lớp học mới...
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <span className='text-sm font-medium text-blue-900'>Bài kiểm tra</span>
          <Select onValueChange={onExamChange} value={selectedExamId} disabled={!selectedClassId || examLoading}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={selectedClassId ? 'Chọn bài kiểm tra' : 'Vui lòng chọn lớp trước'} />
            </SelectTrigger>
            <SelectContent className='bg-white border border-gray-200 shadow-lg min-w-[var(--radix-select-trigger-width)]'>
              {exams.map(exam => (
                <SelectItem key={exam.id} value={exam.id} className='hover:bg-gray-50 cursor-pointer'>
                  {exam.name}
                </SelectItem>
              ))}
              <SelectItem value='create-new-exam' className='text-blue-600 font-medium hover:bg-blue-50 cursor-pointer'>
                <div className='flex items-center gap-2'>
                  <Plus className='h-4 w-4' />
                  Thêm bài kiểm tra mới...
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
