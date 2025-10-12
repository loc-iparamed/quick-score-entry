import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react'

interface ScanResult {
  ho_ten: string
  mssv: string
  diem: number
  create_at: string
  id: string
}

interface ScanResultsTableProps {
  selectedClassId: string
  selectedExamId: string
  scanResults: ScanResult[]
  scanLoading: boolean
  isSaving: boolean
  onEditScanResult: (result: ScanResult) => void
  onDeleteScanResult: (id: string) => void
  onSaveScores: () => void
  onManualEntry: () => void
}

export const ScanResultsTable = ({
  selectedClassId,
  selectedExamId,
  scanResults,
  scanLoading,
  isSaving,
  onEditScanResult,
  onDeleteScanResult,
  onSaveScores,
  onManualEntry,
}: ScanResultsTableProps) => {
  return (
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
                <span className='text-blue-700 font-medium'>Có {scanResults.length} kết quả scan sẵn sàng để lưu</span>
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
                          onClick={() => onEditScanResult(result)}
                          className='h-8 w-8 p-0 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-sm'
                          title='Chỉnh sửa'
                        >
                          <Edit className='h-3.5 w-3.5 text-blue-600' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => onDeleteScanResult(result.id || '')}
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
          onClick={onManualEntry}
          variant='outline'
          className='border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700 font-semibold px-6 py-3 shadow-sm hover:shadow-md transition-all duration-300'
        >
          <div className='flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            Nhập tay
          </div>
        </Button>
        <Button
          onClick={onSaveScores}
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
  )
}
