import { Timestamp } from 'firebase/firestore'

// User Interface (Teacher)
export interface User {
  id: string
  fullName: string
  email: string
  role: 'teacher'
  createdAt: Timestamp
}

// Class Interface
export interface Class {
  id: string
  name: string
  semester: string
  teacherId: string
  studentCount: number
  examCount: number
  createdAt: Timestamp
}

// Student Interface
export interface Student {
  id: string
  mssv: string
  fullName: string
  email: string
  createdAt: Timestamp
}

// Enrollment Interface (Bảng nối lớp học - sinh viên)
export interface Enrollment {
  id: string
  classId: string
  studentId: string
  joinedAt: Timestamp
}

// Exam Interface
export interface Exam {
  id: string
  classId: string
  name: string
  date: Timestamp
  maxScore: number
  templatePdfPath?: string
}

// Submission Interface
export interface Submission {
  id: string
  examId: string
  classId: string
  studentId: string
  fullName: string
  score: number
  contentSummary: string
  verified: boolean
  status: 'pending' | 'verified' | 'exported'
  extractedAt: Timestamp
  sourceImagePath?: string
  filledPdfPath?: string
  ocrRaw?: Record<string, unknown>
}

// Form Data Types (để tạo mới)
export interface CreateUserData {
  fullName: string
  email: string
  role: 'teacher'
}

export interface CreateClassData {
  name: string
  semester: string
  teacherId: string
}

export interface CreateStudentData {
  mssv: string
  fullName: string
}

export interface CreateEnrollmentData {
  classId: string
  studentId: string
}

export interface CreateExamData {
  classId: string
  name: string
  date: string
  maxScore: number
}

export interface CreateSubmissionData {
  examId: string
  classId: string
  studentId: string
  fullName: string
  score: number
  contentSummary: string
}

// Filter & Search Types
export interface ClassFilter {
  teacherId?: string
  semester?: string
}

export interface EnrollmentFilter {
  classId?: string
  studentId?: string
}

export interface ExamFilter {
  classId?: string
}

export interface SubmissionFilter {
  examId?: string
  classId?: string
  studentId?: string
  status?: 'pending' | 'verified' | 'exported'
  verified?: boolean
}

export interface ScannerStatus {
  online: boolean
  lastHeartbeat?: Timestamp
}
