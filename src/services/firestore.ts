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

export type RealtimeScanResultPayload = {
  fullName?: string
  studentId?: string
  score?: number
  timestamp?: string
  image_data?: string | null
  clarity?: number
  spacing?: number
  straightness?: number
}

const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  STUDENTS: 'students',
  ENROLLMENTS: 'enrollments',
  EXAMS: 'exams',
  SUBMISSIONS: 'submissions',
} as const

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

export const userService = {
  async getAll(): Promise<User[]> {
    const querySnapshot = await getDocs(query(collection(db, COLLECTIONS.USERS), where('role', '==', 'teacher')))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[]
  },

  async getById(id: string): Promise<User | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.USERS, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as User
  },

  async create(data: CreateUserData): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
      ...data,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  },

  async update(id: string, data: Partial<CreateUserData>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.USERS, id), data)
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.USERS, id))
  },
}

export const classService = {
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

  async getById(id: string): Promise<Class | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.CLASSES, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as Class
  },

  async create(data: CreateClassData): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.CLASSES), {
      ...data,
      studentCount: 0,
      examCount: 0,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  },

  async update(id: string, data: Partial<CreateClassData>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.CLASSES, id), data)
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.CLASSES, id))
  },

  async updateStudentCount(classId: string, incrementValue: number): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.CLASSES, classId), {
      studentCount: increment(incrementValue),
    })
  },

  async updateExamCount(classId: string, incrementValue: number): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.CLASSES, classId), {
      examCount: increment(incrementValue),
    })
  },
}

export const studentService = {
  async getAll(): Promise<Student[]> {
    const q = query(collection(db, COLLECTIONS.STUDENTS), orderBy('fullName'))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[]
  },

  async getById(id: string): Promise<Student | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.STUDENTS, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as Student
  },

  async getByMSSV(mssv: string): Promise<Student | null> {
    const q = query(collection(db, COLLECTIONS.STUDENTS), where('mssv', '==', mssv))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) return null
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Student
  },

  async create(data: CreateStudentData): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.STUDENTS), {
      ...data,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  },

  async update(id: string, data: Partial<CreateStudentData>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.STUDENTS, id), data)
  },

  async delete(id: string): Promise<void> {
    await deleteSubmissionsByStudentId(id)

    const batch = writeBatch(db)

    batch.delete(doc(db, COLLECTIONS.STUDENTS, id))

    const enrollmentsQuery = query(collection(db, COLLECTIONS.ENROLLMENTS), where('studentId', '==', id))
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data() as Enrollment
      batch.delete(enrollmentDoc.ref)

      const classRef = doc(db, COLLECTIONS.CLASSES, enrollmentData.classId)
      batch.update(classRef, {
        studentCount: increment(-1),
      })
    }

    await batch.commit()
  },
}

export const enrollmentService = {
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

  async create(data: CreateEnrollmentData): Promise<string> {
    const batch = writeBatch(db)

    const enrollmentRef = doc(collection(db, COLLECTIONS.ENROLLMENTS))
    batch.set(enrollmentRef, {
      ...data,
      joinedAt: Timestamp.now(),
    })

    const classRef = doc(db, COLLECTIONS.CLASSES, data.classId)
    batch.update(classRef, {
      studentCount: increment(1),
    })

    await batch.commit()
    return enrollmentRef.id
  },

  async delete(id: string): Promise<void> {
    const enrollmentDoc = await getDoc(doc(db, COLLECTIONS.ENROLLMENTS, id))
    if (!enrollmentDoc.exists()) throw new Error('Enrollment not found')

    const enrollmentData = enrollmentDoc.data() as Enrollment
    const batch = writeBatch(db)

    batch.delete(doc(db, COLLECTIONS.ENROLLMENTS, id))

    const classRef = doc(db, COLLECTIONS.CLASSES, enrollmentData.classId)
    batch.update(classRef, {
      studentCount: increment(-1),
    })

    await batch.commit()
  },
}

export const examService = {
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

  async getById(id: string): Promise<Exam | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.EXAMS, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as Exam
  },

  async create(data: CreateExamData): Promise<string> {
    const batch = writeBatch(db)

    const examRef = doc(collection(db, COLLECTIONS.EXAMS))
    batch.set(examRef, {
      ...data,
      date: Timestamp.fromDate(new Date(data.date)),
      updatedAt: Timestamp.now(),
    })

    const classRef = doc(db, COLLECTIONS.CLASSES, data.classId)
    batch.update(classRef, {
      examCount: increment(1),
    })

    await batch.commit()
    return examRef.id
  },

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

  async delete(id: string): Promise<void> {
    const examDoc = await getDoc(doc(db, COLLECTIONS.EXAMS, id))
    if (!examDoc.exists()) throw new Error('Exam not found')

    const examData = examDoc.data() as Exam
    const batch = writeBatch(db)

    batch.delete(doc(db, COLLECTIONS.EXAMS, id))

    const classRef = doc(db, COLLECTIONS.CLASSES, examData.classId)
    batch.update(classRef, {
      examCount: increment(-1),
    })

    await batch.commit()
  },
}

export const submissionService = {
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

  async getById(id: string): Promise<Submission | null> {
    const docSnapshot = await getDoc(doc(db, COLLECTIONS.SUBMISSIONS, id))
    if (!docSnapshot.exists()) return null
    return { id: docSnapshot.id, ...docSnapshot.data() } as Submission
  },

  async create(data: CreateSubmissionData): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.SUBMISSIONS), {
      ...data,
      verified: false,
      status: 'pending' as const,
      extractedAt: Timestamp.now(),
    })
    return docRef.id
  },

  async update(id: string, data: Partial<Submission>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.SUBMISSIONS, id), data)
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.SUBMISSIONS, id))
  },

  async verify(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.SUBMISSIONS, id), {
      verified: true,
      status: 'verified',
    })
  },

  async updateScore(id: string, score: number): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.SUBMISSIONS, id), {
      score,
    })
  },
}

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

  getScanResultsFromRoot(
    callback: (
      data: Array<{
        ho_ten: string
        mssv: string
        diem: number | null
        create_at: string
        id: string
        image_data?: string
        clarity?: number
        spacing?: number
        straightness?: number
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
                    clarity: item.clarity ? parseFloat(item.clarity) : undefined,
                    spacing: item.spacing ? parseFloat(item.spacing) : undefined,
                    straightness: item.straightness ? parseFloat(item.straightness) : undefined,
                  }
                })
                .filter(item => item.id)

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

  async updateScanResult(
    id: string,
    data: { ho_ten: string; mssv: string; diem: number; clarity?: number; spacing?: number; straightness?: number },
  ): Promise<void> {
    try {
      const resultRef = ref(realtimeDB, `exam_results/${id}`)
      const payload: RealtimeScanResultPayload = {
        fullName: data.ho_ten,
        studentId: data.mssv,
        score: data.diem,
      }

      if (data.clarity !== undefined) payload.clarity = data.clarity
      if (data.spacing !== undefined) payload.spacing = data.spacing
      if (data.straightness !== undefined) payload.straightness = data.straightness

      await update(resultRef, payload)
    } catch (err) {
      console.error('🔥 Error updating scan result:', err)
      throw err
    }
  },

  async deleteScanResult(id: string): Promise<void> {
    try {
      const resultRef = ref(realtimeDB, `exam_results/${id}`)
      await remove(resultRef)
    } catch (err) {
      console.error('🔥 Error deleting scan result:', err)
      throw err
    }
  },

  async clearAllScanResults(): Promise<void> {
    try {
      const rootRef = ref(realtimeDB, 'exam_results')
      await remove(rootRef)
    } catch (err) {
      console.error('🔥 Error clearing all scan results:', err)
      throw err
    }
  },

  async addManualScanResult(data: {
    ho_ten: string
    mssv: string
    diem: number
    clarity?: number
    spacing?: number
    straightness?: number
  }): Promise<void> {
    try {
      const resultRef = ref(realtimeDB, `exam_results/${Date.now()}_${data.mssv}`)
      const payload: RealtimeScanResultPayload = {
        fullName: data.ho_ten,
        studentId: data.mssv,
        score: data.diem,
        timestamp: new Date().toISOString(),
        image_data: null,
      }

      if (data.clarity !== undefined) payload.clarity = data.clarity
      if (data.spacing !== undefined) payload.spacing = data.spacing
      if (data.straightness !== undefined) payload.straightness = data.straightness

      await update(resultRef, payload)
    } catch (err) {
      console.error('🔥 Error adding manual scan result:', err)
      throw err
    }
  },
}
