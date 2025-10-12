import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Notebook } from 'lucide-react'

export const ScoreEntryHeader = () => {
  return (
    <div className='flex flex-col gap-4'>
      <Link to='/' className='self-start'>
        <Button variant='outline' className='flex items-center gap-2 hover:bg-gray-50'>
          <ArrowLeft className='h-4 w-4' />
          Quay về Dashboard
        </Button>
      </Link>

      <Card className='border-0 shadow-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white'>
        <CardHeader className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shadow-lg'>
              <Notebook className='h-6 w-6 text-white' />
            </div>
            <div>
              <CardTitle className='text-2xl font-bold text-white'>Nhập điểm bài kiểm tra</CardTitle>
              <CardDescription className='text-blue-100'>
                Chọn lớp, bài kiểm tra và theo dõi máy scan trước khi nhập điểm
              </CardDescription>
            </div>
          </div>
          <div className='flex items-center gap-3 text-sm text-blue-100/90'>
            <div className='flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full shadow-sm'>
              <span className='h-2 w-2 rounded-full bg-emerald-300 animate-pulse'></span>
              <span>Sẵn sàng thao tác</span>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
