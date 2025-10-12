import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center p-4'>
          <div className='max-w-md w-full'>
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertTitle>Đã xảy ra lỗi</AlertTitle>
              <AlertDescription className='mt-2'>
                <p className='mb-4'>Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.</p>
                {import.meta.env.DEV && this.state.error && (
                  <details className='mt-2'>
                    <summary className='cursor-pointer text-sm font-medium'>
                      Chi tiết lỗi (chỉ hiển thị trong development)
                    </summary>
                    <pre className='mt-2 text-xs bg-muted p-2 rounded overflow-auto'>{this.state.error.message}</pre>
                  </details>
                )}
                <Button onClick={this.handleRetry} className='mt-4 w-full' variant='outline'>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
