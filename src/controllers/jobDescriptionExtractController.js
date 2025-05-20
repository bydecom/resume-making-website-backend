const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const UserLog = require('../models/userLogModel');
const { GeminiApiConfig } = require('../models/aiModel');

// Response schema for Job Description extraction
const JOB_DESCRIPTION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    position: {
      type: "string",
      description: "Job title extract from the Job Description, not include company name, location like Ho Chi Minh, Ha Noi, etc., job type, job level, etc.",
      default: "Unknown"
    },
    companyName: {
      type: "string",
      description: "Company name",
      default: "Unknown"
    },
    location: {
      type: "array",
      items: { type: "string" },
      description: "Location of the job, the more detailed the better",
      default: "Unknown"
    },
    experienceRequired: {
      type: "object",
      properties: {
        min: { 
          type: "number", 
          description: "Minimum experience required for the job"
        },
        max: { 
          type: "number",   
          description: "Maximum experience required for the job"
        },
        description: { 
          type: "string", 
          description: "Experience required for the job, the more detailed the better"
        }
      },
      required: ["min", "max", "description"]
    },
    department: {
      type: "string",
      description: "Department of the job"
    },
    remoteStatus: {
      type: "string",
      enum: ["On-site", "Remote", "Hybrid"],
      description: "Remote status of the job"
    },
    employmentType: {
      type: "string",
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      description: "Job type",
      default: "Unknown"
    },
    jobLevel: {
      type: "string",
      enum: ["Intern", "Junior", "Mid", "Senior", "Lead", "Manager", "Director", "Executive"],
      description: "Job level"
    },
    summary: {
      type: "string",
      description: "Detailed description of the job"
    },
    requirements: {
      type: "array",
      items: { type: "string" },
      description: "List of requirements"
    },
    responsibilities: {
      type: "array",
      items: { type: "string" },
      description: "List of responsibilities"
    },
    benefits: {
      type: "array",
      items: { type: "string" },
      description: "List of benefits"
    },
    salary: {
      type: "object",
      properties: {
        min: { type: "number" },
        max: { type: "number" },
        currency: { type: "string" },
        period: { type: "string" }
      }
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "Keywords related to the job, skills candidate needs"
    },
    applicationDeadline: {
      type: "string",
      description: "Application deadline in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or null if not mentioned or invalid date"
    },
    contactInfo: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" }
      }
    }
  },
  required: [
    "position",
    "jobLevel",
    "employmentType",
    "companyName",
    "location",
    "remoteStatus",
    "experienceRequired",
    "department",
    "summary",
    "requirements",
    "responsibilities",
    "benefits",
    "salary",
    "keywords",
    "applicationDeadline",
  ]
};

// Default system instruction
const DEFAULT_SYSTEM_INSTRUCTION = "You are a helpful AI assistant. Please follow the user's instructions carefully.";

// Default safety settings
const DEFAULT_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
];

// Default generation config
const DEFAULT_GENERATION_CONFIG = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: JOB_DESCRIPTION_RESPONSE_SCHEMA
};

// Add date validation function after DEFAULT_GENERATION_CONFIG
const isValidISODate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (date instanceof Date && !isNaN(date)) {
    try {
      // Try to format as ISO string
      return date.toISOString();
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * @desc    Extract Job Description data from text using Gemini API
 * @route   POST /api/extract/job-description
 * @access  Private
 */
const extractJobDescriptionFromText = async (req, res) => {
  try {
    // Xử lý dữ liệu đầu vào
    let text;
    
    // Kiểm tra và xử lý req.body
    if (typeof req.body === 'string') {
      try {
        // Nếu req.body là chuỗi, thử phân tích nó thành JSON
        const parsedBody = JSON.parse(req.body);
        text = parsedBody.text;
      } catch (parseError) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_REQUEST_FORMAT',
          message: 'Invalid JSON format in request body',
          error: parseError.message
        });
      }
    } else if (req.body && typeof req.body === 'object') {
      // Nếu req.body đã là object, lấy text trực tiếp
      text = req.body.text;
    } else {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Request body is required'
      });
    }

    // Validate input
    if (!text || text.trim() === '') {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Text content is required'
      });
    }
    
    // Đảm bảo text là chuỗi an toàn
    text = String(text).trim();

    // Lấy config Gemini theo taskName 'extract_job_description' và có isActive = true, nếu không có thì dùng mặc định
    let geminiConfig = await GeminiApiConfig.findOne({ taskName: 'extract_job_description', isActive: true });
    let modelName, generationConfig, systemInstruction, safetySettings;
    
    if (geminiConfig) {
      console.log('đã lấy được config extract_job_description từ DB');
      modelName = geminiConfig.modelName;
      
      // Convert Mongoose object to plain JavaScript object and clean up
      const dbGenerationConfig = geminiConfig.generationConfig ? 
          JSON.parse(JSON.stringify(geminiConfig.generationConfig)) : {};
      
      // Remove any Mongoose specific fields
      delete dbGenerationConfig.$__;
      delete dbGenerationConfig.$isNew;
      delete dbGenerationConfig._doc;
      delete dbGenerationConfig.$__parent;

      // Merge with default config, ensuring responseSchema is included
      generationConfig = {
          ...DEFAULT_GENERATION_CONFIG,
          ...dbGenerationConfig,
          responseSchema: JOB_DESCRIPTION_RESPONSE_SCHEMA // Always use our schema
      };
      generationConfig.responseMimeType = DEFAULT_GENERATION_CONFIG.responseMimeType;
      systemInstruction = geminiConfig.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
      if (geminiConfig.safetySettings && geminiConfig.safetySettings.length > 0) {
        // Làm sạch safetySettings nếu nó là Mongoose array
        safetySettings = JSON.parse(JSON.stringify(geminiConfig.safetySettings));
      } else {
        safetySettings = DEFAULT_SAFETY_SETTINGS;
      }
    } else {
      console.log('Không tìm thấy config extract_job_description trong DB hoặc config không active, dùng default.');
      modelName = 'gemini-1.5-flash'; // Model mặc định
      generationConfig = DEFAULT_GENERATION_CONFIG;
      systemInstruction = DEFAULT_SYSTEM_INSTRUCTION;
      safetySettings = DEFAULT_SAFETY_SETTINGS;
    }

    // Luôn dùng API key từ env cho bảo mật
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables.');
      res.status(500);
      throw new Error('Server configuration error: Missing API Key.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
      safetySettings: safetySettings
    });

    try {
      // Initialize chat session and send the text to Gemini API
      const chatSession = model.startChat({
        generationConfig,
        history: [], // No history, just process the text
      });

      // Prepare prompt for the model
      const prompt = `Extract structured Job Description information from the following text. 
      Analyze the text carefully and extract all relevant job details.
      
      Text of raw Job Description to analyze:
      ${text}
      
      Please extract and structure the information according to the following guidelines:
      - Convert all the information to English with unchanged meaning
      - Job position: The main position title
      - Company: The company offering the position
      - Location: Where the job is located
      - Job type: The employment type (full-time, part-time, contract, internship)
      - Description: A detailed description of the role and responsibilities, don't use bullet points
      - Requirements: List of required qualifications, skills, and experience
      - Responsibilities: List of job duties and responsibilities
      - Benefits: List of benefits offered
      - Salary: Salary range with currency and period (if available)
      - Keywords: Important skills or technologies mentioned
      - Application deadline: When applications are due (if mentioned)
      - Remote status: Remote status of the job (if mentioned)
      - Contact information: How to apply or contact for more information
      
      IMPORTANT: You MUST include at least the title, company, description, and requirements fields.`;

      // Send message to Gemini and get response
      const result = await chatSession.sendMessage(prompt);
      
      // Safely try to parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(result.response.text());
        
        // Validate and format applicationDeadline
        if (parsedData.applicationDeadline) {
          parsedData.applicationDeadline = isValidISODate(parsedData.applicationDeadline);
        } else {
          parsedData.applicationDeadline = null;
        }

      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        // Return the raw response if parsing fails
        return res.status(500).json({
          status: 'error',
          code: 'RESPONSE_PARSE_ERROR',
          message: 'Failed to parse AI response as valid JSON',
          rawResponse: result.response.text()
        });
      }

      // Log the extraction action
      await UserLog.create({
        userId: req.user._id,
        action: 'extract_job_description_from_text',
        entityType: 'JobDescription',
        details: {
          textLength: text.length,
          extractedData: {
            position: parsedData.position || 'Unknown',
            companyName: parsedData.companyName || 'Unknown',
            summary: parsedData.summary ? parsedData.summary.substring(0, 100) + '...' : 'No summary',
            keywords: parsedData.keywords || [],
            timestamp: new Date()
          },
          success: true
        },
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      // Return the structured Job Description data
      return res.status(200).json({
        status: 'success',
        data: parsedData,
        message: 'Job Description data extracted successfully'
      });
    } catch (aiError) {
      // Log the failed extraction attempt
      await UserLog.create({
        userId: req.user._id,
        action: 'extract_job_description_from_text',
        entityType: 'JobDescription',
        details: {
          textLength: text.length,
          error: aiError.message,
          timestamp: new Date(),
          success: false
        },
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      console.error('Gemini API Error:', aiError);
      return res.status(500).json({
        status: 'error',
        code: 'AI_PROCESSING_ERROR',
        message: 'Failed to process text with AI',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Extract Job Description Error:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to extract Job Description data',
      error: error.message
    });
  }
};

// // Định nghĩa schema response cho CV extraction
// const CV_EXTRACT_RESPONSE_SCHEMA = {
//   type: "object",
//   properties: {
//     personalInfo: {
//       type: "object",
//       properties: {
//         firstName: { type: "string" },
//         lastName: { type: "string" },
//         professionalHeadline: {
//           type: "string",
//           description: "Professional title"
//         },
//         email: { type: "string", description: "Email" },
//         phone: { type: "string", description: "Phone number" },
//         location: {
//           type: "string",
//           description: "Location but not include country"
//         },
//         country: {
//           type: "string",
//           description: "Country only",
//           nullable: true
//         },
//         website: {
//           type: "string",
//           description: "Link to the website, portfolio, blog, github (can be extrated from project link)",
//           nullable: true
//         },
//         linkedin: {
//           type: "string",
//           description: "LinkedIn profile",
//           nullable: true
//         }
//       },
//       required: [
//         "firstName",
//         "lastName",
//         "professionalHeadline",
//         "email",
//         "phone",
//         "location",
//         "country"
//       ]
//     },
//     // ... giữ nguyên phần còn lại của schema hiện tại
//   },
//   required: [
//     "personalInfo",
//     "summary",
//     "education",
//     "experience",
//     "skills",
//     "projects",
//     "certifications",
//     "languages",
//   ]
// };

// Default system instruction
// const DEFAULT_SYSTEM_INSTRUCTION = "You are a helpful AI assistant. Please follow the user's instructions carefully.";

// // Default safety settings
// const DEFAULT_SAFETY_SETTINGS = [
//   { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
//   { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
//   { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
//   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
// ];

// // Default generation config cho CV extraction
// const DEFAULT_CV_GENERATION_CONFIG = {
//   temperature: 1,
//   topP: 0.95,
//   topK: 40,
//   maxOutputTokens: 8192,
//   responseMimeType: "application/json",
//   responseSchema: CV_EXTRACT_RESPONSE_SCHEMA
// };

// /**
//  * @desc    Extract CV data from text using Gemini API
//  * @route   POST /api/extract/cv
//  * @access  Private
//  */
// const extractCVFromText = async (req, res) => {
//   try {
//     // Xử lý dữ liệu đầu vào
//     let text;
    
//     // Kiểm tra và xử lý req.body
//     if (typeof req.body === 'string') {
//       try {
//         const parsedBody = JSON.parse(req.body);
//         text = parsedBody.text;
//       } catch (parseError) {
//         return res.status(400).json({
//           status: 'error',
//           code: 'INVALID_REQUEST_FORMAT',
//           message: 'Invalid JSON format in request body',
//           error: parseError.message
//         });
//       }
//     } else if (req.body && typeof req.body === 'object') {
//       text = req.body.text;
//     } else {
//       return res.status(400).json({
//         status: 'error',
//         code: 'VALIDATION_ERROR',
//         message: 'Request body is required'
//       });
//     }

//     // Validate input
//     if (!text || text.trim() === '') {
//       return res.status(400).json({
//         status: 'error',
//         code: 'VALIDATION_ERROR',
//         message: 'Text content is required'
//       });
//     }
    
//     // Đảm bảo text là chuỗi an toàn
//     text = String(text).trim();

//     // Lấy config Gemini theo taskName 'extract_cv' và có isActive = true, nếu không có thì dùng mặc định
//     let geminiConfig = await GeminiApiConfig.findOne({ taskName: 'extract_cv', isActive: true });
//     let modelName, generationConfig, systemInstruction, safetySettings;
    
//     if (geminiConfig) {
//       console.log('đã lấy được config extract_cv từ DB');
//       modelName = geminiConfig.modelName;
      
//       // Convert Mongoose object to plain JavaScript object and clean up
//       const dbGenerationConfig = geminiConfig.generationConfig ? 
//           JSON.parse(JSON.stringify(geminiConfig.generationConfig)) : {};
      
//       // Remove any Mongoose specific fields
//       delete dbGenerationConfig.$__;
//       delete dbGenerationConfig.$isNew;
//       delete dbGenerationConfig._doc;
//       delete dbGenerationConfig.$__parent;

//       // Merge with default config, ensuring responseSchema is included
//       generationConfig = {
//           ...DEFAULT_CV_GENERATION_CONFIG,
//           ...dbGenerationConfig,
//           responseSchema: CV_EXTRACT_RESPONSE_SCHEMA // Always use our schema
//       };
//       generationConfig.responseMimeType = DEFAULT_CV_GENERATION_CONFIG.responseMimeType;
//       systemInstruction = geminiConfig.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
//       if (geminiConfig.safetySettings && geminiConfig.safetySettings.length > 0) {
//         // Làm sạch safetySettings nếu nó là Mongoose array
//         safetySettings = JSON.parse(JSON.stringify(geminiConfig.safetySettings));
//       } else {
//         safetySettings = DEFAULT_SAFETY_SETTINGS;
//       }
//     } else {
//       console.log('Không tìm thấy config extract_cv trong DB hoặc config không active, dùng default.');
//       modelName = 'gemini-1.5-flash'; // Model mặc định
//       generationConfig = DEFAULT_CV_GENERATION_CONFIG;
//       systemInstruction = DEFAULT_SYSTEM_INSTRUCTION;
//       safetySettings = DEFAULT_SAFETY_SETTINGS;
//     }

//     // Initialize Gemini API
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) {
//       return res.status(500).json({
//         status: 'error',
//         code: 'CONFIG_ERROR',
//         message: 'Gemini API key is not configured'
//       });
//     }

//     const genAI = new GoogleGenerativeAI(apiKey);
//     const model = genAI.getGenerativeModel({
//       model: modelName,
//       systemInstruction: systemInstruction,
//       safetySettings: safetySettings
//     });

//     try {
//       // Initialize chat session and send the text to Gemini API
//       const chatSession = model.startChat({
//         generationConfig,
//         history: [], // No history, just process the text
//       });

//       // Giữ nguyên phần prompt hiện tại vì nó đã tốt
//       const prompt = `Extract structured CV/resume information from the following text...`;

//       // Send message to Gemini and get response
//       const result = await chatSession.sendMessage(prompt);
      
//       // Phần còn lại của code xử lý response và logging giữ nguyên
//       // ...

//     } catch (aiError) {
//       // Xử lý lỗi AI
//       // ...
//     }
//   } catch (error) {
//     // Xử lý lỗi chung
//     // ...
//   }
// };

module.exports = {
  extractJobDescriptionFromText,
  // extractCVFromText,
}; 