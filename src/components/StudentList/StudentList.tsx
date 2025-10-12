import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Mail, Users, BookOpen, Calendar, UserPlus, UserMinus, FileText, Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { enrollmentService, examService, submissionService } from '@/services/firestore'
import type { Student, Enrollment, Exam, Submission } from '@/types'
import type { DashboardClass } from '@/components/ClassList/ClassList'

interface StudentListProps {
  classInfo: DashboardClass
  allStudents: Student[]
  enrollments: Enrollment[]
  onBack: () => void
  onEnrollmentChange?: () => void
}

const StudentList: React.FC<StudentListProps> = ({
  classInfo,
  allStudents,
  enrollments,
  onBack,
  onEnrollmentChange,
}) => {
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSubmissions, setStudentSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [classExams, setClassExams] = useState<Record<string, Exam>>({})
  const [showStudentResults, setShowStudentResults] = useState(false)
  const [completedExamsCount, setCompletedExamsCount] = useState(0)
  const [isExamManagementDialogOpen, setIsExamManagementDialogOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [examSubmissions, setExamSubmissions] = useState<Submission[]>([])
  const [examSubmissionsLoading, setExamSubmissionsLoading] = useState(false)

  // Helper function to check if a student is enrolled in this class
  const isStudentEnrolled = (studentId: string) => {
    return enrollments.some(e => e.studentId === studentId && e.classId === classInfo.id)
  }

  // Get enrolled students for this class
  const getEnrolledStudents = () => {
    return enrollments
      .filter(e => e.classId === classInfo.id)
      .map(e => allStudents.find(s => s.id === e.studentId))
      .filter(Boolean) as Student[]
  }

  // Get unenrolled students (available to enroll)
  const getUnenrolledStudents = () => {
    return allStudents.filter(student => !isStudentEnrolled(student.id))
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
  }

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    setShowStudentResults(true)
  }

  // Handle enrolling a student
  const handleEnrollStudent = async (studentId: string) => {
    try {
      setLoading(true)
      await enrollmentService.create({
        studentId,
        classId: classInfo.id,
      })
      // Refresh data
      onEnrollmentChange?.()
      setIsEnrollmentDialogOpen(false)
    } catch (error) {
      console.error('Error enrolling student:', error)
      alert('Có lỗi xảy ra khi đăng ký sinh viên vào lớp')
    } finally {
      setLoading(false)
    }
  }

  // Handle unenrolling a student
  const handleUnenrollStudent = async (studentId: string) => {
    try {
      setLoading(true)
      const enrollment = enrollments.find(e => e.studentId === studentId && e.classId === classInfo.id)
      if (enrollment) {
        await enrollmentService.delete(enrollment.id)
        if (selectedStudent?.id === studentId) {
          setSelectedStudent(null)
          setStudentSubmissions([])
        }
        // Refresh data
        onEnrollmentChange?.()
        setIsEnrollmentDialogOpen(false)
      }
    } catch (error) {
      console.error('Error unenrolling student:', error)
      alert('Có lỗi xảy ra khi hủy đăng ký sinh viên khỏi lớp')
    } finally {
      setLoading(false)
    }
  }

  // Handle exam selection for management
  const handleExamSelect = async (exam: Exam) => {
    setSelectedExam(exam)
    setExamSubmissionsLoading(true)

    try {
      // Get all submissions for this exam
      const submissions = await submissionService.getAll({ examId: exam.id })
      setExamSubmissions(submissions)
    } catch (error) {
      console.error('Error fetching exam submissions:', error)
      setExamSubmissions([])
    } finally {
      setExamSubmissionsLoading(false)
    }
  }

  // Handle back to exam list
  const handleBackToExamList = () => {
    setSelectedExam(null)
    setExamSubmissions([])
  }
  useEffect(() => {
    let isSubscribed = true

    const fetchClassExams = async () => {
      try {
        const exams = await examService.getAll({ classId: classInfo.id })
        if (!isSubscribed) return
        const examMap = exams.reduce<Record<string, Exam>>((acc, exam) => {
          acc[exam.id] = exam
          return acc
        }, {})
        setClassExams(examMap)
      } catch (error) {
        console.error('Error fetching exams for class:', error)
      }
    }

    fetchClassExams()

    return () => {
      isSubscribed = false
    }
  }, [classInfo.id])

  useEffect(() => {
    let isSubscribed = true

    const fetchCompletedExamsCount = async () => {
      try {
        const allSubmissions = await submissionService.getAll({ classId: classInfo.id })
        if (!isSubscribed) return

        setCompletedExamsCount(allSubmissions.length)
      } catch (error) {
        console.error('Error fetching completed exams count:', error)
        setCompletedExamsCount(0)
      }
    }

    fetchCompletedExamsCount()

    return () => {
      isSubscribed = false
    }
  }, [classInfo.id])

  useEffect(() => {
    if (!selectedStudent) {
      setStudentSubmissions([])
      setSubmissionsLoading(false)
      return
    }

    let isSubscribed = true
    setSubmissionsLoading(true)

    const fetchStudentSubmissions = async () => {
      try {
        console.log('Fetching submissions for student:', selectedStudent.id, 'in class:', classInfo.id)

        // Get all submissions for this student first (single where clause to avoid composite index requirement)
        const allStudentSubmissions = await submissionService.getAll({
          studentId: selectedStudent.id,
        })
        console.log('All submissions for student:', allStudentSubmissions.length, allStudentSubmissions)

        // Filter by classId directly (more reliable than filtering by examId)
        const classSubmissions = allStudentSubmissions.filter(submission => submission.classId === classInfo.id)
        console.log('Filtered submissions for class:', classSubmissions.length, classSubmissions)

        if (isSubscribed) {
          setStudentSubmissions(classSubmissions)
        }
      } catch (error) {
        console.error('Error fetching submissions for student:', error)
      } finally {
        if (isSubscribed) {
          setSubmissionsLoading(false)
        }
      }
    }

    fetchStudentSubmissions()

    return () => {
      isSubscribed = false
    }
  }, [classInfo.id, selectedStudent])

  useEffect(() => {
    if (!isEnrollmentDialogOpen) {
      setSelectedStudent(null)
      setStudentSubmissions([])
      setSubmissionsLoading(false)
      return
    }

    // Class exams are already loaded when component mounts
    // No need to fetch again
  }, [isEnrollmentDialogOpen])

  const formatDate = (timestamp?: Student['createdAt']) => {
    if (!timestamp) return '--'
    try {
      return timestamp.toDate().toLocaleDateString('vi-VN')
    } catch (err) {
      console.error(err)
      return '--'
    }
  }

  const formatExamDate = (timestamp?: Exam['date']) => {
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
            <div className='flex gap-2'>
              <Dialog open={isExamManagementDialogOpen} onOpenChange={setIsExamManagementDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='bg-white/20 border-white/30 text-white hover:bg-white/30 hover-lift'
                  >
                    <FileText className='w-4 h-4 mr-2' />
                    Quản lý bài kiểm tra
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-white'>
                  <DialogHeader>
                    <DialogTitle className='text-xl font-bold'>Quản lý bài kiểm tra - {classInfo.name}</DialogTitle>
                    <DialogDescription>
                      {selectedExam
                        ? `Danh sách sinh viên đã nộp bài cho: ${selectedExam.name}`
                        : 'Chọn bài kiểm tra để xem danh sách sinh viên đã nộp'}
                    </DialogDescription>
                  </DialogHeader>

                  {!selectedExam ? (
                    // Exam List View
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
                            onClick={() => handleExamSelect(exam)}
                          >
                            <CardContent className='p-4'>
                              <div className='flex items-center justify-between'>
                                <div className='flex-1'>
                                  <h4 className='font-semibold text-slate-800 mb-1'>{exam.name}</h4>
                                  <p className='text-sm text-muted-foreground mb-2'>
                                    Ngày thi: {formatExamDate(exam.date)}
                                  </p>
                                  <p className='text-xs text-slate-600'>Thang điểm: {exam.maxScore}</p>
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
                    // Student Submissions View
                    <div className='space-y-4 py-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='text-lg font-semibold flex items-center gap-2'>
                            <Users className='w-5 h-5 text-green-600' />
                            Danh sách sinh viên ({getEnrolledStudents().length})
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            Bài kiểm tra: {selectedExam.name} - {formatExamDate(selectedExam.date)}
                            {examSubmissions.length > 0 && (
                              <span className='ml-2 text-green-600 font-medium'>
                                • {examSubmissions.length} đã nộp bài
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleBackToExamList}
                          className='flex items-center gap-2'
                        >
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
                              {getEnrolledStudents().map((student, index) => {
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
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          hasSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                      >
                                        {hasSubmitted ? 'Đã nộp' : 'Chưa nộp'}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className={`font-semibold ${hasSubmitted ? 'text-blue-600' : 'text-slate-400'}`}
                                      >
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

                  <DialogFooter>
                    <Button variant='outline' onClick={() => setIsExamManagementDialogOpen(false)}>
                      Đóng
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isEnrollmentDialogOpen} onOpenChange={setIsEnrollmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='bg-white/20 border-white/30 text-white hover:bg-white/30 hover-lift'
                  >
                    <UserPlus className='w-4 h-4 mr-2' />
                    Quản lý sinh viên
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white'>
                  <DialogHeader>
                    <DialogTitle className='text-xl font-bold'>Quản lý sinh viên lớp {classInfo.name}</DialogTitle>
                  </DialogHeader>

                  <div className='space-y-6 py-4'>
                    {/* Enrolled Students Section */}
                    <div>
                      <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                        <Users className='w-5 h-5 text-green-600' />
                        Sinh viên đã đăng ký ({getEnrolledStudents().length})
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto'>
                        {getEnrolledStudents().map(student => {
                          const isSelected = selectedStudent?.id === student.id
                          return (
                            <div
                              key={student.id}
                              onClick={() => handleStudentSelect(student)}
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
                                  handleUnenrollStudent(student.id)
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
                        {getEnrolledStudents().length === 0 && (
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
                          <Button variant='ghost' size='sm' onClick={() => setSelectedStudent(null)}>
                            Đóng
                          </Button>
                        </div>
                        {submissionsLoading ? (
                          <div className='py-6 text-center text-muted-foreground'>Đang tải kết quả...</div>
                        ) : studentSubmissions.length > 0 ? (
                          <div className='space-y-3'>
                            {studentSubmissions.map(submission => {
                              const exam = classExams[submission.examId]
                              const examDate = formatExamDate(exam?.date)
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
                                    <p className='text-xs text-muted-foreground'>Ngày nhập điểm: {examDate}</p>
                                  </div>
                                  <div className='text-right'>
                                    <p className='text-sm font-semibold text-blue-600'>
                                      {scoreDisplay}
                                      {maxScoreDisplay ? `/${maxScoreDisplay}` : ''}
                                    </p>
                                    <p className='text-xs text-muted-foreground'>
                                      {maxScoreDisplay
                                        ? `Thang điểm: ${maxScoreDisplay}`
                                        : `Mã bài: ${submission.examId}`}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className='py-6 text-center text-muted-foreground'>
                            Sinh viên chưa có bài kiểm tra nào
                          </div>
                        )}
                      </div>
                    )}

                    {/* Unenrolled Students Section */}
                    <div>
                      <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                        <UserPlus className='w-5 h-5 text-blue-600' />
                        Sinh viên có thể thêm ({getUnenrolledStudents().length})
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto'>
                        {getUnenrolledStudents().map(student => (
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
                              onClick={() => handleEnrollStudent(student.id)}
                              disabled={loading}
                              className='border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
                            >
                              <UserPlus className='w-4 h-4 mr-1' />
                              Thêm
                            </Button>
                          </div>
                        ))}
                        {getUnenrolledStudents().length === 0 && (
                          <div className='col-span-full text-center py-8 text-muted-foreground'>
                            Tất cả sinh viên đã được thêm vào lớp này
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant='outline' onClick={() => setIsEnrollmentDialogOpen(false)} disabled={loading}>
                      Đóng
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
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
                <p className='text-2xl font-bold text-slate-800'>{getEnrolledStudents().length}</p>
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
                <p className='text-sm text-muted-foreground'>Tổng số bài kiểm tra đã nhập</p>
                <p className='text-2xl font-bold text-slate-800'>{completedExamsCount}</p>
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
                {getEnrolledStudents().map((student, index) => (
                  <TableRow
                    key={student.id}
                    onClick={() => handleStudentClick(student)}
                    className='hover:bg-slate-50 transition-colors duration-200 animate-fade-in-up cursor-pointer'
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

      {/* Student Results Section */}
      {showStudentResults && selectedStudent && (
        <Card className='border-0 shadow-lg animate-fade-in-up' style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-xl font-bold text-slate-800'>Kết quả bài kiểm tra</CardTitle>
                <p className='text-muted-foreground mt-1'>
                  {selectedStudent.fullName} (MSSV {selectedStudent.mssv})
                </p>
              </div>
              <Button variant='outline' size='sm' onClick={() => setShowStudentResults(false)}>
                Đóng
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <div className='py-8 text-center text-muted-foreground'>Đang tải kết quả...</div>
            ) : studentSubmissions.length > 0 ? (
              <div className='space-y-4'>
                {studentSubmissions.map(submission => {
                  const exam = classExams[submission.examId]
                  const examDate = formatExamDate(exam?.date)
                  const scoreDisplay =
                    typeof submission.score === 'number' ? submission.score.toLocaleString('vi-VN') : '--'
                  const maxScoreDisplay =
                    typeof exam?.maxScore === 'number' ? exam.maxScore.toLocaleString('vi-VN') : null

                  return (
                    <div
                      key={submission.id}
                      className='flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow'
                    >
                      <div className='flex-1'>
                        <h4 className='font-semibold text-slate-800 mb-1'>{exam?.name ?? 'Bài kiểm tra'}</h4>
                        <p className='text-sm text-muted-foreground'>Ngày thi: {examDate}</p>
                      </div>
                      <div className='text-right ml-4'>
                        <div className='text-2xl font-bold text-blue-600 mb-1'>
                          {scoreDisplay}
                          {maxScoreDisplay && <span className='text-lg'>/{maxScoreDisplay}</span>}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {maxScoreDisplay ? `Thang điểm: ${maxScoreDisplay}` : `Mã bài: ${submission.examId}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className='py-8 text-center text-muted-foreground'>Sinh viên chưa có bài kiểm tra nào</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StudentList
