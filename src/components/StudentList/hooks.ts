import { useEffect, useState } from 'react'
import { examService, submissionService } from '@/services/firestore'
import type { Student, Exam, Submission } from '@/types'
import { toast } from 'sonner'

export const useExamManagement = (classId: string) => {
  const [classExams, setClassExams] = useState<Record<string, Exam>>({})
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [examSubmissions, setExamSubmissions] = useState<Submission[]>([])
  const [examSubmissionsLoading, setExamSubmissionsLoading] = useState(false)

  useEffect(() => {
    const loadExams = async () => {
      try {
        const exams = await examService.getAll({ classId })
        const examRecord: Record<string, Exam> = {}
        exams.forEach((exam: Exam) => {
          examRecord[exam.id] = exam
        })
        setClassExams(examRecord)
      } catch (error) {
        console.error('Error loading exams:', error)
        toast.error('Có lỗi xảy ra khi tải danh sách bài kiểm tra')
      }
    }

    if (classId) {
      loadExams()
    }
  }, [classId])

  useEffect(() => {
    const loadExamSubmissions = async () => {
      if (!selectedExam) {
        setExamSubmissions([])
        return
      }

      setExamSubmissionsLoading(true)
      try {
        const submissions = await submissionService.getAll({ examId: selectedExam.id })
        setExamSubmissions(submissions)
      } catch (error) {
        console.error('Error loading exam submissions:', error)
        toast.error('Có lỗi xảy ra khi tải danh sách bài nộp')
      } finally {
        setExamSubmissionsLoading(false)
      }
    }

    loadExamSubmissions()
  }, [selectedExam])

  const selectExam = (exam: Exam) => {
    setSelectedExam(exam)
  }

  const backToExamList = () => {
    setSelectedExam(null)
    setExamSubmissions([])
  }

  return {
    classExams,
    selectedExam,
    examSubmissions,
    examSubmissionsLoading,
    selectExam,
    backToExamList,
  }
}

export const useStudentSubmissions = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSubmissions, setStudentSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [showStudentResults, setShowStudentResults] = useState(false)

  useEffect(() => {
    const loadStudentSubmissions = async () => {
      if (!selectedStudent) {
        setStudentSubmissions([])
        return
      }

      setSubmissionsLoading(true)
      try {
        const submissions = await submissionService.getAll({ studentId: selectedStudent.id })
        setStudentSubmissions(submissions)
      } catch (error) {
        console.error('Error loading student submissions:', error)
        toast.error('Có lỗi xảy ra khi tải kết quả của sinh viên')
      } finally {
        setSubmissionsLoading(false)
      }
    }

    loadStudentSubmissions()
  }, [selectedStudent])

  const selectStudent = (student: Student) => {
    setSelectedStudent(student)
  }

  const showResults = (student: Student) => {
    setSelectedStudent(student)
    setShowStudentResults(true)
  }

  const hideResults = () => {
    setShowStudentResults(false)
    setSelectedStudent(null)
  }

  return {
    selectedStudent,
    studentSubmissions,
    submissionsLoading,
    showStudentResults,
    selectStudent,
    showResults,
    hideResults,
  }
}

export const useClassSettings = (classInfo: { id: string; name: string }, onBack: () => void) => {
  const [classNameEdit, setClassNameEdit] = useState<string>(classInfo.name)
  const [isRenamingClass, setIsRenamingClass] = useState(false)
  const [isDeletingClass, setIsDeletingClass] = useState(false)

  const updateClassName = async (newName: string) => {
    setIsRenamingClass(true)
    try {
      console.log('Update class name to:', newName)

      setClassNameEdit(newName)
    } catch (error) {
      console.error('Error updating class name:', error)
      throw error
    } finally {
      setIsRenamingClass(false)
    }
  }

  const deleteClass = async () => {
    setIsDeletingClass(true)
    try {
      console.log('Delete class:', classInfo.id)

      onBack()
    } catch (error) {
      console.error('Error deleting class:', error)
      throw error
    } finally {
      setIsDeletingClass(false)
    }
  }

  return {
    classNameEdit,
    isRenamingClass,
    isDeletingClass,
    updateClassName,
    deleteClass,
  }
}

export const useDisplayUtils = () => {
  const formatDate = (timestamp?: { seconds: number; nanoseconds: number } | null): string => {
    if (!timestamp) return '--'
    const date = new Date(timestamp.seconds * 1000)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatExamDate = (timestamp?: Exam['date']): string => {
    if (!timestamp) return '--'

    if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      const date = new Date(timestamp.seconds * 1000)
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const date = new Date(timestamp as string | number | Date)
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return '--'
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return {
    formatDate,
    formatExamDate,
    getInitials,
  }
}
