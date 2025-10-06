import React from 'react'

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

interface StudentListProps {
  classInfo: Class
  onBack: () => void
}

const StudentList: React.FC<StudentListProps> = ({ classInfo, onBack }) => {
  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.5) return '#27ae60'
    if (gpa >= 3.0) return '#f39c12'
    return '#e74c3c'
  }

  const getStatusColor = (status: 'active' | 'inactive') => {
    return status === 'active' ? '#27ae60' : '#95a5a6'
  }

  return (
    <div className='student-list'>
      <div className='student-list-header'>
        <button className='back-btn' onClick={onBack}>
          ← Quay lại
        </button>
        <div className='class-info'>
          <h2>{classInfo.name}</h2>
          <p>
            {classInfo.subject} - {classInfo.semester}
          </p>
        </div>
      </div>

      <div className='students-table-container'>
        <table className='students-table'>
          <thead>
            <tr>
              <th>Mã SV</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Ngành học</th>
              <th>GPA</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {classInfo.students.map(student => (
              <tr key={student.id}>
                <td className='student-id'>{student.studentId}</td>
                <td className='student-name'>{student.name}</td>
                <td className='student-email'>{student.email}</td>
                <td className='student-phone'>{student.phone}</td>
                <td className='student-major'>{student.major}</td>
                <td className='student-gpa'>
                  <span className='gpa-badge' style={{ backgroundColor: getGpaColor(student.gpa) }}>
                    {student.gpa.toFixed(1)}
                  </span>
                </td>
                <td className='student-status'>
                  <span className='status-badge' style={{ backgroundColor: getStatusColor(student.status) }}>
                    {student.status === 'active' ? 'Đang học' : 'Nghỉ học'}
                  </span>
                </td>
                <td className='student-actions'>
                  <button className='action-btn edit-btn'>✏️</button>
                  <button className='action-btn view-btn'>👁️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='student-stats'>
        <div className='stat-item'>
          <span className='stat-label'>Tổng số sinh viên:</span>
          <span className='stat-value'>{classInfo.students.length}</span>
        </div>
        <div className='stat-item'>
          <span className='stat-label'>Đang học:</span>
          <span className='stat-value'>{classInfo.students.filter(s => s.status === 'active').length}</span>
        </div>
        <div className='stat-item'>
          <span className='stat-label'>GPA trung bình:</span>
          <span className='stat-value'>
            {(classInfo.students.reduce((sum, s) => sum + s.gpa, 0) / classInfo.students.length).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default StudentList
