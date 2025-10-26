import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect, useCallback } from 'react'

interface EditScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingScanResult: {
    id: string
    ho_ten: string
    mssv: string
    diem: number | null | undefined
    create_at: string
    image_data?: string
  } | null
  onUpdateScanResult: (result: {
    id: string
    ho_ten: string
    mssv: string
    diem: number | null | undefined
    create_at: string
    image_data?: string
  }) => void
  isUpdating: boolean
  onSave: () => void
}

export const EditScanDialog = ({
  open,
  onOpenChange,
  editingScanResult,
  onUpdateScanResult,
  isUpdating,
  onSave,
}: EditScanDialogProps) => {
  const [errors, setErrors] = useState<{
    ho_ten?: string
    mssv?: string
    diem?: string
  }>({})

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {}

    if (!editingScanResult?.ho_ten?.trim()) {
      newErrors.ho_ten = 'Họ tên không được để trống'
    }

    if (!editingScanResult?.mssv?.trim()) {
      newErrors.mssv = 'MSSV không được để trống'
    } else if (editingScanResult.mssv.length > 8) {
      newErrors.mssv = 'MSSV tối đa 8 ký tự'
    }

    if (editingScanResult?.diem === null || editingScanResult?.diem === undefined) {
      newErrors.diem = 'Điểm không được để trống'
    } else if (editingScanResult.diem < 0 || editingScanResult.diem > 10) {
      newErrors.diem = 'Điểm phải từ 0 đến 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [editingScanResult])

  useEffect(() => {
    if (editingScanResult) {
      validateForm()
    }
  }, [editingScanResult, validateForm])

  const handleSave = () => {
    if (validateForm()) {
      onSave()
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setErrors({})
    onUpdateScanResult({
      id: '',
      ho_ten: '',
      mssv: '',
      diem: null,
      create_at: '',
      image_data: undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px] bg-white'>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa kết quả scan</DialogTitle>
          <DialogDescription>Điều chỉnh thông tin kết quả scan từ máy scan</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-ho-ten' className='text-right'>
                Họ tên
              </Label>
              <Input
                id='edit-ho-ten'
                value={editingScanResult?.ho_ten || ''}
                onChange={e =>
                  onUpdateScanResult({
                    ...editingScanResult!,
                    ho_ten: e.target.value,
                  })
                }
                className={`col-span-3 ${errors.ho_ten ? 'border-red-500' : ''}`}
                placeholder='Nhập họ tên'
              />
            </div>
            {errors.ho_ten && <p className='text-red-500 text-sm ml-[25%]'>{errors.ho_ten}</p>}
          </div>

          <div className='grid gap-2'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-mssv' className='text-right'>
                MSSV
              </Label>
              <Input
                id='edit-mssv'
                value={editingScanResult?.mssv || ''}
                onChange={e =>
                  onUpdateScanResult({
                    ...editingScanResult!,
                    mssv: e.target.value,
                  })
                }
                className={`col-span-3 ${errors.mssv ? 'border-red-500' : ''}`}
                placeholder='Nhập MSSV (tối đa 8 ký tự)'
                maxLength={8}
              />
            </div>
            {errors.mssv && <p className='text-red-500 text-sm ml-[25%]'>{errors.mssv}</p>}
          </div>

          <div className='grid gap-2'>
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
                value={editingScanResult?.diem ?? ''}
                onChange={e =>
                  onUpdateScanResult({
                    ...editingScanResult!,
                    diem: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className={`col-span-3 ${errors.diem ? 'border-red-500' : ''}`}
                placeholder='Nhập điểm (0-10)'
              />
            </div>
            {errors.diem && <p className='text-red-500 text-sm ml-[25%]'>{errors.diem}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isUpdating || Object.keys(errors).length > 0}>
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
