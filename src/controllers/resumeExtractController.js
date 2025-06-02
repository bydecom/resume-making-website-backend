const { GoogleGenerativeAI } = require('@google/generative-ai');
const CV = require('../models/cvModel');
const Resume = require('../models/resumeModel');
const JobDescription = require('../models/jobDescriptionModel');
const asyncHandler = require('express-async-handler');
const UserLog = require('../models/userLogModel');
const { GeminiApiConfig } = require('../models/aiModel');

// Response schema for Gemini API
const RESUME_MATCH_RESPONSE_SCHEMA = {
  "type": "object",
  "properties": {
    "personalInfoData": {
      "type": "object",
      "properties": {
        "firstName": { "type": "string", "description": "Suggested first name based on CV, possibly standardized." },
        "lastName": { "type": "string", "description": "Suggested last name based on CV, possibly standardized." },
        "professionalHeadline": {
          "type": "string",
          "description": "A professional headline tailored to the job description and the role being applied for (maps to 'roleApply' and 'personalInfo.professionalHeadline')."
        },
        "email": { "type": "string", "description": "Candidate's email address from CV." },
        "phone": { "type": "string", "description": "Candidate's phone number from CV." },
        "location": { "type": "string", "description": "Candidate's location (e.g., City, State) from CV." },
        "country": { "type": "string", "description": "Candidate's country from CV." },
        "website": { "type": "string", "description": "Candidate's personal website or portfolio link from CV." },
        "linkedin": { "type": "string", "description": "Candidate's LinkedIn profile URL from CV." }
      },
      "description": "Personal information extracted and potentially refined from the CV, suitable for the 'personalInfo' section and 'roleApply' of the resume.",
      "required": ["professionalHeadline"]
    },
    "matchedSummaryContent": {
      "type": "string",
      "description": "The resume summary, rewritten or highlighted to strongly align with the key requirements and keywords from the job description. This maps to the 'summary' field in the resume.",
      "maxLength": 2000
    },
    "educationData": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "degree": { "type": "string", "description": "Degree obtained (e.g., Bachelor's, Master's, PhD)." },
          "institution": { "type": "string", "description": "Name of the educational institution." },
          "startDate": { "type": "string", "description": "Start date of education (e.g., YYYY-MM, YYYY)." },
          "endDate": { "type": "string", "description": "End date of education (e.g., YYYY-MM, YYYY, or 'Present')." },
          "isPresent": { "type": "boolean", "description": "True if currently studying here." },
          "description": { "type": "string", "description": "Description of education, relevant coursework, achievements, potentially tailored to JD." },
          "relevance": { "type": "integer", "minimum": 0, "maximum": 100, "description": "AI-assessed relevance score (0-100) of this education to the job description." },
          "comment": { "type": "string", "description": "AI analysis or comment on how this education matches the job requirements or suggestions for improvement." }
        },
        "required": ["degree", "institution"]
      },
      "description": "Education history from the CV, with AI-assessed relevance and comments related to the job description."
    },
    "matchedExperience": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "position": { "type": "string", "description": "Job title (e.g., Software Engineer)." },
          "company": { "type": "string", "description": "Company name." },
          "startDate": { "type": "string", "description": "Start date of employment (e.g., YYYY-MM, YYYY)." },
          "endDate": { "type": "string", "description": "End date of employment (e.g., YYYY-MM, YYYY, or 'Present')." },
          "isPresent": { "type": "boolean", "description": "True if currently working here." },
          "description": { "type": "string", "description": "Description of responsibilities and achievements, tailored to highlight relevance to the job description." },
          "relevance": { "type": "integer", "minimum": 0, "maximum": 100, "description": "AI-assessed relevance score (0-100) of this experience to the job description." },
          "comment": { "type": "string", "description": "AI analysis or comment on how this experience matches the job requirements or suggestions for improvement." }
        },
        "required": ["position", "company", "description"]
      },
      "description": "Work experiences from the CV, analyzed and described in context of the job description, with AI-assessed relevance."
    },
    "matchedSkills": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "skill": { "type": "string", "description": "Name of the skill (e.g., JavaScript, Project Management)." },
          "relevance": { "type": "integer", "minimum": 0, "maximum": 100, "description": "AI-assessed relevance score (0-100) of this skill to the job description." },
          "comment": { "type": "string", "description": "AI analysis or comment on the importance of this skill for the job, or if it's a key skill mentioned in JD." }
        },
        "required": ["skill"]
      },
      "description": "Skills extracted from the CV, with AI-assessed relevance to the job description and comments."
    },
    "matchedProjects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string", "description": "Name of the project." },
          "role": { "type": "string", "description": "Your role in the project." },
          "startDate": { "type": "string", "description": "Start date of the project (e.g., YYYY-MM, YYYY)." },
          "endDate": { "type": "string", "description": "End date of the project (e.g., YYYY-MM, YYYY, or 'Ongoing')." },
          "isPresent": { "type": "boolean", "description": "True if the project is ongoing." },
          "description": { "type": "string", "description": "Project description, emphasizing aspects relevant to the job description (e.g., technologies used, outcomes achieved)." },
          "url": { "type": "string", "description": "URL/link to the project if available." },
          "relevance": { "type": "integer", "minimum": 0, "maximum": 100, "description": "AI-assessed relevance score (0-100) of this project to the job description." },
          "comment": { "type": "string", "description": "AI analysis or comment on how this project showcases skills relevant to the job." }
        },
        "required": ["title", "description"]
      },
      "description": "Projects from the CV, detailed and analyzed for relevance to the job description."
    },
    "matchedCertifications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Name of the certification." },
          "issuer": { "type": "string", "description": "Issuing organization." },
          "date": { "type": "string", "description": "Date obtained (e.g., YYYY-MM, YYYY)." },
          "url": { "type": "string", "description": "URL to the certificate or verification if available." },
          "relevance": { "type": "integer", "minimum": 0, "maximum": 100, "description": "AI-assessed relevance score (0-100) of this certification to the job description." },
          "comment": { "type": "string", "description": "AI analysis or comment on the significance of this certification for the role." }
        },
        "required": ["name", "issuer"]
      },
      "description": "Certifications from the CV, with AI-assessed relevance to the job description."
    },
    "matchedLanguages": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "language": { "type": "string", "description": "Name of the language spoken." },
          "proficiency": { "type": "string", "description": "Proficiency level (e.g., Native, Fluent, Conversational)." },
          "relevance": { "type": "integer", "minimum": 0, "maximum": 100, "description": "AI-assessed relevance score (0-100) if the language is mentioned or implied as useful in the job description." },
          "comment": { "type": "string", "description": "AI analysis or comment, especially if the language is a requirement or an asset for the job." }
        },
        "required": ["language", "proficiency"]
      },
      "description": "Language skills from the CV, with AI-assessed relevance to the job description."
    },
    "additionalInfoData": {
      "type": "object",
      "properties": {
        "interests": { "type": "string", "description": "Summary of interests from CV, possibly tailored if relevant to company culture or role." },
        "achievements": { "type": "string", "description": "Summary of other achievements or awards from CV, highlighting any relevant to the job." },
        "publications": { "type": "string", "description": "Summary of publications from CV, if any and relevant." },
        "references": { "type": "string", "description": "Statement about references (e.g., 'Available upon request') or actual reference details if provided and appropriate to include." }
      },
      "description": "Content for the 'additionalInfo' section of the resume, extracted and possibly refined from the CV based on job description relevance."
    },
    "customFieldsData": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": { "type": "string", "description": "The label or name of the custom field (e.g., Portfolio, GitHub)." },
          "value": { "type": "string", "description": "The value or content of the custom field (e.g., URL, username)." }
        },
        "required": ["label", "value"]
      },
      "description": "Custom fields extracted from the resume, presented as label-value pairs."
    }
  },
  "required": [
    "personalInfoData",
    "matchedSummaryContent",
    "educationData",
    "matchedExperience",
    "matchedSkills",
    "matchedProjects",
    "matchedCertifications",
    "matchedLanguages",
  ]
};
const DEFAULT_SYSTEM_INSTRUCTION = "You are a helpful AI assistant. Please follow the user's instructions carefully.";
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
    responseSchema: RESUME_MATCH_RESPONSE_SCHEMA
};

// Khởi tạo Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @desc    Create a tailored resume from CV and JD
 * @route   POST /api/resumes/match
 * @access  Private
 */
const extractResumeFromCVAndJD = asyncHandler(async (req, res) => {
    const { cvId, jobDescriptionId, templateId } = req.body;

    // Check input
    if (!cvId || !jobDescriptionId) {
        res.status(400);
        throw new Error('Please provide both CV ID and Job Description ID');
    }

    try {
        // Get CV information
        const cv = await CV.findById(cvId);
        if (!cv) {
            res.status(404);
            throw new Error('CV not found');
        }

        // Check ownership of CV
        if (cv.userId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to access this CV');
        }

        // Get Job Description information
        const jobDescription = await JobDescription.findById(jobDescriptionId);
        if (!jobDescription) {
            res.status(404);
            throw new Error('Job Description not found');
        }

        // Check ownership of Job Description
        if (jobDescription.userId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to access this Job Description');
        }

        // Get Gemini config by taskName 'match_resume' and isActive = true, if not found use default
        let geminiConfig = await GeminiApiConfig.findOne({ taskName: 'match_resume', isActive: true });
        let modelName, generationConfig, systemInstruction, safetySettings;
        
        if (geminiConfig) {
            console.log('đã lấy được từ DB');
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
                
                responseSchema: RESUME_MATCH_RESPONSE_SCHEMA // Always use our schema
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
            console.log('Not found config in DB or config is not active, using default.');
            modelName = 'gemini-1.5-flash'; // Default model
            generationConfig = DEFAULT_GENERATION_CONFIG;
            systemInstruction = DEFAULT_SYSTEM_INSTRUCTION;
            safetySettings = DEFAULT_SAFETY_SETTINGS;
        }

        // Luôn dùng API key từ env cho bảo mật
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) { // Kiểm tra API key
          console.error('GEMINI_API_KEY is not set in environment variables.');
          res.status(500);
          throw new Error('Server configuration error: Missing API Key.');
      }
        const genAI = new GoogleGenerativeAI(apiKey);

        // Tạo prompt cho Gemini
        const prompt = `
        Analyze the following CV and Job Description to create a tailored resume.
        
        CV Information:
        ${JSON.stringify(cv, null, 2)}
        
        Job Description:
        ${JSON.stringify(jobDescription, null, 2)}
        
        Please analyze the CV and Job Description to:
        1. Match relevant experiences
        2. Identify matching skills
        3. Select appropriate education background
        4. Choose relevant projects
        5. Include relevant certifications
        6. List required languages
        7. Match the role of the resume with the job description
        For each matched item, provide:
        - A relevance score (0-100)
        - A comment explaining why it's relevant
        
        
        Return the result in the specified JSON schema format.
        `;

        // Gọi Gemini API
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction,
            systemInstruction: systemInstruction,
            safetySettings: safetySettings
        });

        try {
            // Initialize chat session and send the text to Gemini API
            const chatSession = model.startChat({
                generationConfig,
                history: [], // No history, just process the text
            });

            // Send message to Gemini and get response
            const result = await chatSession.sendMessage(prompt);
            
            // Safely try to parse JSON
            let matchedData;
            try {
                matchedData = JSON.parse(result.response.text());
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

            // Create new resume with templateId
            const resume = await Resume.create({
                userId: req.user._id,
                cvId: cv._id,
                jobDescriptionId: jobDescription._id,
                name: `Resume for ${cv.personalInfo.firstName} ${cv.personalInfo.lastName} - ${jobDescription.position}`,
                template: templateId ? {
                    id: templateId,
                    name: getTemplateName(templateId) 
                } : {
                    id: "professionalBlue",
                    name: "Professional Blue"
                },
                personalInfo: cv.personalInfo,
                summary: matchedData.matchedSummaryContent,
                roleApply: jobDescription.position,
                education: matchedData.educationData,
                matchedExperience: matchedData.matchedExperience,
                matchedSkills: matchedData.matchedSkills,
                matchedProjects: matchedData.matchedProjects,
                matchedCertifications: matchedData.matchedCertifications,
                matchedLanguages: matchedData.matchedLanguages,
                additionalInfo: matchedData.additionalInfoData,
                customFields: matchedData.customFieldsData,
                status: 'draft',
                isDefault: false
            });

            // Log create resume (create_resume)
            await UserLog.create({
                userId: req.user._id,
                action: 'create_resume',
                entityId: resume._id,
                entityType: 'Resume',
                details: {
                    resumeName: resume.name,
                    roleApply: resume.roleApply,
                    cvId: resume.cvId,
                    jobDescriptionId: resume.jobDescriptionId,
                    timestamp: new Date()
                },
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            // Log the extraction action
            await UserLog.create({
                userId: req.user._id,
                action: 'extract_resume_from_cv_jd',
                entityId: resume._id,
                entityType: 'Resume',
                details: {
                    cvId: cv._id,
                    cvName: `${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`,
                    jobDescriptionId: jobDescription._id,
                    jobTitle: jobDescription.position,
                    companyName: jobDescription.companyName,
                    resumeId: resume._id,
                    resumeName: resume.name,
                    skillsCount: matchedData.matchedSkills ? matchedData.matchedSkills.length : 0,
                    experienceCount: matchedData.matchedExperience ? matchedData.matchedExperience.length : 0,
                    timestamp: new Date(),
                    success: true
                },
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            res.status(201).json({
                success: true,
                data: resume,
                message: 'Resume created successfully'
            });

        } catch (error) {
            // Log the failed extraction attempt
            await UserLog.create({
                userId: req.user._id,
                action: 'extract_resume_from_cv_jd',
                entityType: 'Resume',
                details: {
                    cvId: cvId,
                    jobDescriptionId: jobDescriptionId,
                    error: error.message,
                    timestamp: new Date(),
                    success: false
                },
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            console.error('Error in extractResumeFromCVAndJD:', error);
            res.status(500);
            throw new Error('Error processing resume extraction: ' + error.message);
        }
    } catch (error) {
        console.error('Error in extractResumeFromCVAndJD:', error);
        res.status(500);
        throw new Error('Error processing resume extraction: ' + error.message);
    }
});

// Helper function to get template name from ID
function getTemplateName(templateId) {
    const templates = {
        "professionalBlue": "Professional Blue",
        "modernMinimal": "Modern Minimal",
        "creativeDesign": "Creative Design",
        "corporateClassic": "Corporate Classic",
        "default": "Default Template"
    };
    
    return templates[templateId] || "Default Template";
}

// Define response schema for resumeTips
const RESUME_TIPS_RESPONSE_SCHEMA = {
          type: "object",
          properties: {
            personalInformationTips: {
              type: "object",
              description: "Tips and example for the personal information section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "Tips for the personal information of the resume based on the job description.",
                  items: {
                    type: "string",
                    description: "A specific tip for the personal information section."
                  }
                },
                example: {
                  type: "object",
                  description: "Example of the personal information for the resume based on the job description.",
                  properties: {
                    name: { type: "string", description: "Example of the name for the personal information section." },
                    email: { type: "string", description: "Example email address." },
                    phone: { type: "string", description: "Example phone number." }
                  },
                  required: ["name", "email", "phone"]
        }
                }
            },
            summaryTips: {
              type: "object",
              description: "Tips and example for the summary section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "Tips for the summary of the resume based on the job description.",
                  items: {
                    type: "string",
                    description: "A specific tip for the summary section."
                  }
                },
                example: {
                  type: "object",
                  description: "Example of the summary for the resume based on the job description.",
                  properties: {
                    title: { type: "string", description: "Example of the title of the summary (e.g., Frontend Developer, Full Stack Developer)." },
                    description: { type: "string", description: "Example of the summary content (e.g., Skilled frontend developer with 4+ years...)." }
                  },
                  required: ["title", "description"]
        }
      }
            },
            experienceTips: {
              type: "object",
      description: "Tips and example for the experience section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "Tips for the experience section of the resume based on the job description.",
                  items: {
                    type: "string",
                    description: "A specific tip for the experience section."
                  }
                },
                example: {
                  type: "object",
                  description: "Example of an experience entry for the resume based on the job description.",
                  properties: {
                    title: { type: "string", description: "Example of the job title for an experience entry (e.g., Frontend Developer)." },
                    description: { type: "string", description: "Example of the responsibilities and achievements for an experience entry (e.g., Developed responsive web applications...)." }
                  },
                  required: ["title", "description"]
        }
                }
            },
            educationTips: {
              type: "object",
              description: "Tips and example for the education section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "A list of tips for the education section.",
                  items: { type: "string", description: "A specific tip for the education section." }
                },
                example: { type: "string", description: "Example of an education entry (e.g., 'B.S. in Computer Science, University of Tech, 2020')." }
              }
            },
            skillTips: {
              type: "object",
              description: "Tips and example for the skills section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "A list of tips for the skills section.",
                  items: { type: "string", description: "A specific tip for the skills section." }
                },
                example: { type: "string", description: "Example of skills (e.g., 'JavaScript, React, Node.js, Python, SQL')." }
              }
            },
            projectTips: {
              type: "object",
              description: "Tips and example for the projects section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "A list of tips for the projects section.",
                  items: { type: "string", description: "A specific tip for the projects section." }
                },
                example: { type: "string", description: "Example of a project entry (e.g., 'Personal Portfolio Website: Designed and developed a responsive portfolio using React and Netlify.')." }
              }
            },
            certificationTips: {
              type: "object",
              description: "Tips and example for the certifications section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "A list of tips for the certifications section.",
                  items: { type: "string", description: "A specific tip for the certifications section." }
                },
                example: { type: "string", description: "Example of a certification (e.g., 'AWS Certified Solutions Architect - Associate, 2021')." }
              }
            },
            languagesTips: {
              type: "object",
              description: "Tips and example for the languages section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "A list of tips for the languages section.",
                  items: { type: "string", description: "A specific tip for the languages section." }
                },
                example: { type: "string", description: "Example of languages (e.g., 'English (Native), Spanish (Conversational)')." }
              }
            },
            activitiesTips: {
              type: "object",
              description: "Tips and example for the activities/extracurricular section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "A list of tips for the activities section.",
                  items: { type: "string", description: "A specific tip for the activities section." }
                },
                example: { type: "string", description: "Example of an activity (e.g., 'Member of University Coding Club, 2018-2020')." }
              }
            },
            additionalInformationTips: {
              type: "object",
              description: "Tips and examples for the additional information section of the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "A list of tips for the additional information section.",
                  items: { type: "string", description: "A specific tip for the additional information section." }
                },
                example: {
                  type: "object",
                  description: "Example of various additional information categories.",
                  properties: {
            interests: {
                      type: "array",
                      description: "Example of interests.",
                      items: { type: "string", description: "An example interest (e.g., 'Open Source Contribution')." }
                    },
            achievements: {
                      type: "array",
                      description: "Example of achievements.",
                      items: { type: "string", description: "An example achievement (e.g., 'Dean's List 2019')." }
                    },
            publications: {
                      type: "array",
                      description: "Example of publications.",
              items: { type: "string", description: "An example publication (e.g., 'Paper on AI Ethics, Tech Journal 2022')." }
                    },
            references: {
              type: "object",
                      description: "Example of a reference.",
                      properties: {
                        name: { type: "string", description: "Example of the name of the reference." },
                        position: { type: "string", description: "Example of the position of the reference." },
                        company: { type: "string", description: "Example of the company of the reference." },
                email: { type: "string", description: "Example of the email of the reference." },
                        phone: { type: "string", description: "Example of the phone number of the reference." },
                        relationship: { type: "string", description: "Example of the relationship to the reference." }
                      },
                      required: ["name", "position", "company", "email"] 
            }
                  },
                  required: ["interests", "achievements"] 
                }
              }
            },
            customFieldsTips: {
              type: "object",
              description: "Tips and example for custom fields in the resume based on the job description.",
              properties: {
                tips: {
                  type: "array",
                  description: "A list of tips for custom fields.",
                  items: {
                    type: "string",
                    description: "A specific tip for a custom field."
                  }
                },
                example: { type: "string", description: "Example of a custom field entry (e.g., 'Portfolio Link: myportfolio.com')." }
              }
            }
          },
          required: [
            "personalInformationTips", 
            "summaryTips",
            "experienceTips",
            "educationTips",
            "skillTips",
            "projectTips",
            "certificationTips",
            "languagesTips",
            "activitiesTips",
            "additionalInformationTips",
            "customFieldsTips"
          ]
};

// Default generation config cho resumeTips
const DEFAULT_TIPS_GENERATION_CONFIG = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: RESUME_TIPS_RESPONSE_SCHEMA
};

/**
 * @desc    Get tips for resume based on CV and Job Description
 * @route   POST /api/resumes/tips
 * @access  Private
 */
const extractResumeTips = asyncHandler(async (req, res) => {
  try {
    // Lấy cvId và jobDescriptionId từ request body
    const { cvId, jobDescriptionId } = req.body;

    // Validate input
    if (!cvId || !jobDescriptionId) {
      res.status(400);
      throw new Error('Please provide both CV ID and Job Description ID');
    }

    // Lấy thông tin CV
    const cv = await CV.findById(cvId);
    if (!cv) {
      res.status(404);
      throw new Error('CV not found');
    }

    // Kiểm tra quyền sở hữu CV
    if (cv.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this CV');
    }

    // Lấy thông tin Job Description
    const jobDescription = await JobDescription.findById(jobDescriptionId);
    if (!jobDescription) {
      res.status(404);
      throw new Error('Job Description not found');
    }

    // Kiểm tra quyền sở hữu Job Description
    if (jobDescription.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this Job Description');
    }

    // Lấy config Gemini theo taskName 'extract_resume_tips' và có isActive = true, nếu không có thì dùng mặc định
    let geminiConfig = await GeminiApiConfig.findOne({ taskName: 'extract_resume_tips', isActive: true });
    let modelName, generationConfig, systemInstruction, safetySettings;
    
    if (geminiConfig) {
      console.log('đã lấy được config extract_resume_tips từ DB');
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
          ...DEFAULT_TIPS_GENERATION_CONFIG,
          ...dbGenerationConfig,
          
          responseSchema: RESUME_TIPS_RESPONSE_SCHEMA // Always use our schema
      };
      generationConfig.responseMimeType = DEFAULT_TIPS_GENERATION_CONFIG.responseMimeType;
      systemInstruction = geminiConfig.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
      if (geminiConfig.safetySettings && geminiConfig.safetySettings.length > 0) {
        // Làm sạch safetySettings nếu nó là Mongoose array
        safetySettings = JSON.parse(JSON.stringify(geminiConfig.safetySettings));
      } else {
        safetySettings = DEFAULT_SAFETY_SETTINGS;
      }
    } else {
      console.log('Không tìm thấy config extract_resume_tips trong DB hoặc config không active, dùng default.');
      modelName = 'gemini-1.5-flash'; // Model mặc định
      generationConfig = DEFAULT_TIPS_GENERATION_CONFIG;
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

    // Tạo prompt cho Gemini
        const prompt = `Analyze the following job description and provide detailed tips for creating a resume/CV.
  
  Text of Job Description to analyze:
  ${JSON.stringify(jobDescription, null, 2)}
  base on this CV:
  ${JSON.stringify(cv, null, 2)}
  
  Please provide tips and examples for each section of the resume:
  1. Personal Information: How to present personal details effectively
  2. Summary: How to write an impactful summary that matches the job requirements
  3. Experience: How to highlight relevant experience and achievements
  4. Education: How to present educational background effectively
  5. Skills: Which skills to emphasize and how to present them
  6. Projects: What types of projects to highlight
  7. Certifications: Relevant certifications to include
  8. Languages: How to present language skills
  9. Activities: Relevant activities to include
  10. Additional Information: What extra information might be valuable
  11. Custom Fields: Any special sections that might be relevant
  
  For each section, provide:
  - 3-4 tips for the resume to follow JD
  - Specific tips based on the job description
  - Concrete examples where applicable
  - Explanations of why certain elements are important
  
  Return the structured tips in the specified JSON schema format.`;

    // Gọi Gemini API
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
  
        // Send message to Gemini and get response
        const result = await chatSession.sendMessage(prompt);
        
        // Safely try to parse JSON
        let parsedData;
        try {
          parsedData = JSON.parse(result.response.text());
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
            action: 'extract_resume_tips',
            entityType: 'Resume',
            details: {
                cvId: cv._id,
                cvName: `${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`,
                jobDescriptionId: jobDescription._id,
                jobTitle: jobDescription.position,
                companyName: jobDescription.companyName,
                tipCategories: Object.keys(parsedData), 
                summaryTipCount: parsedData.summaryTips && parsedData.summaryTips.tips ? parsedData.summaryTips.tips.length : 0,
                experienceTipCount: parsedData.experienceTips && parsedData.experienceTips.tips ? parsedData.experienceTips.tips.length : 0,
                timestamp: new Date(),
                success: true
            },
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });
  
        // Return the structured resume tips data
        return res.status(200).json({
          status: 'success',
          data: parsedData,
          message: 'Resume tips extracted successfully'
        });
      } catch (aiError) {
        // Log the failed extraction attempt
        await UserLog.create({
            userId: req.user._id,
            action: 'extract_resume_tips',
            entityType: 'Resume',
            details: {
                cvId: cv._id,
                jobDescriptionId: jobDescription._id,
                error: aiError.message,
                timestamp: new Date(),
                success: false
            },
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        console.error('Gemini API Error:', aiError);
      res.status(500);
      throw new Error('Error processing AI request: ' + aiError.message);
      }
    } catch (error) {
      console.error('Extract Resume Tips Error:', error);
    res.status(error.statusCode || 500);
    throw new Error('Failed to extract resume tips: ' + error.message);
    }
});

module.exports = {
    extractResumeFromCVAndJD,
    extractResumeTips
}; 