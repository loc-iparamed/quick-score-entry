import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react'

interface ScannerStatusCardProps {
  scannerStatus: 'idle' | 'checking' | 'online' | 'offline'
  lastHeartbeat: Date | null
  onRetryScanner: () => void
}

export const ScannerStatusCard = ({ scannerStatus, lastHeartbeat, onRetryScanner }: ScannerStatusCardProps) => {
  return (
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
          onClick={onRetryScanner}
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
  )
}
