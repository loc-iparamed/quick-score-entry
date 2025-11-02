import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, UserPlus, UserMinus } from 'lucide-react'
import type { Student, Submission, Exam } from '@/types'

interface StudentManagementSectionProps {
  enrolledStudents: Student[]
  unenrolledStudents: Student[]
  selectedStudent: Student | null
  studentSubmissions: Submission[]
  submissionsLoading: boolean
  classExams: Record<string, Exam>
  loading: boolean
  onStudentSelect: (student: Student) => void
  onEnrollStudent: (studentId: string) => void
  onUnenrollStudent: (studentId: string) => void
  formatExamDate: (timestamp?: Exam['date']) => string
  getInitials: (name: string) => string
}

const StudentManagementSection: React.FC<StudentManagementSectionProps> = ({
  enrolledStudents,
  unenrolledStudents,
  selectedStudent,
  studentSubmissions,
  submissionsLoading,
  classExams,
  loading,
  onStudentSelect,
  onEnrollStudent,
  onUnenrollStudent,
  formatExamDate,
  getInitials,
}) => {
  return (
    <div className='space-y-6 py-4'>
      <div>
        <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
          <Users className='w-5 h-5 text-green-600' />
          Sinh viên đã đăng ký ({enrolledStudents.length})
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto'>
          {enrolledStudents.map(student => {
            const isSelected = selectedStudent?.id === student.id
            return (
              <div
                key={student.id}
                onClick={() => onStudentSelect(student)}
                className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200 shadow-sm'
                    : 'bg-green-50 border-green-200 hover:border-green-300 hover:shadow-sm'
                }`}
              >
                <div className='flex items-center gap-3'>
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback
                      className={`text-xs ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {getInitials(student.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium text-slate-800'>{student.fullName}</p>
                    <p className='text-sm text-muted-foreground'>{student.mssv}</p>
                  </div>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={event => {
                    event.stopPropagation()
                    onUnenrollStudent(student.id)
                  }}
                  disabled={loading}
                  className='border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                >
                  <UserMinus className='w-4 h-4 mr-1' />
                  Xóa
                </Button>
              </div>
            )
          })}
          {enrolledStudents.length === 0 && (
            <div className='col-span-full text-center py-8 text-muted-foreground'>
              Chưa có sinh viên nào đăng ký lớp này
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className='rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <h4 className='text-lg font-semibold text-slate-800'>Kết quả bài kiểm tra</h4>
              <p className='text-sm text-muted-foreground'>
                {selectedStudent.fullName} (MSSV {selectedStudent.mssv})
              </p>
            </div>
            <Button variant='ghost' size='sm' onClick={() => onStudentSelect(null!)}>
              Đóng
            </Button>
          </div>
          {submissionsLoading ? (
            <div className='py-6 text-center text-muted-foreground'>Đang tải kết quả...</div>
          ) : studentSubmissions.length > 0 ? (
            <div className='space-y-3'>
              {studentSubmissions.map(submission => {
                const exam = classExams[submission.examId]
                const scoreDisplay =
                  typeof submission.score === 'number' ? submission.score.toLocaleString('vi-VN') : '--'
                const maxScoreDisplay =
                  typeof exam?.maxScore === 'number' ? exam.maxScore.toLocaleString('vi-VN') : null

                return (
                  <div
                    key={submission.id}
                    className='flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm'
                  >
                    <div>
                      <p className='font-semibold text-slate-800'>{exam?.name ?? 'Bài kiểm tra'}</p>
                      <p className='text-xs text-muted-foreground'>
                        Cập nhật gần nhất: {formatExamDate(exam?.updatedAt ?? exam?.date)}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-semibold text-blue-600'>
                        {scoreDisplay}
                        {maxScoreDisplay ? `/${maxScoreDisplay}` : ''}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {maxScoreDisplay ? `Thang điểm: ${maxScoreDisplay}` : `Mã bài: ${submission.examId}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className='py-6 text-center text-muted-foreground'>Sinh viên chưa có bài kiểm tra nào</div>
          )}
        </div>
      )}

      <div>
        <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
          <UserPlus className='w-5 h-5 text-blue-600' />
          Sinh viên có thể thêm ({unenrolledStudents.length})
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto'>
          {unenrolledStudents.map(student => (
            <div
              key={student.id}
              className='flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg'
            >
              <div className='flex items-center gap-3'>
                <Avatar className='h-8 w-8'>
                  <AvatarFallback className='bg-blue-100 text-blue-700 text-xs'>
                    {getInitials(student.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium text-blue-900'>{student.fullName}</p>
                  <p className='text-sm text-blue-600'>{student.mssv}</p>
                </div>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onEnrollStudent(student.id)}
                disabled={loading}
                className='border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
              >
                <UserPlus className='w-4 h-4 mr-1' />
                Thêm
              </Button>
            </div>
          ))}
          {unenrolledStudents.length === 0 && (
            <div className='col-span-full text-center py-8 text-muted-foreground'>
              Tất cả sinh viên đã được thêm vào lớp này
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentManagementSection
