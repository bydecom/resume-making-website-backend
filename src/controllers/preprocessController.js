const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const mime = require("mime-types");

/**
 * @desc    Preprocess CV text data before extraction
 * @route   POST /api/extract/preprocess
 * @access  Private
 */
const preprocessCVText = async (req, res) => {
  try {
    // Extract text from request body
    let text;
    
    // Handle different input formats
    if (typeof req.body === 'string') {
      try {
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
    
    // Ensure text is a safe string
    text = String(text).trim();

    // Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        status: 'error',
        code: 'CONFIG_ERROR',
        message: 'Gemini API key is not configured'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // systemInstruction: "
      systemInstruction: `You are a document analysis expert. I will provide you with scrambled or unstructured CV/resume content. Your job is to extract and reconstruct the essential data as clean key-value pairs in plain text format, with no extra formatting or special characters.
The result must be fully JSON-parser friendly and correct grammar. Use lowercase keys with underscores (e.g., date_of_birth, programming_languages).
Only include relevant information such as name, contact info, education, skills, languages, experience, and projects.

Example output:
name: Minh Bang Thai
date_of_birth: September 2023
gender: male
location: Ho Chi Minh, Vietnam
email: thaibang4903@gmail.com
phone: 0387201261
github: https://github.com/bydecom
objective: I am a final-year information technology student actively seeking full-time job opportunities to broaden my knowledge and gain practical work experience...
education: Information Technology, Ho Chi Minh University of Technology and Education (2021-now)
project_1_title: Predicting A Person Physical Activity Data Analysis
project_1_description: Classify which activities a person is performing...
project_1_language: Python
project_1_responsibilities: Coded Python-based machine learning models...
project_1_source_code: https://github.com/bydecom/PAPPA_Predicting_A_Person_Physical_Activity_Data_Analysis_and_ML
experience_1_title: Admin Manager for Information Collection Site
experience_1_company: MVC Company
experience_1_duration: Jun 2023 - Dec 2023
experience_1_description: Monitor and verify data collected by Combers...
experience_2_title: Business Analyst Intern
experience_2_company: Primas Co., Ltd.
experience_2_duration: July 2024 - January 2025
experience_2_description: Analyzed workflows, designed chatbot flows...
skills: python, analytical problem solving, numerical analysis, teamwork
languages: japanese, english, vietnamese
certifications: software development with Scrum from Axios, Google Cloud Training - Core Infrastructure Fundamentals  
Output only the structured CV in raw text format.`,
    });

    // Configure generation parameters
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    try {
      // Initialize chat session and send the text to Gemini API
      const chatSession = model.startChat({
        generationConfig,
        history: [], // No history, just process the text
      });

      // Send message to Gemini with the CV text
      const result = await chatSession.sendMessage(text);
      const preprocessedText = result.response.text();

      // Return the preprocessed text
      return res.status(200).json({
        status: 'success',
        data: {
          originalText: text,
          preprocessedText: preprocessedText
        },
        message: 'CV text preprocessed successfully hehe'
      });
    } catch (aiError) {
      console.error('Gemini API Error:', aiError);
      return res.status(500).json({
        status: 'error',
        code: 'AI_PROCESSING_ERROR',
        message: 'Failed to preprocess text with AI',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Preprocess CV Error:', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Failed to preprocess CV data',
      error: error.message
    });
  }
};

module.exports = {
  preprocessCVText
}; 