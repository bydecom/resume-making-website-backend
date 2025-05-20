const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { GeminiApiConfig } = require('../models/aiModel');
const KnowledgeModel = require('../models/knowledgeModel');

// Response schema for chatbot
const CHATBOT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    outputMessage: {
      type: "string",
      description: "The message to be shown to the user"
    },
    actionRequired: {
      type: "string",
      description: "Any action required from the user",
      nullable: true
    },
    currentTask: {
      type: "string",
      description: "The current task being handled"
    }
  },
  required: ["outputMessage", "currentTask"]
};

// Default system instruction
const DEFAULT_SYSTEM_INSTRUCTION = "You are a helpful CV/Resume writing assistant. Help users create and improve their CV/Resume content.";

// Default safety settings
const DEFAULT_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
];

// Default generation config
const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.9,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
  responseMimeType: "application/json",
  responseSchema: CHATBOT_RESPONSE_SCHEMA
};

// Validation helper
const validateChatInput = (data) => {
    const errors = [];
    
    if (!data.userMessage?.trim()) {
        errors.push('UserMessage is required');
    }
    if (!data.taskName?.trim()) {
        errors.push('TaskName is required');
    }
    if (!data.currentData) {
        errors.push('CurrentData is required');
    }
    
    return errors;
};

// Helper function to get knowledge by taskName
const getKnowledgeByTaskName = async (taskName) => {
    try {
        // Find all knowledge entries that:
        // 1. Have this exact taskName
        // 2. Are active (isActive = true)
        // 3. Sort by priority (high to low) and then by creation date (newest first)
        const knowledge = await KnowledgeModel.find({
            taskName: taskName,
            isActive: true
        })
        .sort({ priority: -1, createdAt: -1 });

        if (!knowledge || knowledge.length === 0) {
            console.log(`No knowledge found for task: ${taskName}`);
            return null;
        }

        // Process the knowledge data
        const processedKnowledge = knowledge.map(k => ({
            title: k.title,
            description: k.description,
            textContent: k.textContent,
            qaContent: k.qaContent,
            type: k.type,
            priority: k.priority
        }));

        console.log(`Found ${processedKnowledge.length} knowledge entries for task: ${taskName}`);
        return processedKnowledge;
    } catch (error) {
        console.error('Error fetching knowledge:', error);
        throw error;
    }
};

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     tags: [Chatbot]
 *     summary: Get chatbot response
 *     description: Send message to chatbot and get response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userMessage
 *               - taskName
 *               - currentData
 *             properties:
 *               userMessage:
 *                 type: string
 *                 description: Message from user
 *               taskName:
 *                 type: string
 *                 description: Current task name (e.g. CV_SKILLS)
 *               currentData:
 *                 type: object
 *                 description: Current data context
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Hello
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
exports.getChatResponse = async (req, res) => {
    try {
        const validationErrors = validateChatInput(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                status: 'error',
                errors: validationErrors
            });
        }

        const { userMessage, taskName, currentData } = req.body;

        // Lấy config Gemini theo taskName và có isActive = true
        let geminiConfig = await GeminiApiConfig.findOne({ taskName: taskName, isActive: true });
        let modelName, generationConfig, systemInstruction, safetySettings;
        
        if (geminiConfig) {
            console.log(`Đã lấy được config ${taskName} từ DB`);
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
                responseSchema: CHATBOT_RESPONSE_SCHEMA // Always use our schema
            };
            generationConfig.responseMimeType = DEFAULT_GENERATION_CONFIG.responseMimeType;
            
            systemInstruction = geminiConfig.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
            
            if (geminiConfig.safetySettings && geminiConfig.safetySettings.length > 0) {
                safetySettings = JSON.parse(JSON.stringify(geminiConfig.safetySettings));
            } else {
                safetySettings = DEFAULT_SAFETY_SETTINGS;
            }
        } else {
            console.log(`Không tìm thấy config ${taskName} trong DB hoặc config không active, dùng default`);
            modelName = 'gemini-1.5-flash-latest'; // Model mặc định
            generationConfig = DEFAULT_GENERATION_CONFIG;
            systemInstruction = DEFAULT_SYSTEM_INSTRUCTION;
            safetySettings = DEFAULT_SAFETY_SETTINGS;
        }

        // Lấy knowledge theo taskName
        const knowledgeData = await getKnowledgeByTaskName(taskName);

        // Khởi tạo Gemini API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in environment variables.');
            throw new Error('Server configuration error: Missing API Key.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction,
            safetySettings: safetySettings
        });
        const currentFormData = {
            personalInfo: currentData.data.personalInfo,
            summary: currentData.data.summary,
            education: currentData.data.education,
            experience: currentData.data.experience,
            skills: currentData.data.skills,
            projects: currentData.data.projects,
            certifications: currentData.data.certifications,
            languages: currentData.data.languages,
            customFields: currentData.data.customFields,
            roleApply: currentData.data.roleApply
          };
        const jobDescription = currentData.data.jobDescription;
        console.log(jobDescription);
        const cvData = currentData.data.originalCV;
        console.log(cvData);

        try {
            // Khởi tạo chat session
            const chatSession = model.startChat({
                generationConfig,
                history: [], // No history for now
            });

            // Chuẩn bị prompt
            const prompt = `
            The User Message is : ${userMessage}
            Base on User current CV: ${JSON.stringify(cvData, null, 2)}
            Abd Job Description: ${JSON.stringify(jobDescription, null, 2)}
            help User improve Form Data they are editing: ${JSON.stringify(currentFormData, null, 2)}       
            Knowledge To Answer: ${JSON.stringify(knowledgeData, null, 2)}
            Based on the user's message and the provided knowledge:
            1. Use the knowledge content to formulate a helpful response
            2. If the knowledge doesn't contain relevant information, provide a general guidance
            3. Keep the response focused on the current task: ${taskName}
            4. Format the response according to the specified schema with:
            - outputMessage: The main response to show to the user
            - actionRequired: Any specific action the user needs to take (if applicable)
            - currentTask: The current task being handled (${taskName})`;

            // Gửi prompt và nhận response
            const result = await chatSession.sendMessage(prompt);
            const responseText = result.response.text();
            
            // Parse response
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse Gemini response:', parseError);
                // If parsing fails, create a structured response
                parsedResponse = {
                    outputMessage: responseText,
                    currentTask: taskName
                };
            }

            res.status(200).json({
                status: 'success',
                output: parsedResponse,
                knowledge: knowledgeData,
                data: currentData,
                config: geminiConfig
            });
        } catch (aiError) {
            console.error('Gemini API Error:', aiError);
            throw new Error(`AI Processing Error: ${aiError.message}`);
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
