// Import các thư viện cần thiết
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Khởi tạo Firebase Admin SDK một lần duy nhất
// Mã này có quyền truy cập cao nhất vào Firebase của bạn
admin.initializeApp()
const db = admin.firestore()

/**
 * ===================================================================
 * ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU (TYPESCRIPT)
 * ===================================================================
 * Giúp code của bạn an toàn hơn bằng cách định nghĩa
 * cấu trúc dữ liệu mà chúng ta mong đợi từ LLM.
 */

interface UpdateScoreArgs {
  studentName: string // Tên sinh viên, ví dụ: "Nguyễn Văn A"
  examName: string // Tên bài thi, ví dụ: "Giữa Kỳ"
  newScore: number // Điểm số mới, ví dụ: 8.5
}

interface GetStudentInfoArgs {
  studentName: string // Tên sinh viên, ví dụ: "Nguyễn Văn A"
  // Bạn có thể mở rộng thêm mssv nếu LLM có thể bóc tách
}

/**
 * ===================================================================
 * HÀM AGENT CHÍNH (HTTP ENDPOINT)
 * ===================================================================
 * Đây là "Agent" sẽ lắng nghe các yêu cầu HTTP từ máy chủ XiaoZhi AI.
 * Nó sẽ được deploy lên một URL công khai.
 */
export const xiaozhiAgent = functions.https.onRequest(async (req, res) => {
  // ---------------------------------------------------------------
  // BƯỚC 1: BẢO MẬT (RẤT QUAN TRỌNG!)
  // ---------------------------------------------------------------
  // Chúng ta yêu cầu máy chủ XiaoZhi AI gửi một "Khóa Bí Mật"
  // trong Header để đảm bảo chỉ nó mới có quyền gọi hàm này.

  // !!! HÃY THAY ĐỔI CHUỖI NÀY THÀNH MỘT KHÓA BÍ MẬT CỦA RIÊNG BẠN !!!
  const MY_SECRET_KEY = '324sadasd-fdg4-23r4-f34g-2345g34fdg34'

  // Kiểm tra xem header "Authorization" có chứa khóa bí mật không
  if (req.headers.authorization !== `Bearer ${MY_SECRET_KEY}`) {
    console.warn('Cuộc gọi không hợp lệ! Khóa bí mật không đúng hoặc bị thiếu.')
    // Trả về lỗi 403 (Forbidden)
    res.status(403).send({ speech: 'Lỗi bảo mật: Bạn không được phép truy cập.' })
    return
  }

  // ---------------------------------------------------------------
  // BƯỚC 2: PHÂN TÍCH YÊU CẦU
  // ---------------------------------------------------------------
  // Lấy tên hàm và các đối số mà LLM đã bóc tách
  const { functionName, args } = req.body

  // Kiểm tra xem có đủ thông tin không
  if (!functionName || !args) {
    console.error('Yêu cầu không đầy đủ:', req.body)
    res.status(400).send({ speech: 'Lỗi: Yêu cầu không rõ ràng hoặc thiếu đối số.' })
    return
  }

  // ---------------------------------------------------------------
  // BƯỚC 3: BỘ ĐỊNH TUYẾN (Router)
  // ---------------------------------------------------------------
  // Quyết định hành động (gọi hàm nghiệp vụ nào)
  // dựa trên "functionName" mà LLM gửi đến.
  try {
    let speechResponse = '' // Chuỗi văn bản mà AI sẽ nói lại

    switch (functionName) {
      case 'updateStudentScore': {
        // Ép kiểu (cast) các đối số về kiểu UpdateScoreArgs
        const { studentName, examName, newScore } = args as UpdateScoreArgs
        speechResponse = await handleUpdateScore(studentName, examName, newScore)
        break
      }

      case 'getStudentInfo': {
        const { studentName } = args as GetStudentInfoArgs
        speechResponse = await handleGetStudentInfo(studentName)
        break
      }

      // TODO: Thêm các case khác ở đây
      // ví dụ: case "getExamStatistics": ...

      default:
        speechResponse = `Xin lỗi, tôi không hỗ trợ chức năng có tên là ${functionName}.`
    }

    // ---------------------------------------------------------------
    // BƯỚC 5: GỬI PHẢN HỒI THÀNH CÔNG
    // ---------------------------------------------------------------
    // Gửi phản hồi (văn bản) về cho máy chủ XiaoZhi.
    // Máy chủ sẽ dùng TTS để chuyển thành âm thanh.
    console.log('Phản hồi thành công:', speechResponse)
    res.status(200).send({ speech: speechResponse })
  } catch (error) {
    // Xử lý nếu có lỗi nghiêm trọng xảy ra
    console.error('Lỗi nghiêm trọng trong Bộ định tuyến:', error)
    res.status(500).send({ speech: 'Đã có lỗi xảy ra phía máy chủ, vui lòng thử lại.' })
  }
})

/**
 * ===================================================================
 * HÀM NGHIỆP VỤ (Business Logic)
 * ===================================================================
 * Đây là nơi bạn viết logic để tương tác với Firestore.
 * Các hàm này được gọi bởi "Bộ định tuyến" ở trên.
 */

/**
 * HÀM NGHIỆP VỤ 1: Cập nhật điểm số
 *
 * *** CẤU TRÚC DATABASE THỰC TẾ ***
 * Dựa trên types và indexes:
 *
 * 1. Collection `students`: { id, mssv, fullName, email }
 * 2. Collection `classes`: { id, name, semester, teacherId }
 * 3. Collection `enrollments`: { id, classId, studentId } - Nối sinh viên với lớp
 * 4. Collection `exams`: { id, classId, name, date, maxScore }
 * 5. Collection `submissions`: { id, examId, classId, studentId, score }
 */
async function handleUpdateScore(studentName: string, examName: string, newScore: number): Promise<string> {
  // Kiểm tra đầu vào
  if (!studentName || !examName || newScore === undefined) {
    return 'Yêu cầu cập nhật điểm không đầy đủ. Tôi cần tên sinh viên, tên bài thi, và điểm số.'
  }

  try {
    // 1. Tìm sinh viên theo fullName
    const studentQuery = await db.collection('students').where('fullName', '==', studentName).limit(1).get()

    if (studentQuery.empty) {
      // Debug: Lấy danh sách sinh viên để kiểm tra
      const allStudents = await db.collection('students').limit(5).get()
      let debugInfo = 'Danh sách một số sinh viên: '
      allStudents.forEach(doc => {
        const data = doc.data()
        debugInfo += `"${data.fullName}" (${data.mssv}), `
      })
      return `Không tìm thấy sinh viên "${studentName}". ${debugInfo}`
    }

    const studentDoc = studentQuery.docs[0]
    const studentData = studentDoc.data()
    const studentId = studentDoc.id

    // 2. Tìm lớp học mà sinh viên này tham gia (qua enrollments)
    const enrollmentQuery = await db.collection('enrollments').where('studentId', '==', studentId).get()

    if (enrollmentQuery.empty) {
      return `Sinh viên ${studentName} chưa được đăng ký vào lớp học nào.`
    }

    // Lấy danh sách classId mà sinh viên tham gia
    const classIds = enrollmentQuery.docs.map(doc => doc.data().classId)

    // 3. Tìm bài thi trong các lớp học của sinh viên
    let examDoc = null
    let examClassId = null

    for (const classId of classIds) {
      const examQuery = await db
        .collection('exams')
        .where('classId', '==', classId)
        .where('name', '==', examName)
        .limit(1)
        .get()

      if (!examQuery.empty) {
        examDoc = examQuery.docs[0]
        examClassId = classId
        break
      }
    }

    if (!examDoc) {
      // Debug: Lấy danh sách bài thi trong các lớp của sinh viên
      let debugInfo = 'Danh sách bài thi trong các lớp của sinh viên: '
      for (const classId of classIds) {
        const examsInClass = await db.collection('exams').where('classId', '==', classId).limit(3).get()
        examsInClass.forEach(doc => {
          debugInfo += `"${doc.data().name}" (lớp: ${classId}), `
        })
      }
      return `Không tìm thấy bài thi "${examName}" trong các lớp của sinh viên ${studentName}. ${debugInfo}`
    }

    const examId = examDoc.id

    // 4. Tìm hoặc tạo submission
    const submissionQuery = await db
      .collection('submissions')
      .where('examId', '==', examId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get()

    if (!submissionQuery.empty) {
      // Cập nhật submission đã có
      const submissionDoc = submissionQuery.docs[0]
      await submissionDoc.ref.update({
        score: newScore,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        verified: true,
        status: 'verified',
        source: 'xiaozhi_ai',
      })
    } else {
      // Tạo submission mới
      await db.collection('submissions').add({
        examId: examId,
        classId: examClassId,
        studentId: studentId,
        fullName: studentData.fullName,
        score: newScore,
        contentSummary: `Điểm cập nhật bởi XiaoZhi AI`,
        verified: true,
        status: 'verified',
        extractedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'xiaozhi_ai',
      })
    }

    return `Đã cập nhật điểm ${examName} của sinh viên ${studentName} (${studentData.mssv}) thành ${newScore} điểm.`
  } catch (err: any) {
    console.error('Lỗi trong handleUpdateScore:', err)
    return `Đã xảy ra lỗi khi cập nhật điểm: ${err.message}.`
  }
}

/**
 * HÀM NGHIỆP VỤ 2: Lấy thông tin và điểm của sinh viên
 */
async function handleGetStudentInfo(studentName: string): Promise<string> {
  if (!studentName) {
    return 'Tôi cần tên sinh viên để tra cứu.'
  }

  try {
    // 1. Tìm sinh viên theo fullName
    const studentQuery = await db.collection('students').where('fullName', '==', studentName).limit(1).get()

    if (studentQuery.empty) {
      // Debug: Lấy danh sách sinh viên để kiểm tra
      const allStudents = await db.collection('students').limit(5).get()
      let debugInfo = 'Danh sách một số sinh viên: '
      allStudents.forEach(doc => {
        const data = doc.data()
        debugInfo += `"${data.fullName}" (${data.mssv}), `
      })
      return `Không tìm thấy sinh viên "${studentName}". ${debugInfo}`
    }

    const studentDoc = studentQuery.docs[0]
    const studentData = studentDoc.data()
    const studentId = studentDoc.id

    // 2. Lấy danh sách lớp học của sinh viên
    const enrollmentQuery = await db.collection('enrollments').where('studentId', '==', studentId).get()

    if (enrollmentQuery.empty) {
      return `Sinh viên ${studentName} (${studentData.mssv}) chưa được đăng ký vào lớp học nào.`
    }

    const classIds = enrollmentQuery.docs.map(doc => doc.data().classId)

    // 3. Lấy tên các lớp học
    const classNames = []
    for (const classId of classIds) {
      const classDoc = await db.collection('classes').doc(classId).get()
      if (classDoc.exists) {
        const classData = classDoc.data()
        classNames.push(`${classData?.name} (${classData?.semester})`)
      }
    }

    // 4. Lấy tất cả điểm của sinh viên trong các lớp
    const submissionsQuery = await db.collection('submissions').where('studentId', '==', studentId).get()

    if (submissionsQuery.empty) {
      return `Sinh viên ${studentName}, mã số ${studentData.mssv}, đang học ${classNames.join(', ')} nhưng chưa có điểm nào.`
    }

    // 5. Lấy thông tin chi tiết về điểm và bài thi
    const scoreDetails = []
    for (const submissionDoc of submissionsQuery.docs) {
      const submission = submissionDoc.data()

      // Lấy thông tin bài thi
      const examDoc = await db.collection('exams').doc(submission.examId).get()
      if (examDoc.exists) {
        const examData = examDoc.data()

        // Lấy thông tin lớp học
        const classDoc = await db.collection('classes').doc(submission.classId).get()
        const className = classDoc.exists ? classDoc.data()?.name : 'Unknown'

        scoreDetails.push({
          examName: examData?.name,
          className: className,
          score: submission.score,
          maxScore: examData?.maxScore,
        })
      }
    }

    // 6. Tạo câu trả lời
    let response = `Sinh viên ${studentName}, mã số ${studentData.mssv}, đang học ${classNames.join(', ')}.`

    if (scoreDetails.length > 0) {
      response += ` Có ${scoreDetails.length} bài kiểm tra: `
      scoreDetails.forEach(detail => {
        response += `${detail.examName} (${detail.className}): ${detail.score}/${detail.maxScore} điểm; `
      })
    }

    return response
  } catch (err: any) {
    console.error('Lỗi trong handleGetStudentInfo:', err)
    return `Đã xảy ra lỗi khi tra cứu thông tin: ${err.message}.`
  }
}
