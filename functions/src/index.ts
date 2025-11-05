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

      // === CÁC CHỨC NĂNG CHO REALTIME DATABASE (CRUD ĐẦY ĐỦ) ===
      case 'getScanResults': {
        speechResponse = await handleGetScanResults()
        break
      }

      case 'createScanResult': {
        const { studentName, mssv, score } = args as any
        speechResponse = await handleCreateScanResult(studentName, mssv, score)
        break
      }

      case 'updateScanResult': {
        const { id, studentName, mssv, score } = args as any
        speechResponse = await handleUpdateScanResult(id, studentName, mssv, score)
        break
      }

      case 'deleteScanResult': {
        const { id } = args as any
        speechResponse = await handleDeleteScanResult(id)
        break
      }

      case 'clearAllScanResults': {
        speechResponse = await handleClearAllScanResults()
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
 * HÀM NGHIỆP VỤ 1: Cập nhật điểm số (CHỈ CHO SINH VIÊN ĐÃ TỒN TẠI)
 *
 * *** CHÍNH SÁCH BẢO MẬT ***
 * - KHÔNG được tạo sinh viên mới trong Firestore
 * - CHỈ được cập nhật điểm cho sinh viên đã có sẵn
 * - Firestore là dữ liệu nhạy cảm, chỉ READ-ONLY cho sinh viên
 *
 * *** CẤU TRÚC DATABASE THỰC TẾ ***
 * 1. Collection `students`: { id, mssv, fullName, email } - READ ONLY
 * 2. Collection `classes`: { id, name, semester, teacherId }
 * 3. Collection `enrollments`: { id, classId, studentId } - READ ONLY
 * 4. Collection `exams`: { id, classId, name, date, maxScore }
 * 5. Collection `submissions`: { id, examId, classId, studentId, score } - CHỈ CẬP NHẬT ĐIỂM
 */
async function handleUpdateScore(studentName: string, examName: string, newScore: number): Promise<string> {
  // Kiểm tra đầu vào
  if (!studentName || !examName || newScore === undefined) {
    return 'Yêu cầu cập nhật điểm không đầy đủ. Tôi cần tên sinh viên, tên bài thi, và điểm số.'
  }

  // Kiểm tra điểm số hợp lệ
  if (newScore < 0 || newScore > 10) {
    return 'Điểm số phải trong khoảng từ 0 đến 10.'
  }

  // KIỂM TRA CỤM TỪ KHÓA BẮT BUỘC CHO FIRESTORE
  // Chỉ cho phép cập nhật Firestore khi có cụm từ "trong cơ sở dữ liệu"
  const hasKeyword =
    studentName.toLowerCase().includes('trong cơ sở dữ liệu') ||
    examName.toLowerCase().includes('trong cơ sở dữ liệu') ||
    studentName.toLowerCase().includes('database') ||
    examName.toLowerCase().includes('database') ||
    studentName.toLowerCase().includes('firestore') ||
    examName.toLowerCase().includes('firestore')

  if (!hasKeyword) {
    return (
      `🚫 Để cập nhật điểm trong Firestore, vui lòng nói thêm cụm từ "trong cơ sở dữ liệu".\n\n` +
      `📋 Ví dụ: "Cập nhật điểm ${examName} của sinh viên ${studentName} thành ${newScore} trong cơ sở dữ liệu"\n\n` +
      `💡 Trang ScoreEntry chỉ xử lý dữ liệu scan tạm thời từ Realtime Database.`
    )
  }

  // Loại bỏ cụm từ khóa để lấy tên thực
  const actualStudentName = studentName
    .replace(/trong cơ sở dữ liệu/gi, '')
    .replace(/database/gi, '')
    .replace(/firestore/gi, '')
    .trim()

  const actualExamName = examName
    .replace(/trong cơ sở dữ liệu/gi, '')
    .replace(/database/gi, '')
    .replace(/firestore/gi, '')
    .trim()

  try {
    // 1. Tìm sinh viên theo fullName (CHỈ ĐỌC FIRESTORE)
    const studentQuery = await db.collection('students').where('fullName', '==', actualStudentName).limit(1).get()

    if (studentQuery.empty) {
      return `Không tìm thấy sinh viên "${actualStudentName}" trong cơ sở dữ liệu Firestore. Chỉ có thể cập nhật điểm cho sinh viên đã có sẵn.`
    }

    const studentDoc = studentQuery.docs[0]
    const studentData = studentDoc.data()
    const studentId = studentDoc.id

    // 2. Kiểm tra sinh viên có đăng ký lớp học không (CHỈ ĐỌC)
    const enrollmentQuery = await db.collection('enrollments').where('studentId', '==', studentId).get()

    if (enrollmentQuery.empty) {
      return `Sinh viên ${actualStudentName} (${studentData.mssv}) chưa được đăng ký vào lớp học nào trong cơ sở dữ liệu.`
    }

    // Lấy danh sách classId mà sinh viên tham gia
    const classIds = enrollmentQuery.docs.map(doc => doc.data().classId)

    // 3. Tìm bài thi trong các lớp học của sinh viên (CHỈ ĐỌC)
    let examDoc = null
    let examClassId = null

    for (const classId of classIds) {
      const examQuery = await db
        .collection('exams')
        .where('classId', '==', classId)
        .where('name', '==', actualExamName)
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
      let debugInfo = 'Các bài thi có sẵn trong cơ sở dữ liệu: '
      for (const classId of classIds) {
        const examsInClass = await db.collection('exams').where('classId', '==', classId).limit(3).get()
        examsInClass.forEach(doc => {
          debugInfo += `"${doc.data().name}", `
        })
      }
      return `Không tìm thấy bài thi "${actualExamName}" cho sinh viên ${actualStudentName} trong cơ sở dữ liệu. ${debugInfo}`
    }

    const examId = examDoc.id

    // 4. Cập nhật hoặc tạo submission (CHỈ THAO TÁC DUY NHẤT ĐƯỢC PHÉP)
    const submissionQuery = await db
      .collection('submissions')
      .where('examId', '==', examId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get()

    if (!submissionQuery.empty) {
      // Cập nhật submission đã có
      const submissionDoc = submissionQuery.docs[0]
      const oldScore = submissionDoc.data().score || 0

      await submissionDoc.ref.update({
        score: newScore,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        verified: true,
        status: 'verified',
        source: 'xiaozhi_ai',
      })

      return (
        `📊 ĐÃ CẬP NHẬT ĐIỂM TRONG CƠ SỞ DỮ LIỆU FIRESTORE:\n\n` +
        `👤 Sinh viên: ${actualStudentName} (${studentData.mssv})\n` +
        `📝 Bài thi: ${actualExamName}\n` +
        `📈 Điểm: ${oldScore} → ${newScore}\n\n` +
        `🔒 Dữ liệu đã được lưu vào Firestore Database.`
      )
    } else {
      // Tạo submission mới (chỉ cho sinh viên đã tồn tại)
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

      return (
        `📊 ĐÃ TẠO MỚI ĐIỂM TRONG CƠ SỞ DỮ LIỆU FIRESTORE:\n\n` +
        `👤 Sinh viên: ${actualStudentName} (${studentData.mssv})\n` +
        `📝 Bài thi: ${actualExamName}\n` +
        `📈 Điểm: ${newScore}/10\n\n` +
        `🔒 Dữ liệu đã được lưu vào Firestore Database.`
      )
    }
  } catch (err: any) {
    console.error('Lỗi trong handleUpdateScore:', err)
    return `Đã xảy ra lỗi khi cập nhật điểm trong cơ sở dữ liệu: ${err.message}.`
  }
}

/**
 * HÀM NGHIỆP VỤ 2: Lấy thông tin và điểm của sinh viên (CHỈ KHI CÓ CỤM TỪ KHÓA)
 *
 * *** CHÍNH SÁCH PHÂN BIỆT NGUỒN DỮ LIỆU ***
 * - Realtime Database: CRUD đầy đủ khi dùng trang ScoreEntry
 * - Firestore Database: CHỈ GET khi nói thêm "trong cơ sở dữ liệu"
 */
async function handleGetStudentInfo(studentName: string): Promise<string> {
  // Nếu không có tên sinh viên cụ thể, kiểm tra có yêu cầu danh sách không
  if (!studentName || studentName.trim() === '') {
    return 'Tôi cần tên sinh viên cụ thể để tra cứu. Ví dụ: "Nguyễn Văn A trong cơ sở dữ liệu"'
  }

  // KIỂM TRA CỤM TỪ KHÓA BẮT BUỘC
  // Chỉ cho phép truy cập Firestore khi có cụm từ "trong cơ sở dữ liệu"
  const hasKeyword =
    studentName.toLowerCase().includes('trong cơ sở dữ liệu') ||
    studentName.toLowerCase().includes('database') ||
    studentName.toLowerCase().includes('firestore')

  if (!hasKeyword) {
    return (
      `🚫 Để truy cập thông tin sinh viên trong Firestore, vui lòng nói thêm cụm từ "trong cơ sở dữ liệu".\n\n` +
      `📋 Ví dụ: "Cho tôi biết thông tin sinh viên Nguyễn Văn A trong cơ sở dữ liệu"\n\n` +
      `💡 Hoặc: "Hãy cung cấp danh sách sinh viên trong cơ sở dữ liệu"\n\n` +
      `� Trang ScoreEntry chỉ xử lý dữ liệu scan tạm thời từ Realtime Database.`
    )
  }

  // Loại bỏ cụm từ khóa để lấy tên sinh viên thực
  const actualStudentName = studentName
    .replace(/trong cơ sở dữ liệu/gi, '')
    .replace(/database/gi, '')
    .replace(/firestore/gi, '')
    .replace(/hãy cung cấp/gi, '')
    .replace(/danh sách/gi, '')
    .replace(/thông tin/gi, '')
    .replace(/sinh viên/gi, '')
    .trim()

  try {
    // Nếu không có tên cụ thể sau khi loại bỏ từ khóa, trả về danh sách
    if (!actualStudentName || actualStudentName === '') {
      return await getAllStudentsList()
    }

    // 1. Tìm sinh viên theo fullName (CHỈ ĐỌC FIRESTORE)
    const studentQuery = await db.collection('students').where('fullName', '==', actualStudentName).limit(1).get()

    if (studentQuery.empty) {
      // Thử tìm kiếm partial match
      const allStudents = await db.collection('students').limit(20).get()
      const matchedStudents = allStudents.docs.filter(doc => {
        const data = doc.data()
        return data.fullName.toLowerCase().includes(actualStudentName.toLowerCase())
      })

      if (matchedStudents.length > 0) {
        let response = `🔍 TÌM THẤY ${matchedStudents.length} SINH VIÊN TƯƠNG TỰ:\n\n`
        matchedStudents.forEach((doc, index) => {
          const data = doc.data()
          response += `${index + 1}. ${data.fullName} (${data.mssv})\n`
        })
        response += `\n💡 Vui lòng nói chính xác tên sinh viên để xem chi tiết.`
        return response
      }

      // Nếu không tìm thấy, hiển thị danh sách để debug
      return await getAllStudentsList()
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

    // 6. Tạo câu trả lời với thông tin từ Firestore
    let response =
      `📊 THÔNG TIN TỪ CƠ SỞ DỮ LIỆU FIRESTORE:\n\n` +
      `👤 Sinh viên: ${actualStudentName}\n` +
      `🆔 MSSV: ${studentData.mssv}\n` +
      `📚 Lớp học: ${classNames.join(', ')}`

    if (scoreDetails.length > 0) {
      response += `\n\n📝 Điểm số (${scoreDetails.length} bài kiểm tra):`
      scoreDetails.forEach(detail => {
        response += `\n• ${detail.examName} (${detail.className}): ${detail.score}/${detail.maxScore} điểm`
      })
    } else {
      response += `\n\n📝 Chưa có điểm kiểm tra nào trong cơ sở dữ liệu.`
    }

    response += `\n\n🔒 Dữ liệu từ Firestore Database (chỉ đọc).`

    return response
  } catch (err: any) {
    console.error('Lỗi trong handleGetStudentInfo:', err)
    return `Đã xảy ra lỗi khi tra cứu thông tin trong cơ sở dữ liệu: ${err.message}.`
  }
}

/**
 * ===================================================================
 * HÀM XỬ LÝ REALTIME DATABASE - CRUD ĐẦY ĐỦ CHO TRANG SCOREENTRY
 * ===================================================================
 * Các hàm này cho phép thao tác đầy đủ với dữ liệu scan tạm thời
 * trong Realtime Database khi sử dụng trang ScoreEntry
 */

/**
 * Lấy tất cả kết quả scan từ Realtime Database
 */
async function handleGetScanResults(): Promise<string> {
  try {
    const realtimeDB = admin.database()
    const snapshot = await realtimeDB.ref('exam_results').once('value')

    if (!snapshot.exists()) {
      return '📊 DỮ LIỆU SCAN REALTIME:\n\nChưa có kết quả scan nào trong Realtime Database.\n\n💡 Sử dụng máy scan hoặc nhập thủ công để tạo dữ liệu.'
    }

    const data = snapshot.val()
    const results = Object.keys(data).map(key => ({
      id: key,
      ...data[key],
    }))

    let response = `📊 DỮ LIỆU SCAN REALTIME (${results.length} kết quả):\n\n`

    results.forEach((result, index) => {
      response += `${index + 1}. ${result.fullName || 'Chưa có tên'} (${result.studentId || 'Chưa có MSSV'}): ${result.score || 0} điểm\n`
      response += `   📅 Thời gian: ${result.timestamp || 'Không xác định'}\n`
      response += `   🆔 ID: ${result.id}\n\n`
    })

    response += '🔄 Dữ liệu từ Realtime Database (có thể chỉnh sửa tự do).'

    return response
  } catch (err: any) {
    console.error('Lỗi khi lấy scan results:', err)
    return `Lỗi khi lấy dữ liệu scan: ${err.message}`
  }
}

/**
 * Tạo mới kết quả scan trong Realtime Database
 */
async function handleCreateScanResult(studentName: string, mssv: string, score: number): Promise<string> {
  if (!studentName || !mssv || score === undefined) {
    return 'Thiếu thông tin: Cần tên sinh viên, MSSV và điểm số để tạo kết quả scan.'
  }

  if (score < 0 || score > 10) {
    return 'Điểm số phải trong khoảng 0-10.'
  }

  try {
    const realtimeDB = admin.database()
    const newId = `${Date.now()}_${mssv}`

    await realtimeDB.ref(`exam_results/${newId}`).set({
      fullName: studentName,
      studentId: mssv,
      score: score,
      timestamp: new Date().toISOString(),
      source: 'xiaozhi_ai_manual',
    })

    return (
      `✅ ĐÃ TẠO KẾT QUẢ SCAN MỚI:\n\n` +
      `👤 Tên: ${studentName}\n` +
      `🆔 MSSV: ${mssv}\n` +
      `📊 Điểm: ${score}/10\n` +
      `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}\n` +
      `📱 ID: ${newId}\n\n` +
      `🔄 Dữ liệu đã được lưu vào Realtime Database.`
    )
  } catch (err: any) {
    console.error('Lỗi khi tạo scan result:', err)
    return `Lỗi khi tạo kết quả scan: ${err.message}`
  }
}

/**
 * Cập nhật kết quả scan trong Realtime Database
 */
async function handleUpdateScanResult(
  id: string,
  studentName?: string,
  mssv?: string,
  score?: number,
): Promise<string> {
  if (!id) {
    return 'Thiếu ID kết quả scan cần cập nhật.'
  }

  try {
    const realtimeDB = admin.database()
    const ref = realtimeDB.ref(`exam_results/${id}`)

    // Kiểm tra tồn tại
    const snapshot = await ref.once('value')
    if (!snapshot.exists()) {
      return `Không tìm thấy kết quả scan với ID: ${id}`
    }

    const updates: any = {}

    if (studentName) updates.fullName = studentName
    if (mssv) updates.studentId = mssv
    if (score !== undefined) {
      if (score < 0 || score > 10) {
        return 'Điểm số phải trong khoảng 0-10.'
      }
      updates.score = score
    }

    if (Object.keys(updates).length === 0) {
      return 'Không có thông tin nào để cập nhật.'
    }

    updates.lastModified = new Date().toISOString()

    await ref.update(updates)

    const currentData = snapshot.val()

    return (
      `✅ ĐÃ CẬP NHẬT KẾT QUẢ SCAN:\n\n` +
      `📱 ID: ${id}\n` +
      `👤 Tên: ${updates.fullName || currentData.fullName}\n` +
      `🆔 MSSV: ${updates.studentId || currentData.studentId}\n` +
      `📊 Điểm: ${updates.score !== undefined ? updates.score : currentData.score}/10\n` +
      `⏰ Cập nhật: ${new Date().toLocaleString('vi-VN')}\n\n` +
      `🔄 Dữ liệu đã được cập nhật trong Realtime Database.`
    )
  } catch (err: any) {
    console.error('Lỗi khi cập nhật scan result:', err)
    return `Lỗi khi cập nhật kết quả scan: ${err.message}`
  }
}

/**
 * Xóa kết quả scan trong Realtime Database
 */
async function handleDeleteScanResult(id: string): Promise<string> {
  if (!id) {
    return 'Thiếu ID kết quả scan cần xóa.'
  }

  try {
    const realtimeDB = admin.database()
    const ref = realtimeDB.ref(`exam_results/${id}`)

    // Kiểm tra tồn tại
    const snapshot = await ref.once('value')
    if (!snapshot.exists()) {
      return `Không tìm thấy kết quả scan với ID: ${id}`
    }

    const data = snapshot.val()
    await ref.remove()

    return (
      `✅ ĐÃ XÓA KẾT QUẢ SCAN:\n\n` +
      `📱 ID: ${id}\n` +
      `👤 Tên: ${data.fullName || 'Không xác định'}\n` +
      `🆔 MSSV: ${data.studentId || 'Không xác định'}\n` +
      `📊 Điểm: ${data.score || 0}/10\n` +
      `⏰ Xóa lúc: ${new Date().toLocaleString('vi-VN')}\n\n` +
      `🗑️ Dữ liệu đã được xóa khỏi Realtime Database.`
    )
  } catch (err: any) {
    console.error('Lỗi khi xóa scan result:', err)
    return `Lỗi khi xóa kết quả scan: ${err.message}`
  }
}

/**
 * Xóa tất cả kết quả scan trong Realtime Database
 */
async function handleClearAllScanResults(): Promise<string> {
  try {
    const realtimeDB = admin.database()
    const snapshot = await realtimeDB.ref('exam_results').once('value')

    if (!snapshot.exists()) {
      return '📊 Realtime Database đã trống, không có dữ liệu scan nào để xóa.'
    }

    const count = Object.keys(snapshot.val()).length
    await realtimeDB.ref('exam_results').remove()

    return (
      `✅ ĐÃ XÓA TẤT CẢ KẾT QUẢ SCAN:\n\n` +
      `📊 Số lượng: ${count} kết quả\n` +
      `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}\n\n` +
      `🗑️ Tất cả dữ liệu scan đã được xóa khỏi Realtime Database.\n` +
      `💡 Sẵn sàng cho batch scan mới.`
    )
  } catch (err: any) {
    console.error('Lỗi khi xóa tất cả scan results:', err)
    return `Lỗi khi xóa tất cả kết quả scan: ${err.message}`
  }
}

/**
 * HÀM HỖ TRỢ: Lấy danh sách tất cả sinh viên trong Firestore
 */
async function getAllStudentsList(): Promise<string> {
  try {
    const studentsQuery = await db.collection('students').limit(20).get()

    if (studentsQuery.empty) {
      return '📊 DANH SÁCH SINH VIÊN TRONG CƠ SỞ DỮ LIỆU:\n\nChưa có sinh viên nào trong hệ thống Firestore.'
    }

    let response = `📊 DANH SÁCH SINH VIÊN TRONG CƠ SỞ DỮ LIỆU (${studentsQuery.size} sinh viên):\n\n`

    studentsQuery.docs.forEach((doc, index) => {
      const data = doc.data()
      response += `${index + 1}. ${data.fullName || 'Chưa có tên'} (${data.mssv || 'Chưa có MSSV'})\n`
      if (data.email) response += `   📧 Email: ${data.email}\n`
      if (data.phoneNumber) response += `   📱 SĐT: ${data.phoneNumber}\n`
      response += `\n`
    })

    response += `💡 Để xem chi tiết sinh viên, nói: "Thông tin sinh viên [Tên đầy đủ] trong cơ sở dữ liệu"\n`
    response += `🔒 Dữ liệu từ Firestore Database (chỉ đọc).`

    return response
  } catch (err: any) {
    console.error('Lỗi khi lấy danh sách sinh viên:', err)
    return `Lỗi khi lấy danh sách sinh viên: ${err.message}`
  }
}
