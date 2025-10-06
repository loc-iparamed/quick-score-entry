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

interface ClassListProps {
  classes: Class[]
  onClassSelect: (classItem: Class) => void
}

const ClassList: React.FC<ClassListProps> = ({ classes, onClassSelect }) => {
  return (
    <div className='class-list'>
      <h2>Danh sách lớp học</h2>
      <div className='classes-grid'>
        {classes.map(classItem => (
          <div key={classItem.id} className='class-card' onClick={() => onClassSelect(classItem)}>
            <div className='class-icon'>📚</div>
            <h3>{classItem.name}</h3>
            <p className='subject-code'>{classItem.subject}</p>
            <p className='semester'>{classItem.semester}</p>
            <div className='student-count'>
              <span>{classItem.students.length} sinh viên</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClassList
