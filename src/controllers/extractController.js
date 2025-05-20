const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const UserLog = require('../models/userLogModel');
const { GeminiApiConfig } = require('../models/aiModel');

// Response schema for CV extraction
const CV_EXTRACT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    personalInfo: {
      type: "object",
      properties: {
        firstName: {
          type: "string"
        },
        lastName: {
          type: "string"
        },
        professionalHeadline: {
          type: "string",
          description: "Professional title"
        },
        email: {
          type: "string",
          description: "Email"
        },
        phone: {
          type: "string",
          description: "Phone number"
        },
        location: {
          type: "string",
          description: "Location but not include country"
        },
        country: {
          type: "string",
          description: "Country only",
          nullable: true
        },
        website: {
          type: "string",
          description: "Link to the website, portfolio, blog, github (can be extrated from project link), there is no space between the link and the text",
          nullable: true
        },
        linkedin: {
          type: "string",
          description: "LinkedIn profile,there is no space between the link and the text",
          nullable: true
        }
      },
      required: [
        "firstName",
        "lastName",
        "professionalHeadline",
        "email",
        "phone",
        "location",
        "country"
      ]
    },
    summary: {
      type: "string",
      description: "Summary of the candidate write as a description of the candidate with the professional voice",
      maxLength: 2000
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          degree: {
            type: "string"
          },
          institution: {
            type: "string"
          },
          startDate: {
            type: "string",
            nullable: true
          },
          endDate: {
            type: "string",
            nullable: true
          },
          description: {
            type: "string"
          },
          isPresent: {
            type: "boolean",
            nullable: true
          }
        },
        required: [
          "degree",
          "institution",
          "startDate"
        ]
      }
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          position: {
            type: "string",
            description: "Job title"
          },
          company: {
            type: "string",
            description: "Company name"
          },
          startDate: {
            type: "string",
            description: "Start date (YYYY-MM)",
            nullable: true
          },
          endDate: {
            type: "string",
            description: "End date (YYYY-MM), empty if still working",
            nullable: true
          },
          description: {
            type: "string",
            description: "Detailed description of the job and achievements extrated from the text, IMPORTANT: MUST BE EXTRACTED FROM THE TEXT",
            nullable: false
          },
          isPresent: {
            type: "boolean",
            description: "Is this job currently",
            nullable: true
          }
        },
        required: [
          "position",
          "description",
          "company",
          "startDate"
        ]
      }
    },
    skills: {
      type: "array",
      items: {
        type: "string",
        description: "Skill in the CV's skills section and/or mentioned in the descriptions of past work experiences or projects, indicating its relevance. It Must Be Short (No more than 3 words) And At least 5 skills, if the text not have any skill, you should suggest 5 skills based on the title, position of the cv and the description of the cv"
      }
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Project name"
          },
          role: {
            type: "string",
            description: "Role in the project",
            enum: ["Developer", "Designer", "Manager", "Collaborator", "Leader", "Team member"]
          },
          startDate: {
            type: "string",
            description: "Start date (YYYY-MM)",
            nullable: true
          },
          endDate: {
            type: "string",
            description: "End date (YYYY-MM), empty if still working",
            nullable: true
          },
          description: {
            type: "string",
            description: "Detailed description of the project and contributions"
          },
          url: {
            type: "string",
            description: "Link to the project (if any)",
            nullable: true
          },
          isPresent: {
            type: "boolean",
            description: "Is this project currently",
            nullable: true
          }
        },
        required: [
          "title",
          "role",
          "startDate"
        ]
      }
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Full name of the certification",
            nullable: true
          },
          issuer: {
            type: "string",
            description: "Issuing organization",
            nullable: true
          },
          date: {
            type: "string",
            description: "Date of the certification (YYYY-MM)",
            nullable: true
          },
          url: {
            type: "string",
            description: "Link to the certification (if any). ",
            nullable: true
          }
        },
        required: [
          "name",
          "issuer",
          "date"
        ]
      }
    },
    languages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          language: {
            type: "string",
            description: "Language name"
          },
          proficiency: {
            type: "string",
            description: "Language proficiency (Native, Fluent, Intermediate, Basic)",
            enum: ["Native", "Fluent", "Intermediate", "Basic"]
          }
        },
        required: [
          "language",
          "proficiency"
        ]
      }
    },
    additionalInfo: {
      type: "object",
      properties: {
        interests: {
          type: "string",
          description: "Interests of the candidate, NULL if not have",
          nullable: true
        },
        achievements: {
          type: "string",
          description: "Achievements of the candidate, NULL if not have",
          nullable: true
        },
        publications: {
          type: "string",
          description: "Publications of the candidate, NULL if not have",
          nullable: true
        },
        references: {
          type: "string",
          description: "References of the candidate, NULL if not have",
          nullable: true
        }
      }
    },
    customFields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "Label of the custom field"
          },
          value: {
            type: "string",
            description: "Value of the custom field"
          }
        },
        required: [
          "label",
          "value"
        ]
      }
    }
  },
  required: [
    "personalInfo",
    "summary",
    "education",
    "experience",
    "skills",
    "projects",
    "certifications",
    "languages",
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
  responseSchema: CV_EXTRACT_RESPONSE_SCHEMA
};

/**
 * @desc    Extract CV data from text using Gemini API
 * @route   POST /api/extract/cv
 * @access  Private
 */
const extractCVFromText = async (req, res) => {
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

    // Lấy config Gemini theo taskName 'extract_cv' và có isActive = true, nếu không có thì dùng mặc định
    let geminiConfig = await GeminiApiConfig.findOne({ taskName: 'extract_cv', isActive: true });
    let modelName, generationConfig, systemInstruction, safetySettings;
    
    if (geminiConfig) {
      console.log('đã lấy được config extract_cv từ DB');
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
          responseSchema: CV_EXTRACT_RESPONSE_SCHEMA // Always use our schema
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
      console.log('Không tìm thấy config extract_cv trong DB hoặc config không active, dùng default.');
      modelName = 'gemini-1.5-flash-latest'; // Model mặc định
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
      const prompt = `Extract structured CV/resume information from the following text. 
      Analyze the text carefully and extract all relevant professional details.
      
      Text of raw CV to analyze:
      ${text}
      
      Please extract and structure the information according to the following guidelines:
      
      - Personal information: Extract full name (split into firstName and lastName), email, phone, location, country, website, and LinkedIn profile.
      - Professional title: Based on the provided CV, extract or infer the most appropriate professional title that accurately reflects the candidate's role, seniority level, and area of expertise. This field is MANDATORY and should be included as personalInfo.professionalHeadline in the response. For example: "Senior Business Analyst with 5+ years of experience", or "Mid-level Backend Software Engineer with 3 years in Node.js and cloud infrastructure."
      - Summary/Professional summary: A concise overview of the person's career and expertise.
      - Education: List all educational qualifications with degree, institution, start and end dates (in YYYY-MM format), description, and whether it's current (isPresent).
      - Work experience: Details of all professional roles with title, company, start and end dates (in YYYY-MM format), description, and whether it's current (isPresent).
      - Skills: List of professional skills and competencies.
      - Projects: Any significant projects with title, role, dates, description, URL/link, and current status.
      - Certifications: Professional certifications with name, issuing organization, date, and URL.
      - Languages: Languages known with proficiency level.
      - Additional information: Any other relevant details like interests, achievements, publications, and references.
      - Now is 2025, so if the candidate is still a student, you should add "Student" to the professionalHeadline field.
      For dates, use YYYY-MM format (e.g., 2020-05). For URLs, include the full address with http/https prefix.
      
      IMPORTANT: You MUST include a professionalHeadline field within the personalInfo object, even if you have to infer it from the experience or skills.`;

      // Send message to Gemini and get response
      const result = await chatSession.sendMessage(prompt);
      
      // Safely try to parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(result.response.text());
        
        // Ensure professionalHeadline exists
        if (parsedData && parsedData.personalInfo) {
          if (!parsedData.personalInfo.professionalHeadline) {
            // If missing, add a default based on experience or set a generic one
            if (parsedData.experience && parsedData.experience.length > 0) {
              // Find the most relevant job title (prioritize non-intern positions)
              let bestTitle = "";
              
              // First look for non-intern positions
              for (const job of parsedData.experience) {
                if (job.title && !job.title.toLowerCase().includes("intern")) {
                  // Extract main role from longer titles (e.g., "Admin Manager" from "Admin Manager for...")
                  const mainTitle = job.title.split(" for ")[0].split(" (")[0];
                  bestTitle = mainTitle;
                  break;
                }
              }
              
              // If no non-intern position found, use the most recent job
              if (!bestTitle && parsedData.experience[0].title) {
                bestTitle = parsedData.experience[0].title;
              }
              
              // Default fallback
              parsedData.personalInfo.professionalHeadline = bestTitle || "Professional";
            } else if (parsedData.summary) {
              // Try to extract from summary
              const summaryWords = parsedData.summary.split(" ");
              // Look for common job titles in the summary
              const commonTitles = ["Developer", "Engineer", "Analyst", "Designer", "Manager", "Student", "Collaborator", "Leader", "Team member"];
              
              for (const title of commonTitles) {
                if (parsedData.summary.includes(title)) {
                  const wordIndex = summaryWords.findIndex(word => word.includes(title));
                  if (wordIndex > 0) {
                    // Try to get the word before as qualifier (e.g., "Software Engineer")
                    parsedData.personalInfo.professionalHeadline = summaryWords[wordIndex-1] + " " + title;
                  } else {
                    parsedData.personalInfo.professionalHeadline = title;
                  }
                  break;
                }
              }
              
              // If still not found, use education
              if (!parsedData.personalInfo.professionalHeadline && 
                  parsedData.education && 
                  parsedData.education.length > 0 && 
                  parsedData.education[0].degree) {
                parsedData.personalInfo.professionalHeadline = parsedData.education[0].degree + " Student";
              } else if (!parsedData.personalInfo.professionalHeadline) {
                parsedData.personalInfo.professionalHeadline = "Professional";
              }
            } else {
              // Set a generic professional title as last resort
              parsedData.personalInfo.professionalHeadline = "Professional";
            }
            console.log('Added missing professionalHeadline field');
          }
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
        action: 'extract_cv_from_text',
        entityType: 'CV',
        details: {
          textLength: text.length,
          extractedData: {
            personalInfo: parsedData.personalInfo ? {
              firstName: parsedData.personalInfo.firstName,
              lastName: parsedData.personalInfo.lastName,
              professionalHeadline: parsedData.personalInfo.professionalHeadline
            } : 'Unknown',
            experienceCount: parsedData.experience ? parsedData.experience.length : 0,
            educationCount: parsedData.education ? parsedData.education.length : 0,
            skillsCount: parsedData.skills ? parsedData.skills.length : 0,
            timestamp: new Date()
          },
          success: true
        },
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      // Return the structured CV data
      return res.status(200).json({
        status: 'success',
        data: parsedData,
        message: 'CV data extracted successfully'
      });
    } catch (aiError) {
      // Log the failed extraction attempt
      await UserLog.create({
        userId: req.user._id,
        action: 'extract_cv_from_text',
        entityType: 'CV',
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
    console.error('Extract CV Error:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to extract CV data',
      error: error.message
    });
  }
};

module.exports = {
  extractCVFromText
}; 