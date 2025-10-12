import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Notebook, RefreshCw, Wifi, WifiOff, Plus, Edit, Trash2 } from 'lucide-react'
import { classService, examService, submissionService, scannerService } from '@/services/firestore'
import type { Class, Exam } from '@/types'

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
      diem: number
      create_at: string
      id: string
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
    diem: number
    create_at: string
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

      const operations: Promise<unknown>[] = []

      for (const result of scanResults) {
        if (result.diem < 0 || result.diem > 10) {
          setError(`Điểm của ${result.ho_ten} (${result.mssv}) phải trong khoảng 0 - 10`)
          setIsSaving(false)
          return
        }

        // Tạo submission trực tiếp từ scan result
        operations.push(
          submissionService.create({
            examId: selectedExamId,
            classId: selectedClassId,
            studentId: result.mssv, // Sử dụng MSSV làm studentId
            fullName: result.ho_ten,
            score: result.diem,
            contentSummary: `Python scan result from ${result.create_at}`,
          }),
        )
      }

      await Promise.all(operations)

      // Xóa sạch dữ liệu trong Realtime Database sau khi lưu thành công
      await scannerService.clearAllScanResults()

      setMessage(`Lưu thành công ${operations.length} điểm từ kết quả scan Python và đã xóa dữ liệu scan`)
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
      diem: result.diem,
      create_at: result.create_at,
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
        diem: editingScanResult.diem,
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
      <div className='flex flex-col gap-4'>
        <Link to='/' className='self-start'>
          <Button variant='outline' className='flex items-center gap-2 hover:bg-gray-50'>
            <ArrowLeft className='h-4 w-4' />
            Quay về Dashboard
          </Button>
        </Link>

        <Card className='border-0 shadow-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white'>
          <CardHeader className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shadow-lg'>
                <Notebook className='h-6 w-6 text-white' />
              </div>
              <div>
                <CardTitle className='text-2xl font-bold text-white'>Nhập điểm bài kiểm tra</CardTitle>
                <CardDescription className='text-blue-100'>
                  Chọn lớp, bài kiểm tra và theo dõi máy scan trước khi nhập điểm
                </CardDescription>
              </div>
            </div>
            <div className='flex items-center gap-3 text-sm text-blue-100/90'>
              <div className='flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full shadow-sm'>
                <span className='h-2 w-2 rounded-full bg-emerald-300 animate-pulse'></span>
                <span>Sẵn sàng thao tác</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

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
            <Select
              onValueChange={value => {
                if (value === 'create-new-class') {
                  setShowCreateClassDialog(true)
                } else {
                  setSelectedClassId(value)
                }
              }}
              value={selectedClassId}
            >
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
            <Select
              onValueChange={value => {
                if (value === 'create-new-exam') {
                  setShowCreateExamDialog(true)
                } else {
                  setSelectedExamId(value)
                }
              }}
              value={selectedExamId}
              disabled={!selectedClassId || examLoading}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={selectedClassId ? 'Chọn bài kiểm tra' : 'Vui lòng chọn lớp trước'} />
              </SelectTrigger>
              <SelectContent className='bg-white border border-gray-200 shadow-lg min-w-[var(--radix-select-trigger-width)]'>
                {exams.map(exam => (
                  <SelectItem key={exam.id} value={exam.id} className='hover:bg-gray-50 cursor-pointer'>
                    {exam.name}
                  </SelectItem>
                ))}
                <SelectItem
                  value='create-new-exam'
                  className='text-blue-600 font-medium hover:bg-blue-50 cursor-pointer'
                >
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

      <Dialog open={showCreateExamDialog} onOpenChange={setShowCreateExamDialog}>
        <DialogContent className='sm:max-w-[425px] bg-white'>
          <DialogHeader>
            <DialogTitle>Tạo bài kiểm tra mới</DialogTitle>
            <DialogDescription>Nhập thông tin cho bài kiểm tra của lớp {selectedClass?.name}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='exam-name' className='text-right'>
                Bài kiểm tra
              </Label>
              <Input
                id='exam-name'
                value={newExamName}
                onChange={e => setNewExamName(e.target.value)}
                className='col-span-3'
                placeholder='Ví dụ: Kiểm tra giữa kỳ'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setShowCreateExamDialog(false)
                setNewExamName('')
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateExam} disabled={isCreatingExam || !newExamName.trim()}>
              {isCreatingExam ? 'Đang tạo...' : 'Tạo bài kiểm tra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateClassDialog} onOpenChange={setShowCreateClassDialog}>
        <DialogContent className='sm:max-w-[425px] bg-white'>
          <DialogHeader>
            <DialogTitle>Tạo lớp học mới</DialogTitle>
            <DialogDescription>Nhập thông tin cho lớp học mới</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='class-name' className='text-right'>
                Tên lớp
              </Label>
              <Input
                id='class-name'
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                className='col-span-3'
                placeholder='Ví dụ: CNTT2021'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='class-semester' className='text-right'>
                Học kỳ
              </Label>
              <Input
                id='class-semester'
                value={newClassSemester}
                onChange={e => setNewClassSemester(e.target.value)}
                className='col-span-3'
                placeholder='Ví dụ: 2024.1'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setShowCreateClassDialog(false)
                setNewClassName('')
                setNewClassSemester('')
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateClass}
              disabled={isCreatingClass || !newClassName.trim() || !newClassSemester.trim()}
            >
              {isCreatingClass ? 'Đang tạo...' : 'Tạo lớp học'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditScanDialog} onOpenChange={setShowEditScanDialog}>
        <DialogContent className='sm:max-w-[425px] bg-white'>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa kết quả scan</DialogTitle>
            <DialogDescription>Điều chỉnh thông tin kết quả scan từ máy scan</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-ho-ten' className='text-right'>
                Họ tên
              </Label>
              <Input
                id='edit-ho-ten'
                value={editingScanResult?.ho_ten || ''}
                onChange={e => setEditingScanResult(prev => (prev ? { ...prev, ho_ten: e.target.value } : null))}
                className='col-span-3'
                placeholder='Nhập họ tên'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-mssv' className='text-right'>
                MSSV
              </Label>
              <Input
                id='edit-mssv'
                value={editingScanResult?.mssv || ''}
                onChange={e => setEditingScanResult(prev => (prev ? { ...prev, mssv: e.target.value } : null))}
                className='col-span-3'
                placeholder='Nhập MSSV'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-diem' className='text-right'>
                Điểm
              </Label>
              <Input
                id='edit-diem'
                type='number'
                min='0'
                max='10'
                step='0.1'
                value={editingScanResult?.diem || ''}
                onChange={e =>
                  setEditingScanResult(prev => (prev ? { ...prev, diem: parseFloat(e.target.value) || 0 } : null))
                }
                className='col-span-3'
                placeholder='Nhập điểm (0-10)'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setShowEditScanDialog(false)
                setEditingScanResult(null)
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateScanResult}
              disabled={isUpdatingScan || !editingScanResult?.ho_ten.trim() || !editingScanResult?.mssv.trim()}
            >
              {isUpdatingScan ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showManualEntryDialog} onOpenChange={setShowManualEntryDialog}>
        <DialogContent className='sm:max-w-[425px] bg-white'>
          <DialogHeader>
            <DialogTitle>Nhập điểm thủ công</DialogTitle>
            <DialogDescription>Thêm kết quả scan thủ công khi máy scan không hoạt động</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='manual-ho-ten' className='text-right'>
                Họ tên
              </Label>
              <Input
                id='manual-ho-ten'
                value={manualEntryData.ho_ten}
                onChange={e => setManualEntryData(prev => ({ ...prev, ho_ten: e.target.value }))}
                className='col-span-3'
                placeholder='Nhập họ tên học sinh'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='manual-mssv' className='text-right'>
                MSSV
              </Label>
              <Input
                id='manual-mssv'
                value={manualEntryData.mssv}
                onChange={e => setManualEntryData(prev => ({ ...prev, mssv: e.target.value }))}
                className='col-span-3'
                placeholder='Nhập mã số sinh viên'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='manual-diem' className='text-right'>
                Điểm
              </Label>
              <Input
                id='manual-diem'
                type='number'
                min='0'
                max='10'
                step='0.1'
                value={manualEntryData.diem || ''}
                onChange={e => setManualEntryData(prev => ({ ...prev, diem: parseFloat(e.target.value) || 0 }))}
                className='col-span-3'
                placeholder='Nhập điểm (0-10)'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setShowManualEntryDialog(false)
                setManualEntryData({ ho_ten: '', mssv: '', diem: 0 })
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveManualEntry}
              disabled={isSavingManual || !manualEntryData.ho_ten.trim() || !manualEntryData.mssv.trim()}
            >
              {isSavingManual ? 'Đang lưu...' : 'Thêm kết quả'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedClassId && selectedExamId && (
        <Card className='border border-blue-200/60 bg-blue-50/60 shadow-sm backdrop-blur-sm'>
          <CardHeader className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-center gap-3'>
              {scannerStatus === 'checking' ? (
                <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
              ) : scannerStatus === 'online' ? (
                <Wifi className='h-5 w-5 text-emerald-600' />
              ) : (
                <WifiOff className='h-5 w-5 text-red-600' />
              )}
              <div>
                <CardTitle className='text-base font-semibold text-slate-800'>Trạng thái máy scan</CardTitle>
                <CardDescription className='text-sm text-slate-600'>
                  Kiểm tra kết nối trước khi nhập điểm tự động
                </CardDescription>
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRetryScanner}
              disabled={scannerStatus === 'checking'}
              className='flex items-center gap-2'
            >
              <RefreshCw className={`h-4 w-4 ${scannerStatus === 'checking' ? 'animate-spin' : ''}`} />
              Kiểm tra lại
            </Button>
          </CardHeader>
          <CardContent className='text-sm text-slate-700 space-y-2'>
            {scannerStatus === 'checking' && (
              <div className='flex items-center gap-3 text-blue-700'>
                <span className='relative flex h-3 w-3'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-blue-500'></span>
                </span>
                <span>Chờ kết nối...</span>
              </div>
            )}
            {scannerStatus === 'online' && <p className='text-emerald-700'>Máy scan đang trực tuyến và sẵn sàng.</p>}
            {scannerStatus === 'offline' && (
              <div className='flex items-center gap-3 text-blue-700'>
                <span className='relative flex h-3 w-3'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-blue-500'></span>
                </span>
                <span>Chờ kết nối...</span>
              </div>
            )}
            {lastHeartbeat && (
              <p className='text-xs text-slate-500'>Hoạt động gần nhất: {lastHeartbeat.toLocaleString('vi-VN')}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className='border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm'>
        <CardHeader className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-xl'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div>
                <CardTitle className='text-xl font-bold text-white flex items-center gap-2 py-2'>
                  Kết quả scan bài thi
                  {scanResults.length > 0 && (
                    <span className='px-3 py-1 bg-white/20 animate-pulse text-white rounded-full text-sm font-medium backdrop-blur-sm border border-white/30'>
                      {scanResults.length} kết quả
                    </span>
                  )}
                </CardTitle>
                <CardDescription className='text-blue-100 mt-1'>
                  Dữ liệu realtime từ máy scan • Sẵn sàng để chỉnh sửa và lưu điểm
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedClassId || !selectedExamId ? (
            <div className='text-center py-20'>
              <div className='w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg'>
                <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center'>
                  <div className='w-4 h-4 rounded-full bg-white animate-pulse'></div>
                </div>
              </div>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Chọn lớp và bài kiểm tra</h3>
              <p className='text-slate-600 mb-4 max-w-md mx-auto'>
                Hãy chọn lớp học và bài kiểm tra để lưu điểm từ kết quả scan vào hệ thống
              </p>
              {scanResults.length > 0 && (
                <div className='inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm'>
                  <div className='w-3 h-3 rounded-full bg-blue-500 animate-pulse'></div>
                  <span className='text-blue-700 font-medium'>
                    Có {scanResults.length} kết quả scan sẵn sàng để lưu
                  </span>
                </div>
              )}
            </div>
          ) : scanLoading ? (
            <div className='text-center py-20'>
              <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center'>
                <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
              </div>
              <p className='text-slate-600'>Đang tải kết quả scan...</p>
            </div>
          ) : scanResults.length === 0 ? (
            <div className='text-center py-20'>
              <div className='w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center'>
                <div className='w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center'>
                  <div className='w-6 h-6 rounded-full bg-slate-400'></div>
                </div>
              </div>
              <h3 className='text-lg font-semibold text-slate-800 mb-2'>Chưa có kết quả scan</h3>
              <p className='text-slate-600 max-w-md mx-auto'>
                Dữ liệu sẽ được cập nhật tự động khi máy scan hoạt động và gửi kết quả
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto rounded-lg border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gradient-to-r from-slate-50 to-slate-100/80 hover:from-slate-100 hover:to-slate-50 border-b border-slate-200/60'>
                    <TableHead className='w-[35%] font-semibold text-slate-700 py-4 px-6'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-blue-500'></div>
                        Họ tên
                      </div>
                    </TableHead>
                    <TableHead className='w-[20%] font-semibold text-slate-700 py-4 px-6'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-green-500'></div>
                        MSSV
                      </div>
                    </TableHead>
                    <TableHead className='w-[15%] font-semibold text-slate-700 py-4 px-6 text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-purple-500'></div>
                        Điểm
                      </div>
                    </TableHead>
                    <TableHead className='w-[20%] font-semibold text-slate-700 py-4 px-6'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-orange-500'></div>
                        Thời gian scan
                      </div>
                    </TableHead>
                    <TableHead className='w-[10%] font-semibold text-slate-700 py-4 px-6 text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-red-500'></div>
                        Thao tác
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanResults.map((result, index) => (
                    <TableRow
                      key={result.id || result.mssv + index}
                      className='hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 border-b border-slate-100/80 group'
                    >
                      <TableCell className='py-4 px-6 font-medium text-slate-800'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm'>
                            {result.ho_ten.charAt(0).toUpperCase()}
                          </div>
                          <span className='group-hover:text-blue-700 transition-colors'>{result.ho_ten}</span>
                        </div>
                      </TableCell>
                      <TableCell className='py-4 px-6'>
                        <div className='flex items-center gap-2'>
                          <div className='px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm font-mono font-medium'>
                            {result.mssv}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='py-4 px-6 text-center'>
                        <div
                          className={`inline-flex items-center justify-center w-12 h-8 rounded-full text-sm font-bold shadow-sm ${
                            result.diem >= 8
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                              : result.diem >= 6
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          }`}
                        >
                          {result.diem}
                        </div>
                      </TableCell>
                      <TableCell className='py-4 px-6 text-slate-600'>
                        <div className='flex items-center gap-2'>
                          <div className='w-2 h-2 rounded-full bg-orange-400 animate-pulse'></div>
                          <span className='text-sm'>
                            {new Date(result.create_at).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='py-4 px-6'>
                        <div className='flex justify-center gap-1'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEditScanResult(result)}
                            className='h-8 w-8 p-0 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-sm'
                            title='Chỉnh sửa'
                          >
                            <Edit className='h-3.5 w-3.5 text-blue-600' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleDeleteScanResult(result.id || '')}
                            className='h-8 w-8 p-0 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all duration-200 shadow-sm'
                            title='Xóa'
                          >
                            <Trash2 className='h-3.5 w-3.5 text-red-600' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <div className='flex justify-end gap-3 px-6 pb-6'>
          <Button
            onClick={() => setShowManualEntryDialog(true)}
            variant='outline'
            className='border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700 font-semibold px-6 py-3 shadow-sm hover:shadow-md transition-all duration-300'
          >
            <div className='flex items-center gap-2'>
              <Plus className='w-4 h-4' />
              Nhập tay
            </div>
          </Button>
          <Button
            onClick={handleSaveScores}
            disabled={!selectedClassId || !selectedExamId || isSaving || scanResults.length === 0}
            className='bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:shadow-lg'
          >
            {isSaving ? (
              <div className='flex items-center gap-2'>
                <Loader2 className='w-4 h-4 animate-spin' />
                Đang lưu...
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <div className='w-5 h-5 rounded-full bg-white/20 flex items-center justify-center'>
                  <span className='text-xs font-bold'>✓</span>
                </div>
                Lưu điểm vào hệ thống
              </div>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ScoreEntry
