import React, { useEffect, useState } from 'react'
import { GraduationCap, BookOpen, Users, TrendingUp } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
  targetPage: string
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, targetPage }) => {
  const [progress, setProgress] = useState(0)
  const [currentIcon, setCurrentIcon] = useState(0)

  const icons = [
    { Icon: GraduationCap, color: 'text-blue-500', bgColor: 'bg-blue-500' },
    { Icon: BookOpen, color: 'text-green-500', bgColor: 'bg-green-500' },
    { Icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-500' },
    { Icon: TrendingUp, color: 'text-orange-500', bgColor: 'bg-orange-500' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 150)
          return 100
        }
        return Math.min(prev + 4, 100)
      })
    }, 40)

    const iconInterval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % icons.length)
    }, 550)

    return () => {
      clearInterval(interval)
      clearInterval(iconInterval)
    }
  }, [onComplete, icons.length])

  const getPageTitle = () => {
    switch (targetPage) {
      case 'score-entry':
        return 'Tiến hành nhập điểm'
      case 'students':
        return 'Quản lý sinh viên'
      case 'management':
        return 'Quản lý hệ thống'
      default:
        return 'Đang tải...'
    }
  }

  const { Icon, bgColor } = icons[currentIcon]

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
      {}
      <div className='absolute inset-0 overflow-hidden'>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className='absolute w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-pulse'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {}
      <div className='relative z-10 text-center space-y-8'>
        {}
        <div className='relative mx-auto w-24 h-24'>
          <div
            className={`absolute inset-0 ${bgColor} rounded-2xl shadow-2xl transform rotate-45 animate-spin-slow`}
          ></div>
          <div className={`absolute inset-2 ${bgColor} rounded-xl shadow-lg transform -rotate-12 animate-pulse`}></div>
          <div className='absolute inset-0 flex items-center justify-center'>
            <Icon className={`w-10 h-10 text-white transform -rotate-45 animate-bounce`} />
          </div>

          {}
          <div className='absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping'></div>
          <div className='absolute -bottom-1 -left-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse'></div>
        </div>

        {}
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in'>
            {getPageTitle()}
          </h1>
          <p className='text-slate-600 animate-fade-in-delayed'>Đang chuẩn bị...</p>
        </div>

        {}
        <div className='w-64 mx-auto space-y-3'>
          <div className='w-full bg-slate-200 rounded-full h-2 overflow-hidden'>
            <div
              className='h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-300 ease-out'
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className='text-sm text-slate-500'>{progress}%</p>
        </div>

        {}
        <div className='flex justify-center space-x-2'>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>

      {}
      <div className='absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 pointer-events-none'></div>
    </div>
  )
}

export default SplashScreen
