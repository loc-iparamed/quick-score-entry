import { Button } from '@/components/ui/button'
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ImagePreviewModalProps {
  isOpen: boolean
  imageData: string | null
  onClose: () => void
}

export const ImagePreviewModal = ({ isOpen, imageData, onClose }: ImagePreviewModalProps) => {
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !imageData) return null

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${imageData}`
    link.download = `bai-thi-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <div
      className='fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[9999] p-4 animate-in fade-in-0 duration-300'
      onClick={handleBackdropClick}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className='relative max-w-[95vw] max-h-[95vh] bg-gradient-to-br from-white via-slate-50/95 to-blue-50/80 rounded-2xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-sm animate-in zoom-in-95 duration-300'>
        <div className='flex items-center justify-between p-6 border-b border-slate-200/60 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 backdrop-blur-sm'>
          <div className='flex items-center gap-4'>
            <h3 className='text-2xl font-bold text-slate-800'>Ảnh bài thi đã scan</h3>
            <div className='flex items-center gap-2 px-3 py-1 bg-white/60 rounded-full border border-slate-200/40'>
              <span className='text-sm text-slate-600'>Zoom: {zoom}%</span>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className='h-9 w-9 p-0 rounded-full bg-white/60 hover:bg-white/80 border-slate-200/60'
              title='Thu nhỏ'
            >
              <ZoomOut className='h-4 w-4' />
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className='h-9 w-9 p-0 rounded-full bg-white/60 hover:bg-white/80 border-slate-200/60'
              title='Phóng to'
            >
              <ZoomIn className='h-4 w-4' />
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={handleDownload}
              className='h-9 w-9 p-0 rounded-full bg-white/60 hover:bg-blue-50 border-slate-200/60 hover:border-blue-200'
              title='Tải xuống'
            >
              <Download className='h-4 w-4' />
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={onClose}
              className='h-9 w-9 p-0 rounded-full bg-white/60 hover:bg-red-50 hover:border-red-200 hover:text-red-600 border-slate-200/60 transition-all duration-200'
              title='Đóng'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <div className='p-6 bg-gradient-to-br from-white/80 to-slate-50/60 overflow-auto max-h-[80vh] flex items-center justify-center'>
          <img
            src={`data:image/jpeg;base64,${imageData}`}
            alt='Ảnh bài thi'
            className='rounded-xl shadow-2xl border border-slate-200/40 transition-transform duration-300 ease-in-out max-w-none'
            style={{
              transform: `scale(${zoom / 100})`,
              maxHeight: '70vh',
              objectFit: 'contain',
            }}
          />
        </div>

        <div className='px-6 py-4 bg-gradient-to-r from-slate-50/80 to-slate-100/60 border-t border-slate-200/60 backdrop-blur-sm'>
          <div className='flex items-center justify-between text-sm text-slate-600'>
            <span>Click vào nền tối hoặc nút ✕ để đóng</span>
            <span>Sử dụng nút zoom hoặc cuộn chuột để phóng to/thu nhỏ</span>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
