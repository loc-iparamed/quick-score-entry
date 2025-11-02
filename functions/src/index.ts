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
 * *** GIẢ ĐỊNH QUAN TRỌNG VỀ CẤU TRÚC DATABASE ***
 * (Dựa trên file README.md của bạn)
 *
 * 1. Collection `students`:
 * - Có trường `ho_ten` (ví dụ: "Nguyễn Văn A")
 * - Có trường `mssv` (ví dụ: "20210001")
 *
 * 2. Collection `exams`: (Bạn cần tạo collection này)
 * - Có trường `ten_bai_kt` (ví dụ: "Giữa Kỳ")
 *
 * 3. Collection `submissions`:
 * - Dùng để lưu điểm.
 * - ID của document là sự kết hợp: `${mssv}_${examId}`
 * - Có các trường: `studentId` (là MSSV), `examId`, `diem`
 */
async function handleUpdateScore(studentName: string, examName: string, newScore: number): Promise<string> {
  // Kiểm tra đầu vào
  if (!studentName || !examName || newScore === undefined) {
    return 'Yêu cầu cập nhật điểm không đầy đủ. Tôi cần tên sinh viên, tên bài thi, và điểm số.'
  }

  try {
    // 1. Tìm Sinh viên (dựa vào tên)
    const studentQuery = await db.collection('students').where('ho_ten', '==', studentName).limit(1).get()

    if (studentQuery.empty) {
      return `Xin lỗi, tôi không tìm thấy sinh viên nào tên là ${studentName}.`
    }
    const studentDoc = studentQuery.docs[0]
    const mssv = studentDoc.data().mssv // Lấy MSSV từ document

    // 2. Tìm Bài thi (dựa vào tên)
    const examQuery = await db
      .collection('exams') // <-- Bạn cần tạo collection này
      .where('ten_bai_kt', '==', examName)
      .limit(1)
      .get()

    if (examQuery.empty) {
      return `Xin lỗi, tôi không tìm thấy bài kiểm tra nào tên là ${examName}.`
    }
    const examId = examQuery.docs[0].id // Lấy ID của bài thi

    // 3. Cập nhật hoặc Tạo mới điểm trong 'submissions'
    // Sử dụng ID tùy chỉnh để dễ dàng truy vấn
    const submissionId = `${mssv}_${examId}`
    const submissionRef = db.collection('submissions').doc(submissionId)

    const submissionData = {
      studentId: mssv, // Lưu lại MSSV
      examId: examId, // Lưu lại ID bài thi
      diem: newScore,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'xiaozhi_ai', // Ghi lại nguồn cập nhật
    }

    // set() với { merge: true } sẽ tạo mới nếu chưa có, hoặc ghi đè nếu đã có
    await submissionRef.set(submissionData, { merge: true })

    return `Đã cập nhật điểm ${examName} của sinh viên ${studentName} thành ${newScore}.`
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
    // 1. Tìm sinh viên
    const studentQuery = await db.collection('students').where('ho_ten', '==', studentName).limit(1).get()

    if (studentQuery.empty) {
      return `Xin lỗi, tôi không tìm thấy sinh viên nào tên là ${studentName}.`
    }

    const studentData = studentQuery.docs[0].data()
    const mssv = studentData.mssv

    // 2. Lấy tất cả điểm của sinh viên đó
    const submissionsQuery = await db.collection('submissions').where('studentId', '==', mssv).get()

    if (submissionsQuery.empty) {
      return `Sinh viên ${studentName}, mã số ${mssv}, hiện chưa có điểm nào trong hệ thống.`
    }

    // 3. Tổng hợp kết quả để nói
    let scoreText = ''
    const scoreCount = submissionsQuery.size

    // Lặp qua các điểm (đang thiếu tên bài thi, cần query thêm nếu muốn)
    submissionsQuery.forEach(doc => {
      const score = doc.data()
      // Tạm thời chỉ đọc điểm
      scoreText += `... có một điểm là ${score.diem} ... `
    })

    return `Sinh viên ${studentName}, mã số ${mssv}, đã có tổng cộng ${scoreCount} cột điểm. ${scoreText}`
  } catch (err: any) {
    console.error('Lỗi trong handleGetStudentInfo:', err)
    return `Đã xảy ra lỗi khi tra cứu thông tin: ${err.message}.`
  }
}
