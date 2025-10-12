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

interface EditScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingScanResult: {
    id: string
    ho_ten: string
    mssv: string
    diem: number
    create_at: string
  } | null
  onUpdateScanResult: (result: { id: string; ho_ten: string; mssv: string; diem: number; create_at: string }) => void
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
  const handleClose = () => {
    onOpenChange(false)
    onUpdateScanResult({
      id: '',
      ho_ten: '',
      mssv: '',
      diem: 0,
      create_at: '',
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
              onChange={e =>
                onUpdateScanResult({
                  ...editingScanResult!,
                  mssv: e.target.value,
                })
              }
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
                onUpdateScanResult({
                  ...editingScanResult!,
                  diem: parseFloat(e.target.value) || 0,
                })
              }
              className='col-span-3'
              placeholder='Nhập điểm (0-10)'
            />
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={handleClose}>
            Hủy
          </Button>
          <Button
            onClick={onSave}
            disabled={isUpdating || !editingScanResult?.ho_ten.trim() || !editingScanResult?.mssv.trim()}
          >
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
