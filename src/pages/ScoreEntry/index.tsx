import { useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  classService,
  examService,
  submissionService,
  scannerService,
  studentService,
  enrollmentService,
} from '@/services/firestore'
import {
  ScoreEntryHeader,
  ClassExamSelector,
  ScannerStatusCard,
  ScanResultsTable,
  CreateExamDialog,
  CreateClassDialog,
  EditScanDialog,
  ManualEntryDialog,
} from '@/components/ScoreEntry'
import type { Class, Exam, Student } from '@/types'

const ScoreEntry = () => {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [loading, setLoading] = useState(true)
  const [examLoading, setExamLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [scanResults, setScanResults] = useState<
    Array<{
      ho_ten: string
      mssv: string
      diem: number | null
      create_at: string
      id: string
      image_data?: string
    }>
  >([])
  const [scanLoading, setScanLoading] = useState(false)
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle')
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)
  const [showCreateExamDialog, setShowCreateExamDialog] = useState(false)
  const [newExamName, setNewExamName] = useState('')
  const [isCreatingExam, setIsCreatingExam] = useState(false)
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassSemester, setNewClassSemester] = useState('')
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [showEditScanDialog, setShowEditScanDialog] = useState(false)
  const [editingScanResult, setEditingScanResult] = useState<{
    id: string
    ho_ten: string
    mssv: string
    diem: number | null | undefined
    create_at: string
    image_data?: string
  } | null>(null)
  const [isUpdatingScan, setIsUpdatingScan] = useState(false)
  const [showManualEntryDialog, setShowManualEntryDialog] = useState(false)
  const [manualEntryData, setManualEntryData] = useState({
    ho_ten: '',
    mssv: '',
    diem: 0,
  })
  const [isSavingManual, setIsSavingManual] = useState(false)

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true)
        const data = await classService.getAll()
        setClasses(data)
      } catch (err) {
        console.error(err)
        setError('Không thể tải danh sách lớp học')
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
  }, [])

  useEffect(() => {
    if (!selectedClassId) {
      setExams([])
      setSelectedExamId('')
      return
    }

    const loadExams = async () => {
      try {
        setExamLoading(true)
        setError(null)
        const data = await examService.getAll({ classId: selectedClassId })
        setExams(data)
        setSelectedExamId('')
      } catch (err) {
        console.error(err)
        setError('Không thể tải danh sách bài kiểm tra')
      } finally {
        setExamLoading(false)
      }
    }

    loadExams()
  }, [selectedClassId])

  useEffect(() => {
    if (!selectedClassId || !selectedExamId) {
      setScannerStatus('idle')
      setLastHeartbeat(null)
      return
    }

    const loadData = async () => {
      try {
        setError(null)
        // Load basic data if needed for other purposes
      } catch (err) {
        console.error(err)
        setError('Không thể tải dữ liệu')
      }
    }

    loadData()
  }, [selectedClassId, selectedExamId, classes])

  useEffect(() => {
    setScanLoading(true)

    const unsubscribe = scannerService.getScanResultsFromRoot(data => {
      setScanResults(data)
      setScanLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const selectedClass = useMemo(
    () => classes.find(cls => cls.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  )

  const handleSaveScores = async () => {
    if (scanResults.length === 0) return

    try {
      setIsSaving(true)
      setError(null)
      setMessage(null)

      // Kiểm tra sinh viên không tồn tại
      const missingStudents: Array<{ ho_ten: string; mssv: string; diem: number | null }> = []
      const existingStudentMap = new Map<string, Student>()

      // Kiểm tra từng sinh viên - Validation đầy đủ trước khi lưu
      for (const result of scanResults) {
        // Kiểm tra họ tên
        if (!result.ho_ten || !result.ho_ten.trim()) {
          setError(`Thiếu họ tên cho sinh viên MSSV: ${result.mssv || 'Chưa có MSSV'}`)
          setIsSaving(false)
          return
        }

        // Kiểm tra MSSV
        if (!result.mssv || !result.mssv.trim()) {
          setError(`Thiếu MSSV cho sinh viên: ${result.ho_ten}`)
          setIsSaving(false)
          return
        }

        // Kiểm tra độ dài MSSV (tối đa 8 ký tự)
        if (result.mssv.trim().length > 8) {
          setError(`MSSV của ${result.ho_ten} (${result.mssv}) không được quá 8 ký tự`)
          setIsSaving(false)
          return
        }

        // Kiểm tra điểm
        if (result.diem === null || result.diem === undefined) {
          setError(`Điểm của ${result.ho_ten} (${result.mssv}) chưa được nhập`)
          setIsSaving(false)
          return
        }

        // Kiểm tra điểm phải ≤ 10 và ≥ 0
        if (result.diem < 0 || result.diem > 10) {
          setError(`Điểm của ${result.ho_ten} (${result.mssv}) phải trong khoảng 0 - 10`)
          setIsSaving(false)
          return
        }

        // Kiểm tra sinh viên có tồn tại theo MSSV không
        const existingStudent = await studentService.getByMSSV(result.mssv)

        if (existingStudent) {
          // Kiểm tra tên có khớp không
          if (existingStudent.fullName.toLowerCase().trim() !== result.ho_ten.toLowerCase().trim()) {
            setError(
              `MSSV ${result.mssv} đã tồn tại với tên "${existingStudent.fullName}" nhưng dữ liệu scan có tên "${result.ho_ten}". Vui lòng kiểm tra lại.`,
            )
            setIsSaving(false)
            return
          }
          existingStudentMap.set(result.mssv, existingStudent)
        } else {
          missingStudents.push(result)
        }
      }

      // Nếu có sinh viên không tồn tại, hiển thị popup confirm
      if (missingStudents.length > 0) {
        const studentList = missingStudents.map(s => `- ${s.ho_ten} (${s.mssv})`).join('\n')

        const confirmMessage = `Phát hiện ${missingStudents.length} sinh viên chưa có trong hệ thống:\n\n${studentList}\n\nBạn có muốn tự động tạo mới các sinh viên này và thêm vào lớp "${selectedClass?.name}" không?`

        if (!confirm(confirmMessage)) {
          setIsSaving(false)
          return
        }

        // Tạo sinh viên mới và thêm vào lớp
        for (const missingStudent of missingStudents) {
          try {
            // Tạo sinh viên mới
            const email = `${missingStudent.mssv}@student.tdtu.edu.vn`
            const newStudentId = await studentService.create({
              mssv: missingStudent.mssv,
              fullName: missingStudent.ho_ten,
              email: email,
            })

            // Thêm sinh viên vào lớp
            await enrollmentService.create({
              classId: selectedClassId,
              studentId: newStudentId,
            })

            // Thêm vào map để sử dụng sau này
            existingStudentMap.set(missingStudent.mssv, {
              id: newStudentId,
              mssv: missingStudent.mssv,
              fullName: missingStudent.ho_ten,
              email: email,
              createdAt: { toDate: () => new Date() } as import('firebase/firestore').Timestamp,
            })
          } catch (error) {
            console.error(`Error creating student ${missingStudent.mssv}:`, error)
            setError(`Không thể tạo sinh viên ${missingStudent.ho_ten} (${missingStudent.mssv})`)
            setIsSaving(false)
            return
          }
        }
      }

      // Tạo submissions
      const operations: Promise<unknown>[] = []

      for (const result of scanResults) {
        const student = existingStudentMap.get(result.mssv)
        if (!student) {
          setError(`Không tìm thấy thông tin sinh viên ${result.mssv}`)
          setIsSaving(false)
          return
        }

        operations.push(
          submissionService.create({
            examId: selectedExamId,
            classId: selectedClassId,
            studentId: student.id, // Sử dụng studentId thực
            fullName: result.ho_ten,
            score: result.diem!, // Đã validate ở trên nên có thể dùng !
            contentSummary: `Python scan result from ${result.create_at}`,
          }),
        )
      }

      await Promise.all(operations)

      // Xóa sạch dữ liệu trong Realtime Database sau khi lưu thành công
      await scannerService.clearAllScanResults()

      const createdCount = missingStudents.length
      let message = `Lưu thành công ${operations.length} điểm từ kết quả scan Python và đã xóa dữ liệu scan`
      if (createdCount > 0) {
        message += `\n\nĐã tự động tạo ${createdCount} sinh viên mới và thêm vào lớp "${selectedClass?.name}"`
      }

      setMessage(message)

      // Notify other components to reload data
      window.dispatchEvent(new CustomEvent('studentDataChanged'))
    } catch (err) {
      console.error('🎯 Error saving scores:', err)
      setError('Không thể lưu điểm. Vui lòng thử lại')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditScanResult = (result: (typeof scanResults)[0]) => {
    setEditingScanResult({
      id: result.id || '',
      ho_ten: result.ho_ten,
      mssv: result.mssv,
      diem: result.diem || 0,
      create_at: result.create_at,
      image_data: result.image_data,
    })
    setShowEditScanDialog(true)
  }

  const handleDeleteScanResult = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kết quả scan này?')) return

    try {
      await scannerService.deleteScanResult(id)
      setMessage('Đã xóa kết quả scan thành công')
    } catch (err) {
      console.error('Error deleting scan result:', err)
      setError('Không thể xóa kết quả scan. Vui lòng thử lại')
    }
  }

  const handleUpdateScanResult = async () => {
    if (!editingScanResult) return

    try {
      setIsUpdatingScan(true)
      setError(null)

      await scannerService.updateScanResult(editingScanResult.id, {
        ho_ten: editingScanResult.ho_ten,
        mssv: editingScanResult.mssv,
        diem: editingScanResult.diem || 0,
      })

      setMessage('Đã cập nhật kết quả scan thành công')
      setShowEditScanDialog(false)
      setEditingScanResult(null)
    } catch (err) {
      console.error('Error updating scan result:', err)
      setError('Không thể cập nhật kết quả scan. Vui lòng thử lại')
    } finally {
      setIsUpdatingScan(false)
    }
  }

  const handleSaveManualEntry = async () => {
    if (!manualEntryData.ho_ten.trim() || !manualEntryData.mssv.trim()) {
      setError('Vui lòng nhập đầy đủ họ tên và MSSV')
      return
    }

    if (manualEntryData.diem < 0 || manualEntryData.diem > 10) {
      setError('Điểm phải trong khoảng 0 - 10')
      return
    }

    try {
      setIsSavingManual(true)
      setError(null)

      await scannerService.addManualScanResult({
        ho_ten: manualEntryData.ho_ten.trim(),
        mssv: manualEntryData.mssv.trim(),
        diem: manualEntryData.diem,
      })

      setMessage('Đã thêm kết quả scan thủ công thành công')
      setShowManualEntryDialog(false)
      setManualEntryData({ ho_ten: '', mssv: '', diem: 0 })
    } catch (err) {
      console.error('Error saving manual entry:', err)
      setError('Không thể lưu kết quả scan thủ công. Vui lòng thử lại')
    } finally {
      setIsSavingManual(false)
    }
  }

  const handleRetryScanner = async () => {
    if (!selectedClassId || !selectedExamId) return
    try {
      setScannerStatus('checking')
      const status = await scannerService.getStatus()
      if (status.lastHeartbeat) {
        setLastHeartbeat(status.lastHeartbeat.toDate())
      } else {
        setLastHeartbeat(null)
      }
      setScannerStatus(status.online ? 'online' : 'offline')
    } catch (err) {
      console.error(err)
      setScannerStatus('offline')
      setLastHeartbeat(null)
    }
  }

  const handleCreateExam = async () => {
    if (!selectedClassId || !newExamName.trim()) {
      setError('Vui lòng nhập tên bài kiểm tra')
      return
    }

    try {
      setIsCreatingExam(true)
      setError(null)

      const examId = await examService.create({
        name: newExamName.trim(),
        classId: selectedClassId,
        maxScore: 10,
        date: new Date().toISOString(),
      })

      // Reload exams
      const data = await examService.getAll({ classId: selectedClassId })
      setExams(data)

      setSelectedExamId(examId)

      // Reset form
      setNewExamName('')
      setShowCreateExamDialog(false)
      setMessage('Tạo bài kiểm tra thành công')
    } catch (err) {
      console.error(err)
      setError('Không thể tạo bài kiểm tra. Vui lòng thử lại')
    } finally {
      setIsCreatingExam(false)
    }
  }

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !newClassSemester.trim()) {
      setError('Vui lòng nhập đầy đủ tên lớp và học kỳ')
      return
    }

    try {
      setIsCreatingClass(true)
      setError(null)

      await classService.create({
        name: newClassName.trim(),
        semester: newClassSemester.trim(),
        teacherId: 'default-teacher', // Có thể để mặc định hoặc lấy từ user hiện tại
      })

      const data = await classService.getAll()
      setClasses(data)

      setNewClassName('')
      setNewClassSemester('')
      setShowCreateClassDialog(false)
      setMessage('Tạo lớp học thành công')
    } catch (err) {
      console.error(err)
      setError('Không thể tạo lớp học. Vui lòng thử lại')
    } finally {
      setIsCreatingClass(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gradient-to-r from-blue-600 to-purple-600'></div>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-7xl space-y-6'>
      <ScoreEntryHeader />

      {error && (
        <Alert className='border-red-200 bg-red-50'>
          <AlertDescription className='text-red-800'>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className='border-emerald-200 bg-emerald-50'>
          <AlertDescription className='text-emerald-800'>{message}</AlertDescription>
        </Alert>
      )}

      <ClassExamSelector
        classes={classes}
        selectedClassId={selectedClassId}
        exams={exams}
        selectedExamId={selectedExamId}
        examLoading={examLoading}
        onClassChange={value => {
          if (value === 'create-new-class') {
            setShowCreateClassDialog(true)
          } else {
            setSelectedClassId(value)
          }
        }}
        onExamChange={value => {
          if (value === 'create-new-exam') {
            setShowCreateExamDialog(true)
          } else {
            setSelectedExamId(value)
          }
        }}
      />

      {selectedClassId && selectedExamId && (
        <ScannerStatusCard
          scannerStatus={scannerStatus}
          lastHeartbeat={lastHeartbeat}
          onRetryScanner={handleRetryScanner}
        />
      )}

      <ScanResultsTable
        selectedClassId={selectedClassId}
        selectedExamId={selectedExamId}
        scanResults={scanResults}
        scanLoading={scanLoading}
        isSaving={isSaving}
        onEditScanResult={handleEditScanResult}
        onDeleteScanResult={handleDeleteScanResult}
        onSaveScores={handleSaveScores}
        onManualEntry={() => setShowManualEntryDialog(true)}
      />

      <CreateExamDialog
        open={showCreateExamDialog}
        onOpenChange={setShowCreateExamDialog}
        selectedClass={selectedClass}
        newExamName={newExamName}
        onExamNameChange={setNewExamName}
        isCreating={isCreatingExam}
        onCreate={handleCreateExam}
      />

      <CreateClassDialog
        open={showCreateClassDialog}
        onOpenChange={setShowCreateClassDialog}
        newClassName={newClassName}
        onClassNameChange={setNewClassName}
        newClassSemester={newClassSemester}
        onClassSemesterChange={setNewClassSemester}
        isCreating={isCreatingClass}
        onCreate={handleCreateClass}
      />

      <EditScanDialog
        open={showEditScanDialog}
        onOpenChange={setShowEditScanDialog}
        editingScanResult={editingScanResult}
        onUpdateScanResult={setEditingScanResult}
        isUpdating={isUpdatingScan}
        onSave={handleUpdateScanResult}
      />

      <ManualEntryDialog
        open={showManualEntryDialog}
        onOpenChange={setShowManualEntryDialog}
        manualEntryData={manualEntryData}
        onUpdateManualEntryData={setManualEntryData}
        isSaving={isSavingManual}
        onSave={handleSaveManualEntry}
      />
    </div>
  )
}

export default ScoreEntry
