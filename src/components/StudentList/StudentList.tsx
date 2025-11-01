import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Mail,
  Users,
  BookOpen,
  Calendar,
  UserPlus,
  UserMinus,
  FileText,
  Eye,
  Settings,
  Download,
} from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { classService, enrollmentService, examService, submissionService } from '@/services/firestore'
import type { Student, Enrollment, Exam, Submission } from '@/types'
import type { DashboardClass } from '@/components/ClassList/ClassList'
import { toast } from 'sonner'

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
  // Unified manage class dialog state
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSubmissions, setStudentSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [classExams, setClassExams] = useState<Record<string, Exam>>({})
  const [showStudentResults, setShowStudentResults] = useState(false)
  const [completedExamsCount, setCompletedExamsCount] = useState(0)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [examSubmissions, setExamSubmissions] = useState<Submission[]>([])
  const [examSubmissionsLoading, setExamSubmissionsLoading] = useState(false)
  const [classNameEdit, setClassNameEdit] = useState<string>(classInfo.name)
  const [isRenamingClass, setIsRenamingClass] = useState(false)
  const [isDeletingClass, setIsDeletingClass] = useState(false)
  const [activeSection, setActiveSection] = useState<'students' | 'exams' | 'settings'>('students')
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportMethod, setExportMethod] = useState<'average' | 'max'>('average')

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
    } catch (error) {
      console.error('Error enrolling student:', error)
      toast.error('Có lỗi xảy ra khi đăng ký sinh viên vào lớp')
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
      }
    } catch (error) {
      console.error('Error unenrolling student:', error)
      toast.error('Có lỗi xảy ra khi hủy đăng ký sinh viên khỏi lớp')
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

  // Execute export with selected aggregation method
  const performExport = async (useAverage: boolean) => {
    try {
      const DEFAULT_EXAM_NAMES = [
        'Bài kiểm tra đợt 1',
        'Bài kiểm tra đợt 2',
        'Bài kiểm tra giữa kỳ',
        'Bài kiểm tra cuối kỳ',
      ] as const

      // Get all submissions for this class
      const classSubmissions = await submissionService.getAll({ classId: classInfo.id })

      // Current enrolled students
      const students = getEnrolledStudents()
      if (students.length === 0) {
        toast.info('Lớp chưa có sinh viên để xuất bảng điểm')
        return
      }

      // Map exam name -> list of exam ids (handle duplicates with same name)
      const nameToExamIds = new Map<string, string[]>()
      for (const e of Object.values(classExams)) {
        const list = nameToExamIds.get(e.name) ?? []
        list.push(e.id)
        nameToExamIds.set(e.name, list)
      }

      const getScore = (studentId: string, examName: (typeof DEFAULT_EXAM_NAMES)[number]) => {
        const examIds = nameToExamIds.get(examName)
        if (!examIds || examIds.length === 0) return ''

        // Collect all submissions for this student across all examIds with the same name
        const subs = classSubmissions.filter(s => s.studentId === studentId && examIds.includes(s.examId))
        const scores = subs
          .map(s => (typeof s.score === 'number' && !isNaN(s.score) ? s.score : null))
          .filter((n): n is number => n !== null)

        if (scores.length === 0) return ''

        const val = useAverage ? scores.reduce((a, b) => a + b, 0) / scores.length : Math.max(...scores)

        return String(Number(val.toFixed(2)))
      }

      const headers = [
        'Họ tên',
        'MSSV',
        'Bài kiểm tra đợt 1',
        'Bài kiểm tra đợt 2',
        'Bài kiểm tra giữa kỳ',
        'Bài kiểm tra cuối kỳ',
        'Điểm tổng kết',
      ]

      const rows: string[] = []
      rows.push('\ufeff' + headers.join(','))

      for (const stu of students) {
        const s1 = getScore(stu.id, DEFAULT_EXAM_NAMES[0])
        const s2 = getScore(stu.id, DEFAULT_EXAM_NAMES[1])
        const s3 = getScore(stu.id, DEFAULT_EXAM_NAMES[2])
        const s4 = getScore(stu.id, DEFAULT_EXAM_NAMES[3])

        // Weighted final score: 0.1, 0.2, 0.2, 0.5 (missing -> 0)
        const n1 = s1 === '' ? 0 : Number(s1)
        const n2 = s2 === '' ? 0 : Number(s2)
        const n3 = s3 === '' ? 0 : Number(s3)
        const n4 = s4 === '' ? 0 : Number(s4)
        const finalWeighted = (n1 * 0.1 + n2 * 0.2 + n3 * 0.2 + n4 * 0.5).toFixed(2)

        const csvSafe = (value: string) => '"' + (value ?? '').replace(/"/g, '""') + '"'

        rows.push(
          [
            csvSafe(stu.fullName),
            csvSafe(stu.mssv),
            csvSafe(s1),
            csvSafe(s2),
            csvSafe(s3),
            csvSafe(s4),
            csvSafe(finalWeighted),
          ].join(','),
        )
      }

      const csvContent = rows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bang_diem_${classInfo.name}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Đã xuất bảng điểm')
      setIsExportDialogOpen(false)
    } catch (err) {
      console.error('Export grade sheet error:', err)
      toast.error('Không thể xuất bảng điểm. Vui lòng thử lại')
    }
  }

  // Open the export dialog
  const handleExportGradeSheet = () => {
    setIsExportDialogOpen(true)
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
    if (!isManageDialogOpen) {
      setSelectedStudent(null)
      setStudentSubmissions([])
      setSubmissionsLoading(false)
    }
    // Class exams are already loaded when component mounts
    // No need to fetch again
  }, [isManageDialogOpen])

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
              <Dialog
                open={isManageDialogOpen}
                onOpenChange={open => {
                  setIsManageDialogOpen(open)
                  if (open) {
                    setClassNameEdit(classInfo.name)
                    setSelectedStudent(null)
                    setStudentSubmissions([])
                    setSelectedExam(null)
                    setExamSubmissions([])
                    setExamSubmissionsLoading(false)
                    setActiveSection('students')
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='bg-white/20 border-white/30 text-white hover:bg-white/30 hover-lift'
                  >
                    <Settings className='w-4 h-4 mr-2' />
                    Quản lý lớp học
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-white'>
                  <DialogHeader>
                    <DialogTitle className='text-xl font-bold'>Quản lý lớp học - {classInfo.name}</DialogTitle>
                  </DialogHeader>

                  {/* Section switcher */}
                  <div className='flex flex-wrap gap-2 mb-4'>
                    <Button
                      variant={activeSection === 'students' ? 'secondary' : 'outline'}
                      size='sm'
                      onClick={() => setActiveSection('students')}
                    >
                      <Users className='w-4 h-4 mr-2' /> Quản lý sinh viên
                    </Button>
                    <Button
                      variant={activeSection === 'exams' ? 'secondary' : 'outline'}
                      size='sm'
                      onClick={() => setActiveSection('exams')}
                    >
                      <FileText className='w-4 h-4 mr-2' /> Quản lý bài kiểm tra
                    </Button>
                    <Button
                      variant={activeSection === 'settings' ? 'secondary' : 'outline'}
                      size='sm'
                      onClick={() => setActiveSection('settings')}
                    >
                      <Settings className='w-4 h-4 mr-2' /> Cài đặt
                    </Button>
                  </div>

                  {/* Exams section */}
                  {activeSection === 'exams' && (
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
                                onClick={() => handleExamSelect(exam)}
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
                                Danh sách sinh viên ({getEnrolledStudents().length})
                              </h3>
                              <p className='text-sm text-muted-foreground'>
                                Bài kiểm tra: {selectedExam.name} -{' '}
                                {formatExamDate(selectedExam.updatedAt ?? selectedExam.date)}
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
                            <div className='py-8 text-center text-muted-foreground'>
                              Đang tải danh sách sinh viên...
                            </div>
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
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${hasSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
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
                    </div>
                  )}

                  {/* Settings section */}
                  {activeSection === 'settings' && (
                    <div className='space-y-4 py-4'>
                      <div className='space-y-2 max-w-xl'>
                        <label className='block text-sm font-medium text-slate-700'>Tên lớp học</label>
                        <Input
                          value={classNameEdit}
                          onChange={e => setClassNameEdit(e.target.value)}
                          placeholder='Nhập tên lớp mới'
                        />
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Button
                          variant='secondary'
                          disabled={isRenamingClass || !classNameEdit.trim() || classNameEdit === classInfo.name}
                          onClick={async () => {
                            try {
                              setIsRenamingClass(true)
                              await classService.update(classInfo.id, { name: classNameEdit.trim() })
                              onEnrollmentChange?.()
                              toast.success('Đã cập nhật tên lớp thành công')
                            } catch (err) {
                              console.error('Rename class error:', err)
                              toast.error('Không thể cập nhật tên lớp')
                            } finally {
                              setIsRenamingClass(false)
                            }
                          }}
                        >
                          {isRenamingClass ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                        <Button
                          variant='destructive'
                          disabled={isDeletingClass}
                          className='bg-red-600 hover:bg-red-700 text-white border-red-600'
                          onClick={async () => {
                            const confirmed = confirm(
                              'Bạn có chắc chắn muốn xóa lớp này? Hành động sẽ xóa TẤT CẢ các bản ghi điểm (submissions) thuộc lớp, nhưng KHÔNG xóa sinh viên. Thao tác không thể hoàn tác!',
                            )
                            if (!confirmed) return
                            try {
                              setIsDeletingClass(true)
                              // Delete all submissions by classId
                              const subs = await submissionService.getAll({ classId: classInfo.id })
                              await Promise.all(subs.map(s => submissionService.delete(s.id)))
                              // Delete the class document
                              await classService.delete(classInfo.id)
                              onEnrollmentChange?.()
                              window.dispatchEvent(new CustomEvent('classDataChanged'))
                              toast.success('Đã xóa lớp và các bản ghi điểm liên quan')
                              setIsManageDialogOpen(false)
                              onBack()
                            } catch (err) {
                              console.error('Delete class error:', err)
                              toast.error('Không thể xóa lớp. Vui lòng thử lại')
                            } finally {
                              setIsDeletingClass(false)
                            }
                          }}
                        >
                          {isDeletingClass ? 'Đang xóa...' : 'Xóa lớp học'}
                        </Button>
                      </div>
                      <p className='text-xs text-slate-600'>Lưu ý: Xóa lớp sẽ giữ nguyên danh sách sinh viên.</p>
                    </div>
                  )}

                  {/* Students section */}
                  {activeSection === 'students' && (
                    <div className='space-y-6 py-4'>
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
                  )}

                  <DialogFooter>
                    <Button variant='outline' onClick={() => setIsManageDialogOpen(false)} disabled={loading}>
                      Đóng
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Export confirmation dialog */}
              <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className='sm:max-w-md bg-white'>
                  <DialogHeader>
                    <DialogTitle className='text-lg font-semibold'>Xác nhận xuất bảng điểm</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-3'>
                    <p className='text-sm text-slate-600'>
                      Chọn cách tính điểm khi có nhiều bài kiểm tra cùng tên hoặc nhiều lần nộp:
                    </p>
                    <div className='flex gap-2'>
                      <Button
                        variant={exportMethod === 'average' ? 'secondary' : 'outline'}
                        size='sm'
                        onClick={() => setExportMethod('average')}
                      >
                        Trung bình
                      </Button>
                      <Button
                        variant={exportMethod === 'max' ? 'secondary' : 'outline'}
                        size='sm'
                        onClick={() => setExportMethod('max')}
                      >
                        Điểm cao nhất
                      </Button>
                    </div>
                    <p className='text-xs text-slate-500'>Bạn có thể thay đổi cách tính bất cứ lúc nào.</p>
                  </div>
                  <DialogFooter>
                    <Button variant='outline' onClick={() => setIsExportDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={() => performExport(exportMethod === 'average')}>Xuất bảng điểm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                onClick={handleExportGradeSheet}
                variant='outline'
                size='sm'
                className='bg-white/20 border-white/30 text-white hover:bg-white/30 hover-lift'
              >
                <Download className='w-4 h-4 mr-2' />
                Xuất bảng điểm
              </Button>
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
