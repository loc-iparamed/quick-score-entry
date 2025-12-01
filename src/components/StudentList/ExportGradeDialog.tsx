import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download } from 'lucide-react'
import { submissionService } from '@/services/firestore'
import type { Student, Exam } from '@/types'
import { toast } from 'sonner'

interface ExportGradeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  classInfo: { id: string; name: string }
  students: Student[]
  classExams: Record<string, Exam>
}

const ExportGradeDialog: React.FC<ExportGradeDialogProps> = ({
  isOpen,
  onOpenChange,
  classInfo,
  students,
  classExams,
}) => {
  const [exportMethod, setExportMethod] = useState<'average' | 'max'>('average')

  const performExport = async (useAverage: boolean) => {
    try {
      const DEFAULT_EXAM_NAMES = [
        'Bài kiểm tra đợt 1',
        'Bài kiểm tra đợt 2',
        'Bài kiểm tra giữa kỳ',
        'Bài kiểm tra cuối kỳ',
      ] as const

      const classSubmissions = await submissionService.getAll({ classId: classInfo.id })

      if (students.length === 0) {
        toast.info('Lớp chưa có sinh viên để xuất bảng điểm')
        return
      }

      const nameToExamIds = new Map<string, string[]>()
      for (const e of Object.values(classExams)) {
        const list = nameToExamIds.get(e.name) ?? []
        list.push(e.id)
        nameToExamIds.set(e.name, list)
      }

      const getScore = (studentId: string, examName: (typeof DEFAULT_EXAM_NAMES)[number]) => {
        const examIds = nameToExamIds.get(examName)
        if (!examIds || examIds.length === 0) return ''

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
      onOpenChange(false)
    } catch (err) {
      console.error('Export grade sheet error:', err)
      toast.error('Không thể xuất bảng điểm. Vui lòng thử lại')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => performExport(exportMethod === 'average')}>
            <Download className='w-4 h-4 mr-2' />
            Xuất bảng điểm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportGradeDialog
