import React, { useState } from 'react'
import ClassList from '../../components/ClassList/ClassList'
import StudentList from '../../components/StudentList/StudentList'
import './Dashboard.css'

interface Student {
  id: string
  name: string
  studentId: string
  email: string
  phone: string
  major: string
  gpa: number
  status: 'active' | 'inactive'
}

interface Class {
  id: string
  name: string
  subject: string
  semester: string
  students: Student[]
}

// Mock data
const mockClasses: Class[] = [
  {
    id: '1',
    name: 'Lập trình Web1231233',
    subject: 'CNTT101',
    semester: '2024-1',
    students: [
      {
        id: '1',
        name: 'Nguyễn Văn A',
        studentId: 'SV001',
        email: 'nguyenvana@email.com',
        phone: '0123456789',
        major: 'Công nghệ thông tin',
        gpa: 3.5,
        status: 'active',
      },
      {
        id: '2',
        name: 'Trần Thị B',
        studentId: 'SV002',
        email: 'tranthib@email.com',
        phone: '0987654321',
        major: 'Công nghệ thông tin',
        gpa: 3.8,
        status: 'active',
      },
      {
        id: '3',
        name: 'Lê Văn C',
        studentId: 'SV003',
        email: 'levanc@email.com',
        phone: '0111111111',
        major: 'Công nghệ thông tin',
        gpa: 2.9,
        status: 'active',
      },
    ],
  },
  {
    id: '2',
    name: 'Cơ sở dữ liệu',
    subject: 'CNTT102',
    semester: '2024-1',
    students: [
      {
        id: '4',
        name: 'Phạm Thị D',
        studentId: 'SV004',
        email: 'phamthid@email.com',
        phone: '0222222222',
        major: 'Công nghệ thông tin',
        gpa: 3.2,
        status: 'active',
      },
      {
        id: '5',
        name: 'Hoàng Văn EHHU',
        studentId: 'SV005',
        email: 'hoangvane@email.com',
        phone: '0333333333',
        major: 'Công nghệ thông tin',
        gpa: 3.7,
        status: 'active',
      },
    ],
  },
  {
    id: '3',
    name: 'Thuật toán',
    subject: 'CNTT103',
    semester: '2024-1',
    students: [
      {
        id: '6',
        name: 'Đỗ Thị F',
        studentId: 'SV006',
        email: 'dothif@email.com',
        phone: '0444444444',
        major: 'Công nghệ thông tin',
        gpa: 3.9,
        status: 'active',
      },
    ],
  },
  {
    id: '4',
    name: 'Thuật toán',
    subject: 'CNTT103',
    semester: '2024-1',
    students: [
      {
        id: '6',
        name: 'Đỗ Thị F',
        studentId: 'SV006',
        email: 'dothif@email.com',
        phone: '0444444444',
        major: 'Công nghệ thông tin',
        gpa: 3.9,
        status: 'active',
      },
    ],
  },
  {
    id: '5',
    name: 'Thuật toán123',
    subject: 'CNTT103',
    semester: '2024-1',
    students: [
      {
        id: '6',
        name: 'Đỗ Thị F',
        studentId: 'SV006',
        email: 'dothif@email.com',
        phone: '0444444444',
        major: 'Công nghệ thông tin',
        gpa: 3.9,
        status: 'active',
      },
    ],
  },
  {
    id: '6',
    name: 'Thuật toánsjsj',
    subject: 'CNTT103',
    semester: '2024-1',
    students: [
      {
        id: '6',
        name: 'Đỗ Thị F123',
        studentId: 'SV006',
        email: 'dothif@email.com',
        phone: '0444444444',
        major: 'Công nghệ thông tin',
        gpa: 3.9,
        status: 'active',
      },
    ],
  },
]

interface DashboardProps {
  onLogout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [classes] = useState<Class[]>(mockClasses)

  const handleClassSelect = (classItem: Class) => {
    setSelectedClass(classItem)
  }

  const handleBackToClasses = () => {
    setSelectedClass(null)
  }

  return (
    <div className='dashboard'>
      <header className='dashboard-header'>
        <h1>🏫 Hệ thống quản lý sinh viên</h1>
        <div className='user-info'>
          <span>Chào mừng, Giảng viên</span>
          <button className='logout-btn' onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className='dashboard-content'>
        {!selectedClass ? (
          <ClassList classes={classes} onClassSelect={handleClassSelect} />
        ) : (
          <StudentList classInfo={selectedClass} onBack={handleBackToClasses} />
        )}
      </main>
    </div>
  )
}

export default Dashboard
