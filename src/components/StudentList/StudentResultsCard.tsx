import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Trophy, BookOpen, TrendingUp } from 'lucide-react'
import type { Student, Submission } from '@/types'

interface StudentResultsCardProps {
  student: Student
  submissions: Submission[]
  examNames: Record<string, string>
  getInitials: (name: string) => string
  formatDate?: (timestamp?: { seconds: number; nanoseconds: number } | null) => string
  className?: string
  showDetailedStats?: boolean
}

const StudentResultsCard: React.FC<StudentResultsCardProps> = ({
  student,
  submissions,
  examNames,
  getInitials,
  formatDate,
  className = '',
  showDetailedStats = true,
}) => {
  // Calculate statistics
  const totalSubmissions = submissions.length
  const scoresWithValues = submissions.filter(s => typeof s.score === 'number')
  const averageScore =
    scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, s) => sum + (s.score as number), 0) / scoresWithValues.length
      : 0

  // Calculate weighted final score (0.1, 0.2, 0.2, 0.5)
  const weightedScore = (() => {
    const scores = [0, 0, 0, 0] // Default scores for 4 exams
    submissions.forEach((submission, index) => {
      if (index < 4 && typeof submission.score === 'number') {
        scores[index] = submission.score
      }
    })
    return scores[0] * 0.1 + scores[1] * 0.2 + scores[2] * 0.2 + scores[3] * 0.5
  })()

  // Get performance level based on weighted score
  const getPerformanceLevel = (score: number) => {
    if (score >= 9) return { label: 'Xuất sắc', color: 'bg-green-500', textColor: 'text-green-700' }
    if (score >= 8) return { label: 'Giỏi', color: 'bg-blue-500', textColor: 'text-blue-700' }
    if (score >= 6.5) return { label: 'Khá', color: 'bg-yellow-500', textColor: 'text-yellow-700' }
    if (score >= 5) return { label: 'Trung bình', color: 'bg-orange-500', textColor: 'text-orange-700' }
    return { label: 'Yếu', color: 'bg-red-500', textColor: 'text-red-700' }
  }

  const performance = getPerformanceLevel(weightedScore)

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-3'>
          <Avatar className='h-10 w-10'>
            <AvatarFallback className='bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold'>
              {getInitials(student.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <h3 className='font-semibold text-slate-800'>{student.fullName}</h3>
            <p className='text-sm text-muted-foreground flex items-center gap-1'>
              <User className='w-3 h-3' />
              {student.mssv}
            </p>
          </div>
          <Badge variant='outline' className={`${performance.color} text-white border-0`}>
            {performance.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Score Summary */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg'>
            <Trophy className='w-5 h-5 text-blue-600 mx-auto mb-1' />
            <p className='text-sm text-muted-foreground'>Điểm tổng kết</p>
            <p className={`text-lg font-bold ${performance.textColor}`}>{weightedScore.toFixed(2)}</p>
          </div>
          <div className='text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg'>
            <TrendingUp className='w-5 h-5 text-green-600 mx-auto mb-1' />
            <p className='text-sm text-muted-foreground'>Điểm trung bình</p>
            <p className='text-lg font-bold text-green-700'>{averageScore.toFixed(2)}</p>
          </div>
        </div>

        {showDetailedStats && (
          <>
            {/* Submission Summary */}
            <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
              <div className='flex items-center gap-2'>
                <BookOpen className='w-4 h-4 text-slate-600' />
                <span className='text-sm font-medium text-slate-700'>Bài đã nộp</span>
              </div>
              <Badge variant='secondary'>{totalSubmissions} bài</Badge>
            </div>

            {/* Individual Exam Results */}
            {submissions.length > 0 && (
              <div className='space-y-2'>
                <h4 className='text-sm font-medium text-slate-700 mb-2 flex items-center gap-2'>
                  <Trophy className='w-4 h-4 text-amber-600' />
                  Chi tiết điểm số
                </h4>
                <div className='space-y-2 max-h-32 overflow-y-auto'>
                  {submissions.map((submission, index) => (
                    <div
                      key={submission.id}
                      className='flex items-center justify-between p-2 bg-white border rounded-lg hover:bg-slate-50 transition-colors'
                    >
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-slate-800'>
                          {examNames[submission.examId] || `Bài kiểm tra ${index + 1}`}
                        </p>
                        {formatDate && submission.extractedAt && (
                          <p className='text-xs text-muted-foreground'>{formatDate(submission.extractedAt)}</p>
                        )}
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-bold text-blue-600'>
                          {typeof submission.score === 'number' ? submission.score.toLocaleString('vi-VN') : '--'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* No submissions message */}
        {submissions.length === 0 && (
          <div className='text-center py-4 text-muted-foreground'>
            <BookOpen className='w-8 h-8 mx-auto mb-2 opacity-30' />
            <p className='text-sm'>Chưa có bài nộp nào</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StudentResultsCard
