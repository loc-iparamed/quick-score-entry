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
import type { Class } from '@/types'

interface CreateExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedClass: Class | null
  newExamName: string
  onExamNameChange: (name: string) => void
  isCreating: boolean
  onCreate: () => void
}

export const CreateExamDialog = ({
  open,
  onOpenChange,
  selectedClass,
  newExamName,
  onExamNameChange,
  isCreating,
  onCreate,
}: CreateExamDialogProps) => {
  const handleClose = () => {
    onOpenChange(false)
    onExamNameChange('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={e => onExamNameChange(e.target.value)}
              className='col-span-3'
              placeholder='Ví dụ: Kiểm tra giữa kỳ'
            />
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={onCreate} disabled={isCreating || !newExamName.trim()}>
            {isCreating ? 'Đang tạo...' : 'Tạo bài kiểm tra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
