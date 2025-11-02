import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Users, BookOpen, Eye } from 'lucide-react'
import type { Student, Exam, Submission } from '@/types'

interface ExamManagementSectionProps {
  classExams: Record<string, Exam>
  selectedExam: Exam | null
  examSubmissions: Submission[]
  examSubmissionsLoading: boolean
  enrolledStudents: Student[]
  onExamSelect: (exam: Exam) => void
  onBackToExamList: () => void
  formatExamDate: (timestamp?: Exam['date']) => string
  formatDate: (timestamp?: { seconds: number; nanoseconds: number } | null) => string
  getInitials: (name: string) => string
}

const ExamManagementSection: React.FC<ExamManagementSectionProps> = ({
  classExams,
  selectedExam,
  examSubmissions,
  examSubmissionsLoading,
  enrolledStudents,
  onExamSelect,
  onBackToExamList,
  formatExamDate,
  formatDate,
  getInitials,
}) => {
  return (
    <div>
      {!selectedExam ? (
        <div className='space-y-4 py-4'>
          <h3 className='text-lg font-semibold flex items-center gap-2'>
            <BookOpen className='w-5 h-5 text-blue-600' />
            Danh sách bài kiểm tra ({Object.keys(classExams).length})
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {Object.values(classExams).map(exam => (
              <Card
                key={exam.id}
                className='cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500'
                onClick={() => onExamSelect(exam)}
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <h4 className='font-semibold text-slate-800 mb-1'>{exam.name}</h4>
                      <p className='text-sm text-muted-foreground mb-2'>
                        Ngày cập nhật: {formatExamDate(exam.updatedAt ?? exam.date)}
                      </p>
                    </div>
                    <Eye className='w-5 h-5 text-blue-600' />
                  </div>
                </CardContent>
              </Card>
            ))}
            {Object.keys(classExams).length === 0 && (
              <div className='col-span-full text-center py-8 text-muted-foreground'>
                <BookOpen className='h-16 w-16 mx-auto mb-4 opacity-20' />
                <p className='text-lg font-medium'>Chưa có bài kiểm tra nào</p>
                <p className='text-sm'>Hãy tạo bài kiểm tra trước</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className='space-y-4 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <Users className='w-5 h-5 text-green-600' />
                Danh sách sinh viên ({enrolledStudents.length})
              </h3>
              <p className='text-sm text-muted-foreground'>
                Bài kiểm tra: {selectedExam.name} - {formatExamDate(selectedExam.updatedAt ?? selectedExam.date)}
                {examSubmissions.length > 0 && (
                  <span className='ml-2 text-green-600 font-medium'>• {examSubmissions.length} đã nộp bài</span>
                )}
              </p>
            </div>
            <Button variant='outline' size='sm' onClick={onBackToExamList} className='flex items-center gap-2'>
              <ArrowLeft className='w-4 h-4' />
              Quay lại danh sách bài kiểm tra
            </Button>
          </div>

          {examSubmissionsLoading ? (
            <div className='py-8 text-center text-muted-foreground'>Đang tải danh sách sinh viên...</div>
          ) : (
            <div className='rounded-lg border overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-slate-50'>
                    <TableHead className='font-semibold'>#</TableHead>
                    <TableHead className='font-semibold'>Sinh viên</TableHead>
                    <TableHead className='font-semibold'>MSSV</TableHead>
                    <TableHead className='font-semibold'>Trạng thái</TableHead>
                    <TableHead className='font-semibold'>Điểm</TableHead>
                    <TableHead className='font-semibold text-right'>Thời gian nộp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((student, index) => {
                    const submission = examSubmissions.find(s => s.studentId === student.id)
                    const hasSubmitted = !!submission
                    const scoreDisplay =
                      submission && typeof submission.score === 'number'
                        ? submission.score.toLocaleString('vi-VN')
                        : '--'
                    const maxScoreDisplay = selectedExam?.maxScore
                      ? `/${selectedExam.maxScore.toLocaleString('vi-VN')}`
                      : ''

                    return (
                      <TableRow
                        key={student.id}
                        className={`hover:bg-slate-50 ${hasSubmitted ? '' : 'bg-slate-50/50'}`}
                      >
                        <TableCell className='font-medium'>{index + 1}</TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-3'>
                            <Avatar className='h-8 w-8'>
                              <AvatarFallback
                                className={`text-xs ${hasSubmitted ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-slate-300 text-slate-600'}`}
                              >
                                {getInitials(student.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className='font-medium'>{student.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell className='font-medium'>{student.mssv}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${hasSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                          >
                            {hasSubmitted ? 'Đã nộp' : 'Chưa nộp'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${hasSubmitted ? 'text-blue-600' : 'text-slate-400'}`}>
                            {scoreDisplay}
                            {hasSubmitted ? maxScoreDisplay : ''}
                          </span>
                        </TableCell>
                        <TableCell className='text-right text-slate-600'>
                          {submission?.extractedAt ? formatDate(submission.extractedAt) : '--'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ExamManagementSection
