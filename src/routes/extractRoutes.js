const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { extractCVFromText } = require('../controllers/extractController');
const { extractJobDescriptionFromText } = require('../controllers/jobDescriptionExtractController');
const { preprocessCVText } = require('../controllers/preprocessController');




/**
 * @swagger
 * /api/extract/cv:
 *   post:
 *     summary: Extract CV data from text using AI
 *     tags: [Extract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Raw text of the CV to analyze
 *     responses:
 *       200:
 *         description: CV data extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CV'
 *                 message:
 *                   type: string
 *                   example: CV data extracted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/cv', protect, extractCVFromText);

/**
 * @swagger
 * /api/extract/job-description:
 *   post:
 *     summary: Extract Job Description data from text using AI
 *     tags: [Extract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Raw text of the Job Description to analyze
 *                 example: |
 *                   Chi tiết tin tuyển dụng
 *                   
 *                   Chuyên môn:
 *                   - Tư vấn du học
 *                   - Direct Sales
 *                   - Telesales
 *                   - Online Sales
 *                   - Bán hàng tại cửa hàng/showroom
 *                   - B2B
 *                   - B2C
 *                   - B2G
 *                   - Có hỗ trợ Data
 *                   - Diễn đạt trôi chảy
 *                   
 *                   Mô tả công việc:
 *                   - Khai thác khách hàng mới bằng nhiều phương tiện (có hỗ trợ data từ Marketing).
 *                   - Tư vấn, cung cấp thông tin cho khách hàng về các dịch vụ của công ty: Du học, việc làm, định cư tại Canada.
 *                   - Theo dõi hồ sơ, chăm sóc khách hàng đã ký kết hợp đồng.
 *                   - Hoàn thành chỉ tiêu về doanh số và hiệu quả công việc do cấp trên giao phó.
 *                   - Thực hiện báo cáo theo quy định.
 *                   - Chịu sự quản lý trực tiếp của Trưởng phòng Kinh doanh hoặc Phó Giám đốc Kinh doanh.
 *                   
 *                   Yêu cầu ứng viên:
 *                   - Tốt nghiệp từ cao đẳng trở lên.
 *                   - Ưu tiên ứng viên có kinh nghiệm trong lĩnh vực liên quan.
 *                   - Độ tuổi từ 20 - 35.
 *                   - Có khả năng giao tiếp và trình bày tốt.
 *                   - Giao tiếp tiếng Anh là một lợi thế.
 *                   - Khả năng làm việc độc lập.
 *                   - Kỹ năng vi tính văn phòng cơ bản.
 *                   
 *                   Thu nhập:
 *                   - Thu nhập khi đạt 100% KPI: 15 - 30 triệu VND.
 *                   - Thu nhập tính theo tỷ lệ đạt KPI.
 *                   - Lương cứng không phụ thuộc doanh số.
 *                   
 *                   Quyền lợi:
 *                   - Lương khởi điểm từ 6.000.000 đ (hoặc thỏa thuận theo năng lực) + phụ cấp + lương kinh doanh: Tổng thu nhập từ 10.000.000 đ.
 *                   - Thưởng hiệu quả công việc.
 *                   - Tham gia bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm tai nạn theo quy định của nhà nước.
 *                   - Chính sách phúc lợi tiền mặt và quà tặng vào các dịp lễ, tết, sinh nhật, hiếu hỉ và các chương trình chăm lo cho gia đình nhân viên.
 *                   - Môi trường năng động, hòa đồng.
 *                   - Du lịch/team building cùng công ty ít nhất 1 lần/năm.
 *                   
 *                   Phụ cấp:
 *                   - Ăn trưa.
 *                   
 *                   Địa điểm làm việc:
 *                   - Nghệ An: Căn PG-11 Vincom Shophouse Vinh, Đường Quang Trung, Phường Quang Trung, TP Vinh, Tỉnh Nghệ An.
 *                   
 *                   Thời gian làm việc:
 *                   - Thứ 3 - Thứ 7 (từ 08:00 đến 17:00), làm việc 7 giờ/ngày, nghỉ trưa 2 tiếng.                 
 *                   Hạn nộp hồ sơ: 09/05/2025.
 *     responses:
 *       200:
 *         description: Job Description data extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/JobDescription'
 *                 message:
 *                   type: string
 *                   example: Job Description data extracted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/job-description', protect, extractJobDescriptionFromText);

/**
 * @swagger
 * /api/extract/cv/public:
 *   post:
 *     summary: Public endpoint to extract CV data from text using AI (No authentication required)
 *     tags: [Extract]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text content to extract CV data from (e.g., resume text or job descriptions)
 *                 example: "John Doe\nSenior Software Engineer\nEmail: john.doe@example.com\nPhone: +1 555-123-4567\n\nSummary:\nExperienced software engineer with 8+ years of expertise in full-stack development..."
 *             required:
 *               - text
 *     responses:
 *       200:
 *         description: CV data extracted successfully
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
 *                     personalInfo:
 *                       type: object
 *                     summary:
 *                       type: string
 *                     education:
 *                       type: array
 *                     experience:
 *                       type: array
 *                     skills:
 *                       type: array
 *                     projects:
 *                       type: array
 *                     certifications:
 *                       type: array
 *                     languages:
 *                       type: array
 *                     additionalInfo:
 *                       type: object
 *                     customFields:
 *                       type: array
 *                 message:
 *                   type: string
 *                   example: CV data extracted successfully
 *       400:
 *         description: Text content is required
 *       500:
 *         description: Server error or AI processing error
 */
router.post('/cv/public', extractCVFromText);

/**
 * @swagger
 * /api/extract/cv/text:
 *   post:
 *     summary: Simple endpoint to extract CV data accepting plain text (No authentication required)
 *     tags: [Extract]
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             example: "John Doe\nSenior Software Engineer\nEmail: john.doe@example.com\nPhone: +1 555-123-4567\n\nSummary:\nExperienced software engineer with 8+ years of expertise in full-stack development..."
 *     responses:
 *       200:
 *         description: CV data extracted successfully
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
 *                 message:
 *                   type: string
 *                   example: CV data extracted successfully
 *       400:
 *         description: Text content is required
 *       500:
 *         description: Server error or AI processing error
 */
router.post('/cv/text', (req, res) => {
  // Read the raw text from the request body
  let rawText = '';
  
  // Wait for data chunks
  req.on('data', chunk => {
    rawText += chunk.toString();
  });
  
  // Process when all data is received
  req.on('end', () => {
    // Create a mock request object with the expected structure
    const mockReq = {
      body: {
        text: rawText
      }
    };
    
    // Call the extractCVFromText controller with our modified request
    extractCVFromText(mockReq, res);
  });
  
  // Handle potential errors
  req.on('error', (error) => {
    console.error('Error reading request data:', error);
    return res.status(500).json({
      status: 'error',
      code: 'REQUEST_READ_ERROR',
      message: 'Error reading request data',
      error: error.message
    });
  });
});

/**
 * @swagger
 * /api/extract/preprocess:
 *   post:
 *     summary: Preprocess CV text data for better extraction results
 *     tags: [Extract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Raw text of the CV to preprocess
 *     responses:
 *       200:
 *         description: CV text preprocessed successfully
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
 *                     preprocessedText:
 *                       type: string
 *                       description: The preprocessed text
 *                 message:
 *                   type: string
 *                   example: CV text preprocessed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/preprocess', protect, preprocessCVText);

/**
 * @swagger
 * /api/extract/preprocess/public:
 *   post:
 *     summary: Public endpoint to preprocess CV text (No authentication required)
 *     tags: [Extract]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Raw CV text to be preprocessed
 *                 example: "John Doe\nEmail: johndoe@email.com\nPhone: 123-456-7890\nWork Experience\n2020-Present: Software Developer at XYZ Corp"
 *             required:
 *               - text
 *     responses:
 *       200:
 *         description: CV text preprocessed successfully
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
 *                     originalText:
 *                       type: string
 *                     preprocessedText:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: CV text preprocessed successfully
 *       400:
 *         description: Text content is required
 *       500:
 *         description: Server error or AI processing error
 */
router.post('/preprocess/public', preprocessCVText);

/**
 * @swagger
 * /api/extract/cv-with-preprocess:
 *   post:
 *     summary: Preprocess CV text then extract data
 *     tags: [Extract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Raw text of the CV to preprocess and extract
 *     responses:
 *       200:
 *         description: CV data extracted successfully after preprocessing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CV'
 *                 message:
 *                   type: string
 *                   example: CV data extracted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/cv-with-preprocess', protect, async (req, res) => {
  try {
    // Create a mock response object to capture the preprocess result
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    // Call preprocessCVText with the mock response
    await preprocessCVText(req, mockRes);
    
    // Check if preprocessing was successful
    if (mockRes.statusCode === 200 && mockRes.data && mockRes.data.data && mockRes.data.data.preprocessedText) {
      // Create a new request with the preprocessed text
      const newReq = {
        ...req,
        body: {
          text: mockRes.data.data.preprocessedText
        }
      };
      
      // Extract CV data from the preprocessed text
      return extractCVFromText(newReq, res);
    }
    
    // If preprocessing failed, return the error
    return res.status(mockRes.statusCode || 500).json(mockRes.data || {
      status: 'error',
      message: 'Failed to preprocess CV text'
    });
  } catch (error) {
    console.error('Error in CV preprocessing and extraction:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to preprocess and extract CV data',
      error: error.message
    });
  }
});



/**
 * @swagger
 * /api/extract/cv-with-preprocess/public:
 *   post:
 *     summary: Public endpoint to preprocess CV text then extract data (no auth required)
 *     tags: [Extract]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Raw text of the CV to preprocess and extract
 *     responses:
 *       200:
 *         description: CV data extracted successfully after preprocessing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CV'
 *                 message:
 *                   type: string
 *                   example: CV data extracted successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/cv-with-preprocess/public', async (req, res) => {
  try {
    // Create a mock response object to capture the preprocess result
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    // Call preprocessCVText with the mock response
    await preprocessCVText(req, mockRes);
    
    // Check if preprocessing was successful
    if (mockRes.statusCode === 200 && mockRes.data && mockRes.data.data && mockRes.data.data.preprocessedText) {
      // Create a new request with the preprocessed text
      const newReq = {
        ...req,
        body: {
          text: mockRes.data.data.preprocessedText
        }
      };
      
      // Extract CV data from the preprocessed text
      return extractCVFromText(newReq, res);
    }
    
    // If preprocessing failed, return the error
    return res.status(mockRes.statusCode || 500).json(mockRes.data || {
      status: 'error',
      message: 'Failed to preprocess CV text'
    });
  } catch (error) {
    console.error('Error in CV preprocessing and extraction:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to preprocess and extract CV data',
      error: error.message
    });
  }
});



module.exports = router; 