const express = require('express');
const router = express.Router();
const {
    createResume,
    getResumes,
    getResume,
    updateResume,
    deleteResume,
    createDraftResume
} = require('../controllers/resumeController');
const { protect } = require('../middlewares/authMiddleware');
const { extractResumeFromCVAndJD, extractResumeTips } = require('../controllers/resumeExtractController');

/**
 * @swagger
 * components:
 *   schemas:
 *     MatchedExperience:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Chức danh công việc
 *         company:
 *           type: string
 *           description: Tên công ty
 *         startDate:
 *           type: string
 *           description: Ngày bắt đầu (YYYY-MM)
 *         endDate:
 *           type: string
 *           description: Ngày kết thúc (YYYY-MM), để trống nếu đang làm
 *         description:
 *           type: string
 *           description: Mô tả chi tiết về công việc và thành tích
 *         isPresent:
 *           type: boolean
 *           description: Có phải công việc hiện tại không
 *         relevance:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Mức độ phù hợp với yêu cầu công việc (0-100)
 *         comment:
 *           type: string
 *           description: Giải thích tại sao kinh nghiệm này phù hợp với yêu cầu công việc
 *       required:
 *         - title
 *         - company
 *         - startDate
 *         - relevance
 *         - comment
 * 
 *     MatchedSkill:
 *       type: object
 *       properties:
 *         skill:
 *           type: string
 *           description: Tên kỹ năng
 *         relevance:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Mức độ phù hợp với yêu cầu công việc (0-100)
 *         comment:
 *           type: string
 *           description: Giải thích tại sao kỹ năng này quan trọng cho công việc
 *       required:
 *         - skill
 *         - relevance
 *         - comment
 * 
 *     MatchedEducation:
 *       type: object
 *       properties:
 *         degree:
 *           type: string
 *           description: Bằng cấp/chứng chỉ
 *         school:
 *           type: string
 *           description: Tên trường/đơn vị cấp
 *         startDate:
 *           type: string
 *           description: Ngày bắt đầu (YYYY-MM)
 *         endDate:
 *           type: string
 *           description: Ngày kết thúc (YYYY-MM), để trống nếu đang học
 *         description:
 *           type: string
 *           description: Mô tả chi tiết về chương trình học
 *         isPresent:
 *           type: boolean
 *           description: Có phải đang theo học không
 *         relevance:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Mức độ phù hợp với yêu cầu công việc (0-100)
 *         comment:
 *           type: string
 *           description: Giải thích tại sao trình độ này phù hợp với yêu cầu công việc
 *       required:
 *         - degree
 *         - school
 *         - startDate
 *         - relevance
 *         - comment
 * 
 *     MatchedProject:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Tên dự án
 *         role:
 *           type: string
 *           description: Vai trò trong dự án
 *         startDate:
 *           type: string
 *           description: Ngày bắt đầu (YYYY-MM)
 *         endDate:
 *           type: string
 *           description: Ngày kết thúc (YYYY-MM), để trống nếu đang thực hiện
 *         description:
 *           type: string
 *           description: Mô tả chi tiết về dự án và đóng góp
 *         url:
 *           type: string
 *           description: Đường dẫn đến dự án (nếu có)
 *         isPresent:
 *           type: boolean
 *           description: Có phải dự án đang thực hiện không
 *         relevance:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Mức độ phù hợp với yêu cầu công việc (0-100)
 *         comment:
 *           type: string
 *           description: Giải thích tại sao dự án này phù hợp với yêu cầu công việc
 *       required:
 *         - title
 *         - role
 *         - startDate
 *         - relevance
 *         - comment
 * 
 *     MatchedCertification:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Tên chứng chỉ
 *         issuer:
 *           type: string
 *           description: Đơn vị cấp chứng chỉ
 *         date:
 *           type: string
 *           description: Ngày cấp (YYYY-MM)
 *         url:
 *           type: string
 *           description: Đường dẫn đến chứng chỉ (nếu có)
 *         relevance:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Mức độ phù hợp với yêu cầu công việc (0-100)
 *         comment:
 *           type: string
 *           description: Giải thích tại sao chứng chỉ này phù hợp với yêu cầu công việc
 *       required:
 *         - name
 *         - issuer
 *         - date
 *         - relevance
 *         - comment
 * 
 *     MatchedLanguage:
 *       type: object
 *       properties:
 *         language:
 *           type: string
 *           description: Tên ngôn ngữ
 *         proficiency:
 *           type: string
 *           description: Trình độ ngôn ngữ (Native, Fluent, Intermediate, Basic)
 *         relevance:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Mức độ phù hợp với yêu cầu công việc (0-100)
 *         comment:
 *           type: string
 *           description: Giải thích tại sao ngôn ngữ này quan trọng cho công việc
 *       required:
 *         - language
 *         - proficiency
 *         - relevance
 *         - comment
 * 
 *     Resume:
 *       type: object
 *       required:
 *         - userId
 *         - cvId
 *         - jobDescriptionId
 *         - name
 *         - personalInfo
 *         - summary
 *         - matchedExperience
 *         - matchedSkills
 *         - matchedEducation
 *         - matchedProjects
 *         - matchedCertifications
 *         - matchedLanguages
 *         - status
 *         - isDefault
 *       properties:
 *         userId:
 *           type: string
 *           description: ID của người dùng
 *         cvId:
 *           type: string
 *           description: ID của CV gốc
 *         jobDescriptionId:
 *           type: string
 *           description: ID của Job Description
 *         originalCV:
 *           type: object
 *           description: Bản sao của CV gốc
 *         name:
 *           type: string
 *           description: Tên của resume
 *         personalInfo:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *               description: Tên
 *             lastName:
 *               type: string
 *               description: Họ
 *             email:
 *               type: string
 *               description: Email
 *             phone:
 *               type: string
 *               description: Số điện thoại
 *             location:
 *               type: string
 *               description: Địa chỉ
 *             country:
 *               type: string
 *               description: Quốc gia
 *             website:
 *               type: string
 *               description: Website cá nhân
 *             linkedin:
 *               type: string
 *               description: LinkedIn profile
 *         summary:
 *           type: string
 *           description: Tóm tắt về ứng viên
 *         matchedExperience:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchedExperience'
 *           description: Danh sách kinh nghiệm làm việc phù hợp
 *         matchedSkills:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchedSkill'
 *           description: Danh sách kỹ năng phù hợp
 *         matchedEducation:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchedEducation'
 *           description: Danh sách trình độ học vấn phù hợp
 *         matchedProjects:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchedProject'
 *           description: Danh sách dự án phù hợp
 *         matchedCertifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchedCertification'
 *           description: Danh sách chứng chỉ phù hợp
 *         matchedLanguages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchedLanguage'
 *           description: Danh sách ngôn ngữ phù hợp
 *         additionalInfo:
 *           type: object
 *           description: Thông tin bổ sung
 *         customFields:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               value:
 *                 type: string
 *           description: Các trường tùy chỉnh
 *         status:
 *           type: string
 *           enum: [draft, published]
 *           description: Trạng thái của resume
 *         isDefault:
 *           type: boolean
 *           description: Có phải là resume mặc định không
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật
 */

/**
 * @swagger
 * /api/resumes:
 *   post:
 *     summary: Create a new resume
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Resume'
 *     responses:
 *       201:
 *         description: Resume created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, createResume);

/**
 * @swagger
 * /api/resumes:
 *   get:
 *     summary: Get all resumes for the logged-in user
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resumes
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, getResumes);

/**
 * @swagger
 * /api/resumes/{id}:
 *   get:
 *     summary: Get a single resume by ID
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume details
 *       404:
 *         description: Resume not found
 *       401:
 *         description: Not authorized
 */
router.get('/:id', protect, getResume);

/**
 * @swagger
 * /api/resumes/{id}:
 *   put:
 *     summary: Update a resume
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Resume'
 *     responses:
 *       200:
 *         description: Resume updated successfully
 *       404:
 *         description: Resume not found
 *       401:
 *         description: Not authorized
 */
router.put('/:id', protect, updateResume);

/**
 * @swagger
 * /api/resumes/{id}:
 *   delete:
 *     summary: Delete a resume
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume deleted successfully
 *       404:
 *         description: Resume not found
 *       401:
 *         description: Not authorized
 */
router.delete('/:id', protect, deleteResume);

/**
 * @swagger
 * /api/resumes/match:
 *   post:
 *     summary: Tạo resume phù hợp từ CV và Job Description
 *     tags: [Resumes]
 *     description: |
 *       Endpoint này sẽ phân tích CV và Job Description để tạo ra một resume phù hợp nhất.
 *       - Phân tích và so khớp kinh nghiệm làm việc
 *       - Đánh giá mức độ phù hợp của các kỹ năng
 *       - So khớp trình độ học vấn với yêu cầu
 *       - Lựa chọn các dự án liên quan
 *       - Đánh giá sự phù hợp của chứng chỉ
 *       - Xác định các ngôn ngữ cần thiết
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cvId
 *               - jobDescriptionText
 *             properties:
 *               cvId:
 *                 type: string
 *                 description: ID của CV muốn sử dụng để tạo resume
 *                 example: "507f1f77bcf86cd799439011"
 *               jobDescriptionText:
 *                 type: string
 *                 description: Nội dung của Job Description
 *                 example: "We are looking for a Software Engineer with 3+ years of experience in Node.js and React..."
 *     responses:
 *       201:
 *         description: Resume được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resume'
 *                 message:
 *                   type: string
 *                   example: "Resume created successfully"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Please provide both CV ID and Job Description text"
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Not authorized to access this resource"
 *       404:
 *         description: Không tìm thấy CV
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "CV not found"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/match', protect, extractResumeFromCVAndJD);

/**
 * @swagger
 * /api/resumes/tips:
 *   post:
 *     summary: Extract tips for resume/CV creation based on job description and CV
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cvId
 *               - jobDescriptionId
 *             properties:
 *               cvId:
 *                 type: string
 *                 description: ID of the CV
 *                 example: "507f1f77bcf86cd799439011"
 *               jobDescriptionId:
 *                 type: string
 *                 description: ID of the Job Description
 *                 example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Tips extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     personnalInformationTips:
 *                       type: string
 *                     summaryTips:
 *                       type: object
 *                       properties:
 *                         tips: 
 *                           type: array
 *                           items:
 *                             type: string
 *                         example:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                             description:
 *                               type: string
 *                     experienceTips:
 *                       type: object
 *                       properties:
 *                         tips:
 *                           type: array
 *                           items:
 *                             type: string
 *                         example:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                             description:
 *                               type: string
 *                     educationTips:
 *                       type: object
 *                       properties:
 *                         tips:
 *                           type: array
 *                           items:
 *                             type: string
 *                         example:
 *                           type: string
 *                     skillTips:
 *                       type: object
 *                       properties:
 *                         tips:
 *                           type: array
 *                           items:
 *                             type: string
 *                         example:
 *                           type: string
 *                     projectTips:
 *                       type: object
 *                       properties:
 *                         tips:
 *                           type: array
 *                           items:
 *                             type: string
 *                         example:
 *                           type: string
 *                     certificationTips:
 *                       type: object
 *                       properties:
 *                         tips:
 *                           type: array
 *                           items:
 *                             type: string
 *                         example:
 *                           type: string
 *                     languagesTips:
 *                       type: object
 *                       properties:
 *                         tips:
 *                           type: array
 *                           items:
 *                             type: string
 *                         example:
 *                           type: string
 *                     activitiesTips:
 *                       type: object
 *                       properties:
 *                         tips:
 *                           type: array
 *                           items:
 *                             type: string
 *                         example:
 *                           type: string
 *                     additionalInformationTips:
 *                       type: object
 *                       properties:
 *                         tips:
 *                           type: array
 *                           items:
 *                             type: string
 *                         example:
 *                           type: object
 *                           properties:
 *                             interested:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             achivement:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             publication:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             reference:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 position:
 *                                   type: string
 *                                 company:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                                 phone:
 *                                   type: string
 *                                 relationship:
 *                                   type: string
 *                     customFieldsTips:
 *                       type: object
 *                       properties:
 *                         tips:
 *                           type: string
 *                         example:
 *                           type: string
 *                 message:
 *                   type: string
 *                   example: Resume tips extracted successfully
 *       400:
 *         description: Invalid request format or missing required fields
 *       401:
 *         description: Not authorized to access this resource
 *       403:
 *         description: Not authorized to access this CV or Job Description
 *       404:
 *         description: CV or Job Description not found
 *       500:
 *         description: Server error or AI processing error
 */
router.post('/tips', protect, extractResumeTips);

/**
 * @swagger
 * /api/resumes/draft:
 *   post:
 *     summary: Create a draft resume with minimal fields
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cvId
 *               - jobDescriptionId
 *             properties:
 *               cvId:
 *                 type: string
 *                 description: ID of the CV to base the resume on
 *               jobDescriptionId:
 *                 type: string
 *                 description: ID of the job description
 *     responses:
 *       201:
 *         description: Draft resume created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resume'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/draft', protect, createDraftResume);

module.exports = router; 