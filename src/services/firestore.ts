import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  writeBatch,
} from 'firebase/firestore'
import { ref, onValue, off, update, remove } from 'firebase/database'
import { db, realtimeDB } from '../firebase-config'
import type {
  User,
  Class,
  Student,
  Enrollment,
  Exam,
  Submission,
  CreateUserData,
  CreateClassData,
  CreateStudentData,
  CreateEnrollmentData,
  CreateExamData,
  CreateSubmissionData,
  ClassFilter,
  EnrollmentFilter,
  ExamFilter,
  SubmissionFilter,
  ScannerStatus,
} from '../types'

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  STUDENTS: 'students',
  ENROLLMENTS: 'enrollments',
  EXAMS: 'exams',
  SUBMISSIONS: 'submissions',
} as const

// Internal function to delete submissions by studentId
const deleteSubmissionsByStudentId = async (studentId: string): Promise<void> => {
  const q = query(collection(db, COLLECTIONS.SUBMISSIONS), where('studentId', '==', studentId))
  const querySnapshot = await getDocs(q)

  const batch = writeBatch(db)
  querySnapshot.docs.forEach(doc => {
    batch.delete(doc.ref)
  })

  if (querySnapshot.docs.length > 0) {
    await batch.commit()
  }
}

// ============== USER SERVICES ==============
export const userService = {
  // Get all teachers
  async getAll(): Promise<User[]> {
    const querySnapshot = await getDocs(query(collection(db, COLLECTIONS.USERS), where('role', '==', 'teacher')))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[]
  },

  // Get user by ID
  async getById(id: string): Promise<User | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.USERS, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as User
  },

  // Create new teacher
  async create(data: CreateUserData): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
      ...data,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  },

  // Update teacher
  async update(id: string, data: Partial<CreateUserData>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.USERS, id), data)
  },

  // Delete teacher
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.USERS, id))
  },
}

// ============== CLASS SERVICES ==============
export const classService = {
  // Get all classes with optional filter
  async getAll(filter?: ClassFilter): Promise<Class[]> {
    let q = query(collection(db, COLLECTIONS.CLASSES), orderBy('createdAt', 'desc'))

    if (filter?.teacherId) {
      q = query(q, where('teacherId', '==', filter.teacherId))
    }
    if (filter?.semester) {
      q = query(q, where('semester', '==', filter.semester))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Class[]
  },

  // Get class by ID
  async getById(id: string): Promise<Class | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.CLASSES, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as Class
  },

  // Create new class
  async create(data: CreateClassData): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.CLASSES), {
      ...data,
      studentCount: 0,
      examCount: 0,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  },

  // Update class
  async update(id: string, data: Partial<CreateClassData>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.CLASSES, id), data)
  },

  // Delete class
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.CLASSES, id))
  },

  // Update student count
  async updateStudentCount(classId: string, incrementValue: number): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.CLASSES, classId), {
      studentCount: increment(incrementValue),
    })
  },

  // Update exam count
  async updateExamCount(classId: string, incrementValue: number): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.CLASSES, classId), {
      examCount: increment(incrementValue),
    })
  },
}

// ============== STUDENT SERVICES ==============
export const studentService = {
  // Get all students
  async getAll(): Promise<Student[]> {
    const q = query(collection(db, COLLECTIONS.STUDENTS), orderBy('fullName'))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[]
  },

  // Get student by ID
  async getById(id: string): Promise<Student | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.STUDENTS, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as Student
  },

  // Get student by MSSV
  async getByMSSV(mssv: string): Promise<Student | null> {
    const q = query(collection(db, COLLECTIONS.STUDENTS), where('mssv', '==', mssv))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) return null
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Student
  },

  // Create new student
  async create(data: CreateStudentData): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.STUDENTS), {
      ...data,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  },

  // Update student
  async update(id: string, data: Partial<CreateStudentData>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.STUDENTS, id), data)
  },

  // Delete student
  async delete(id: string): Promise<void> {
    // First delete all submissions for this student
    await deleteSubmissionsByStudentId(id)

    const batch = writeBatch(db)

    // Delete student
    batch.delete(doc(db, COLLECTIONS.STUDENTS, id))

    // Get all enrollments for this student
    const enrollmentsQuery = query(collection(db, COLLECTIONS.ENROLLMENTS), where('studentId', '==', id))
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

    // Delete all enrollments and update class student counts
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data() as Enrollment
      batch.delete(enrollmentDoc.ref)

      // Update class student count
      const classRef = doc(db, COLLECTIONS.CLASSES, enrollmentData.classId)
      batch.update(classRef, {
        studentCount: increment(-1),
      })
    }

    await batch.commit()
  },
}

// ============== ENROLLMENT SERVICES ==============
export const enrollmentService = {
  // Get all enrollments with optional filter
  async getAll(filter?: EnrollmentFilter): Promise<Enrollment[]> {
    let q = query(collection(db, COLLECTIONS.ENROLLMENTS), orderBy('joinedAt', 'desc'))

    if (filter?.classId) {
      q = query(q, where('classId', '==', filter.classId))
    }
    if (filter?.studentId) {
      q = query(q, where('studentId', '==', filter.studentId))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Enrollment[]
  },

  // Create new enrollment
  async create(data: CreateEnrollmentData): Promise<string> {
    const batch = writeBatch(db)

    // Add enrollment
    const enrollmentRef = doc(collection(db, COLLECTIONS.ENROLLMENTS))
    batch.set(enrollmentRef, {
      ...data,
      joinedAt: Timestamp.now(),
    })

    // Update class student count
    const classRef = doc(db, COLLECTIONS.CLASSES, data.classId)
    batch.update(classRef, {
      studentCount: increment(1),
    })

    await batch.commit()
    return enrollmentRef.id
  },

  // Delete enrollment
  async delete(id: string): Promise<void> {
    const enrollmentDoc = await getDoc(doc(db, COLLECTIONS.ENROLLMENTS, id))
    if (!enrollmentDoc.exists()) throw new Error('Enrollment not found')

    const enrollmentData = enrollmentDoc.data() as Enrollment
    const batch = writeBatch(db)

    // Delete enrollment
    batch.delete(doc(db, COLLECTIONS.ENROLLMENTS, id))

    // Update class student count
    const classRef = doc(db, COLLECTIONS.CLASSES, enrollmentData.classId)
    batch.update(classRef, {
      studentCount: increment(-1),
    })

    await batch.commit()
  },
}

// ============== EXAM SERVICES ==============
export const examService = {
  // Get all exams with optional filter
  async getAll(filter?: ExamFilter): Promise<Exam[]> {
    let q = query(collection(db, COLLECTIONS.EXAMS), orderBy('date', 'desc'))

    if (filter?.classId) {
      q = query(q, where('classId', '==', filter.classId))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Exam[]
  },

  // Get exam by ID
  async getById(id: string): Promise<Exam | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.EXAMS, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as Exam
  },

  // Create new exam
  async create(data: CreateExamData): Promise<string> {
    const batch = writeBatch(db)

    // Add exam
    const examRef = doc(collection(db, COLLECTIONS.EXAMS))
    batch.set(examRef, {
      ...data,
      date: Timestamp.fromDate(new Date(data.date)),
      updatedAt: Timestamp.now(),
    })

    // Update class exam count
    const classRef = doc(db, COLLECTIONS.CLASSES, data.classId)
    batch.update(classRef, {
      examCount: increment(1),
    })

    await batch.commit()
    return examRef.id
  },

  // Update exam
  async update(id: string, data: Partial<Omit<CreateExamData, 'date'> & { date?: Timestamp }>): Promise<void> {
    const updateData: Record<string, unknown> = { ...data }
    if ('date' in data && typeof data.date === 'string') {
      updateData.date = Timestamp.fromDate(new Date(data.date))
    }
    await updateDoc(doc(db, COLLECTIONS.EXAMS, id), {
      ...updateData,
      updatedAt: Timestamp.now(),
    })
  },

  // Delete exam
  async delete(id: string): Promise<void> {
    const examDoc = await getDoc(doc(db, COLLECTIONS.EXAMS, id))
    if (!examDoc.exists()) throw new Error('Exam not found')

    const examData = examDoc.data() as Exam
    const batch = writeBatch(db)

    // Delete exam
    batch.delete(doc(db, COLLECTIONS.EXAMS, id))

    // Update class exam count
    const classRef = doc(db, COLLECTIONS.CLASSES, examData.classId)
    batch.update(classRef, {
      examCount: increment(-1),
    })

    await batch.commit()
  },
}

// ============== SUBMISSION SERVICES ==============
export const submissionService = {
  // Get all submissions with optional filter
  async getAll(filter?: SubmissionFilter): Promise<Submission[]> {
    let q = query(collection(db, COLLECTIONS.SUBMISSIONS), orderBy('extractedAt', 'desc'))

    if (filter?.examId) {
      q = query(q, where('examId', '==', filter.examId))
    }
    if (filter?.classId) {
      q = query(q, where('classId', '==', filter.classId))
    }
    if (filter?.studentId) {
      q = query(q, where('studentId', '==', filter.studentId))
    }
    if (filter?.status) {
      q = query(q, where('status', '==', filter.status))
    }
    if (filter?.verified !== undefined) {
      q = query(q, where('verified', '==', filter.verified))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Submission[]
  },

  // Get submission by ID
  async getById(id: string): Promise<Submission | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.SUBMISSIONS, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as Submission
  },

  // Create new submission
  async create(data: CreateSubmissionData): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.SUBMISSIONS), {
      ...data,
      verified: false,
      status: 'pending' as const,
      extractedAt: Timestamp.now(),
    })
    return docRef.id
  },

  // Update submission
  async update(id: string, data: Partial<Submission>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.SUBMISSIONS, id), data)
  },

  // Delete submission
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.SUBMISSIONS, id))
  },

  // Verify submission
  async verify(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.SUBMISSIONS, id), {
      verified: true,
      status: 'verified',
    })
  },

  // Update score
  async updateScore(id: string, score: number): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.SUBMISSIONS, id), {
      score,
    })
  },
}

// ============== SCANNER SERVICES ==============
export const scannerService = {
  async getStatus(): Promise<ScannerStatus> {
    try {
      const statusRef = doc(db, 'system', 'scanner-status')
      const snapshot = await getDoc(statusRef)

      if (!snapshot.exists()) {
        return { online: false }
      }

      const data = snapshot.data() as Partial<ScannerStatus> & { online?: boolean }
      return {
        online: Boolean(data.online),
        lastHeartbeat: data.lastHeartbeat,
      }
    } catch (err) {
      console.error('scannerService.getStatus error', err)
      return { online: false }
    }
  },

  getScanResults(
    classId: string,
    examId: string,
    callback: (data: Array<{ ho_ten: string; mssv: string; diem: number; create_at: string }>) => void,
  ): () => void {
    try {
      // Validate inputs to avoid invalid characters
      const sanitizedClassId = classId.replace(/[.#$[\]]/g, '_')
      const sanitizedExamId = examId.replace(/[.#$[\]]/g, '_')

      const path = `scan_results/${sanitizedClassId}/${sanitizedExamId}`

      const resultsRef = ref(realtimeDB, path)

      const listener = onValue(
        resultsRef,
        snapshot => {
          try {
            if (snapshot.exists()) {
              const data = snapshot.val()

              const resultsArray = Object.keys(data).map(key => ({
                ho_ten: data[key].ho_ten || '',
                mssv: data[key].mssv || '',
                diem: data[key].diem || 0,
                create_at: data[key].create_at || new Date().toISOString(),
                id: key,
              }))

              callback(resultsArray)
            } else {
              callback([])
            }
          } catch (err) {
            console.error('🔥 Error processing scan results:', err)
            callback([])
          }
        },
        error => {
          console.error('🔥 Firebase listener error:', error)
          callback([])
        },
      )

      return () => {
        off(resultsRef, 'value', listener)
      }
    } catch (err) {
      console.error('🔥 Error setting up scan results listener:', err)
      return () => {}
    }
  },

  // Phương thức để lắng nghe dữ liệu từ root (cho Python test)
  getScanResultsFromRoot(
    callback: (
      data: Array<{
        ho_ten: string
        mssv: string
        diem: number | null
        create_at: string
        id: string
        image_data?: string
      }>,
    ) => void,
  ): () => void {
    try {
      const resultsRef = ref(realtimeDB, 'exam_results')

      const listener = onValue(
        resultsRef,
        snapshot => {
          try {
            if (snapshot.exists()) {
              const data = snapshot.val()

              const resultsArray = Object.keys(data)
                .map(key => {
                  const item = data[key]
                  return {
                    ho_ten: item.fullName || '',
                    mssv: item.studentId || '',
                    diem: item.score ? parseFloat(item.score) : null,
                    create_at: item.timestamp || new Date().toISOString(),
                    id: key,
                    image_data: item.image_data || null,
                  }
                })
                .filter(item => item.id) // Chỉ cần có ID là đủ

              callback(resultsArray)
            } else {
              callback([])
            }
          } catch (err) {
            console.error('🔥 Error processing ROOT scan results:', err)
            callback([])
          }
        },
        error => {
          console.error('🔥 Firebase ROOT listener error:', error)
          callback([])
        },
      )

      return () => {
        off(resultsRef, 'value', listener)
      }
    } catch (err) {
      console.error('🔥 Error setting up ROOT scan results listener:', err)
      return () => {}
    }
  },

  // Update scan result in Realtime Database (không thay đổi timestamp)
  async updateScanResult(id: string, data: { ho_ten: string; mssv: string; diem: number }): Promise<void> {
    try {
      const resultRef = ref(realtimeDB, `exam_results/${id}`)
      await update(resultRef, {
        fullName: data.ho_ten,
        studentId: data.mssv,
        score: data.diem,
        // Không cập nhật timestamp để giữ nguyên thời gian scan gốc
      })
    } catch (err) {
      console.error('🔥 Error updating scan result:', err)
      throw err
    }
  },

  // Delete scan result from Realtime Database
  async deleteScanResult(id: string): Promise<void> {
    try {
      const resultRef = ref(realtimeDB, `exam_results/${id}`)
      await remove(resultRef)
    } catch (err) {
      console.error('🔥 Error deleting scan result:', err)
      throw err
    }
  },

  // Clear all scan results from Realtime Database
  async clearAllScanResults(): Promise<void> {
    try {
      const rootRef = ref(realtimeDB, 'exam_results')
      await remove(rootRef)
    } catch (err) {
      console.error('🔥 Error clearing all scan results:', err)
      throw err
    }
  },

  // Add manual scan result to Realtime Database
  async addManualScanResult(data: { ho_ten: string; mssv: string; diem: number }): Promise<void> {
    try {
      const resultRef = ref(realtimeDB, `exam_results/${Date.now()}_${data.mssv}`)
      await update(resultRef, {
        fullName: data.ho_ten,
        studentId: data.mssv,
        score: data.diem,
        timestamp: new Date().toISOString(),
        image_data: null,
      })
    } catch (err) {
      console.error('🔥 Error adding manual scan result:', err)
      throw err
    }
  },
}
