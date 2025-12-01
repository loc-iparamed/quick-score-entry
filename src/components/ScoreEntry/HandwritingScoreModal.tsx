import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface HandwritingScoreModalProps {
  isOpen: boolean
  onClose: () => void
  clarity?: number
  spacing?: number
  straightness?: number
  studentName?: string
}

export const HandwritingScoreModal = ({
  isOpen,
  onClose,
  clarity,
  spacing,
  straightness,
  studentName,
}: HandwritingScoreModalProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-emerald-500 to-green-500'
    if (score >= 6) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  const getScoreLevel = (score: number) => {
    if (score >= 8) return 'Tốt'
    if (score >= 6) return 'Trung bình'
    return 'Cần cải thiện'
  }

  const hasScores = clarity !== undefined || spacing !== undefined || straightness !== undefined

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px] bg-white'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
            Điểm Viết Tay
          </DialogTitle>
          <DialogDescription className='text-slate-600'>
            {studentName ? `Phân tích chữ viết của ${studentName}` : 'Phân tích chất lượng chữ viết'}
          </DialogDescription>
        </DialogHeader>

        {!hasScores ? (
          <div className='py-12 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center'>
              <div className='w-8 h-8 rounded-full bg-slate-300'></div>
            </div>
            <p className='text-slate-600'>Chưa có dữ liệu điểm viết tay</p>
            <p className='text-sm text-slate-400 mt-2'>Dữ liệu sẽ được cập nhật từ máy scan</p>
          </div>
        ) : (
          <div className='space-y-6 py-4'>
            {clarity !== undefined && (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg'>
                      C
                    </div>
                    <div>
                      <h3 className='font-semibold text-slate-800'>Độ đậm nét (Clarity)</h3>
                      <p className='text-xs text-slate-500'>Mức độ rõ ràng của nét chữ</p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div
                      className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(clarity)} bg-clip-text text-transparent`}
                    >
                      {clarity.toFixed(1)}
                    </div>
                    <div className='text-xs text-slate-500'>{getScoreLevel(clarity)}</div>
                  </div>
                </div>
                <Progress value={clarity * 10} className='h-2' />
              </div>
            )}

            {}
            {spacing !== undefined && (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg'>
                      S
                    </div>
                    <div>
                      <h3 className='font-semibold text-slate-800'>Khoảng cách (Spacing)</h3>
                      <p className='text-xs text-slate-500'>Độ đều của khoảng cách giữa các chữ</p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div
                      className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(spacing)} bg-clip-text text-transparent`}
                    >
                      {spacing.toFixed(1)}
                    </div>
                    <div className='text-xs text-slate-500'>{getScoreLevel(spacing)}</div>
                  </div>
                </div>
                <Progress value={spacing * 10} className='h-2' />
              </div>
            )}

            {}
            {straightness !== undefined && (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold shadow-lg'>
                      L
                    </div>
                    <div>
                      <h3 className='font-semibold text-slate-800'>Độ thẳng hàng (Straightness)</h3>
                      <p className='text-xs text-slate-500'>Mức độ thẳng hàng của các dòng chữ</p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div
                      className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(straightness)} bg-clip-text text-transparent`}
                    >
                      {straightness.toFixed(1)}
                    </div>
                    <div className='text-xs text-slate-500'>{getScoreLevel(straightness)}</div>
                  </div>
                </div>
                <Progress value={straightness * 10} className='h-2' />
              </div>
            )}

            {}
            {hasScores && (
              <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-semibold text-slate-800'>Điểm trung bình viết tay</h4>
                    <p className='text-xs text-slate-500 mt-1'>Tổng hợp 3 tiêu chí</p>
                  </div>
                  <div className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                    {(
                      ((clarity || 0) + (spacing || 0) + (straightness || 0)) /
                      [clarity, spacing, straightness].filter(s => s !== undefined).length
                    ).toFixed(1)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
