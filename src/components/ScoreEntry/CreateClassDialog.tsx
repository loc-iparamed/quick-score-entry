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

interface CreateClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newClassName: string
  onClassNameChange: (name: string) => void
  newClassSemester: string
  onClassSemesterChange: (semester: string) => void
  isCreating: boolean
  onCreate: () => void
}

export const CreateClassDialog = ({
  open,
  onOpenChange,
  newClassName,
  onClassNameChange,
  newClassSemester,
  onClassSemesterChange,
  isCreating,
  onCreate,
}: CreateClassDialogProps) => {
  const handleClose = () => {
    onOpenChange(false)
    onClassNameChange('')
    onClassSemesterChange('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={e => onClassNameChange(e.target.value)}
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
              onChange={e => onClassSemesterChange(e.target.value)}
              className='col-span-3'
              placeholder='Ví dụ: 2024.1'
            />
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={onCreate} disabled={isCreating || !newClassName.trim() || !newClassSemester.trim()}>
            {isCreating ? 'Đang tạo...' : 'Tạo lớp học'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
