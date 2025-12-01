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

interface ManualEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manualEntryData: {
    ho_ten: string
    mssv: string
    diem: number
    clarity?: number
    spacing?: number
    straightness?: number
  }
  onUpdateManualEntryData: (data: {
    ho_ten: string
    mssv: string
    diem: number
    clarity?: number
    spacing?: number
    straightness?: number
  }) => void
  isSaving: boolean
  onSave: () => void
}

export const ManualEntryDialog = ({
  open,
  onOpenChange,
  manualEntryData,
  onUpdateManualEntryData,
  isSaving,
  onSave,
}: ManualEntryDialogProps) => {
  const handleClose = () => {
    onOpenChange(false)
    onUpdateManualEntryData({
      ho_ten: '',
      mssv: '',
      diem: 0,
      clarity: undefined,
      spacing: undefined,
      straightness: undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={e =>
                onUpdateManualEntryData({
                  ...manualEntryData,
                  ho_ten: e.target.value,
                })
              }
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
              onChange={e =>
                onUpdateManualEntryData({
                  ...manualEntryData,
                  mssv: e.target.value,
                })
              }
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
              onChange={e =>
                onUpdateManualEntryData({
                  ...manualEntryData,
                  diem: parseFloat(e.target.value) || 0,
                })
              }
              className='col-span-3'
              placeholder='Nhập điểm (0-10)'
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='manual-clarity' className='text-right'>
              Nét viết
            </Label>
            <Input
              id='manual-clarity'
              type='number'
              min='0'
              max='10'
              step='0.1'
              value={manualEntryData.clarity ?? ''}
              onChange={e =>
                onUpdateManualEntryData({
                  ...manualEntryData,
                  clarity: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className='col-span-3'
              placeholder='Điểm nét viết (0-10)'
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='manual-spacing' className='text-right'>
              Khoảng cách
            </Label>
            <Input
              id='manual-spacing'
              type='number'
              min='0'
              max='10'
              step='0.1'
              value={manualEntryData.spacing ?? ''}
              onChange={e =>
                onUpdateManualEntryData({
                  ...manualEntryData,
                  spacing: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className='col-span-3'
              placeholder='Điểm khoảng cách (0-10)'
            />
          </div>

          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='manual-straightness' className='text-right'>
              Thẳng hàng
            </Label>
            <Input
              id='manual-straightness'
              type='number'
              min='0'
              max='10'
              step='0.1'
              value={manualEntryData.straightness ?? ''}
              onChange={e =>
                onUpdateManualEntryData({
                  ...manualEntryData,
                  straightness: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className='col-span-3'
              placeholder='Điểm thẳng hàng (0-10)'
            />
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={handleClose}>
            Hủy
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !manualEntryData.ho_ten.trim() || !manualEntryData.mssv.trim()}
          >
            {isSaving ? 'Đang lưu...' : 'Thêm kết quả'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
