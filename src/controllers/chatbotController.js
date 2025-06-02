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
    },
    actions: {
      type: "array",
      description: "List of suggested actions or UI elements to show",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Type of action (e.g., SUGGEST_OPTIONS, SHOW_EXAMPLES, etc.)"
          },
          options: {
            type: "array",
            description: "List of options for SUGGEST_OPTIONS type",
            items: {
              type: "string"
            }
          },
          exampleType: {
            type: "string",
            description: "Type of examples to show for SHOW_EXAMPLES type"
          },
          templates: {
            type: "array",
            description: "List of templates for SHOW_TEMPLATES type",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                thumbnailName: { type: "string" }
              }
            }
          }
        }
      }
    }
  },
  required: ["outputMessage", "currentTask"]
};

// Intent Detection Schema
const INTENT_DETECTION_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      description: "The detected intent from user message"
    },
    confidence: {
      type: "number",
      description: "Confidence score of the intent detection"
    },
    taskName: {
      type: "string",
      description: "Mapped task name based on the intent"
    }
  },
  required: ["intent", "confidence", "taskName"]
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

// Intent Detection Configuration
const INTENT_GENERATION_CONFIG = {
  temperature: 0.1,
  topP: 0.8,
  topK: 20,
  maxOutputTokens: 1024,
  responseMimeType: "application/json",
  responseSchema: INTENT_DETECTION_SCHEMA
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

// Update validateFormData to safely handle chat history
const validateFormData = (data) => {
    if (!data) return {};

    const result = {};
    
    // Only add fields that exist and are valid in the data
    if (data.personalInfo && typeof data.personalInfo === 'object') result.personalInfo = data.personalInfo;
    if (data.summary && typeof data.summary === 'string') result.summary = data.summary;
    if (Array.isArray(data.education)) result.education = data.education;
    if (Array.isArray(data.experience)) result.experience = data.experience;
    if (Array.isArray(data.skills)) result.skills = data.skills;
    if (Array.isArray(data.projects)) result.projects = data.projects;
    if (Array.isArray(data.certifications)) result.certifications = data.certifications;
    if (Array.isArray(data.languages)) result.languages = data.languages;
    if (Array.isArray(data.customFields)) result.customFields = data.customFields;
    if (data.roleApply && typeof data.roleApply === 'string') result.roleApply = data.roleApply;
    if (Array.isArray(data.chatHistory)) result.chatHistory = data.chatHistory;

    return result;
};

// Update normalizeInputData to handle chat history
const normalizeInputData = (currentData) => {
    if (!currentData) return { data: {} };
    
    // If currentData already has personalInfo directly, it means it's the data itself
    if (currentData.personalInfo || currentData.summary || currentData.experience) {
        return { 
            data: currentData,
            chatHistory: currentData.chatHistory || []
        };
    }
    
    // If currentData is already in the correct format (has data property), return as is
    if (currentData.data) {
        return {
            ...currentData,
            chatHistory: currentData.chatHistory || []
        };
    }
    
    // Default case: wrap the data
    return { 
        data: currentData || {},
        chatHistory: currentData.chatHistory || []
    };
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

// Function to detect intent
const detectIntent = async (userMessage, genAI, chatHistory = []) => {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            safetySettings: DEFAULT_SAFETY_SETTINGS
        });

        // Get available tasks from database
        const taskDescriptions = await KnowledgeModel.getTaskDescriptions();
        
        // Format task descriptions for the prompt
        const taskDescriptionText = taskDescriptions
            .map(task => `- ${task.taskName}: ${task.description || task.title}`)
            .join('\n');

        // Format chat history for context
        const formattedHistory = chatHistory
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const prompt = `
        ${formattedHistory ? `Previous Conversation Context:\n${formattedHistory}\n\n` : ''}
        Based on the conversation context above (if any) and the current user message, analyze and detect the most appropriate intent and map it to a task name.
        
        Current User Message: "${userMessage}"

        Available Task Names and Descriptions:
        ${taskDescriptionText}

        Note: 
        1. If the user's question doesn't clearly match any specific task, use "GENERAL" as the taskName.
        2. Consider the conversation context to understand if the user is:
           - Continuing a previous topic
           - Changing to a new topic
           - Asking a follow-up question
           - Starting a new conversation

        Return the intent, confidence score, and mapped task name in the specified schema format.
        YOU MUST determine whether it is referring to a resume or a CV, and use the appropriate summary accordingly.
        Be very strict in mapping to these exact task names.
        If unsure, default to GENERAL with lower confidence.
        
        Guidelines for confidence scoring:
        - 0.9-1.0: Perfect match with task description, clear from context
        - 0.7-0.9: Clear match but might have some ambiguity
        - 0.5-0.7: Moderate match with some uncertainty
        - 0.3-0.5: Weak match, multiple possible interpretations
        - 0.0-0.3: Very uncertain or no clear match

        Consider these factors for confidence scoring:
        1. Direct keyword matches in current message
        2. Semantic relevance to task description
        3. Conversation context and flow
        4. Previous topic continuity
        5. Clarity of user's intent`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: INTENT_GENERATION_CONFIG,
        });

        const response = result.response;
        const responseText = response.text();
        const parsedResponse = JSON.parse(responseText);

        // Validate that the detected taskName exists in our database
        const availableTaskNames = await KnowledgeModel.getUniqueActiveTaskNames();
        if (!availableTaskNames.includes(parsedResponse.taskName)) {
            console.warn(`Detected invalid taskName: ${parsedResponse.taskName}. Falling back to GENERAL`);
            return {
                intent: parsedResponse.intent,
                confidence: 0.3,
                taskName: 'GENERAL'
            };
        }

        return parsedResponse;
    } catch (error) {
        console.error('Intent detection error:', error);
        // Default fallback
        return {
            intent: "general_query",
            confidence: 0.5,
            taskName: "GENERAL"
        };
    }
};

// Helper to validate and format chat history for Gemini
const formatChatHistoryForGemini = (history) => {
    if (!Array.isArray(history) || history.length === 0) return [];

    // Ensure first message is from user
    if (history[0].role === 'assistant') {
        console.log('Removing assistant message from start of history');
        history = history.slice(1);
    }

    // If no messages left after removing initial assistant message
    if (history.length === 0) return [];

    return history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));
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
        console.log('Raw request body:', JSON.stringify(req.body, null, 2));
        
        const validationErrors = validateChatInput(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                status: 'error',
                errors: validationErrors
            });
        }

        const { userMessage, taskName: currentTaskName, currentData } = req.body;
        console.log('Extracted currentData:', JSON.stringify(currentData, null, 2));
        
        const normalizedData = normalizeInputData(currentData);
        console.log('After normalization:', JSON.stringify(normalizedData, null, 2));
        
        const currentFormData = validateFormData(normalizedData.data);
        console.log('After validation:', JSON.stringify(currentFormData, null, 2));
        
        // Extract and format chat history
        const rawChatHistory = normalizedData.chatHistory || [];
        const formattedGeminiHistory = formatChatHistoryForGemini(rawChatHistory);
        console.log('Formatted Gemini History:', JSON.stringify(formattedGeminiHistory, null, 2));
        
        // Only get jobDescription and cvData if they exist
        const jobDescription = normalizedData.data?.jobDescription;
        const cvData = normalizedData.data?.originalCV || currentFormData;

        // Initialize Gemini API once
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in environment variables.');
            throw new Error('Server configuration error: Missing API Key.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Detect intent first - now with chat history
        const intentResult = await detectIntent(userMessage, genAI, rawChatHistory);
        console.log('Detected intent:', intentResult);

        // Get knowledge based on detected intent's taskName
        const knowledgeData = await getKnowledgeByTaskName(intentResult.taskName);
        console.log(`Getting knowledge for detected task: ${intentResult.taskName}`);

        // Use current task for UI context, but get config based on intent's task
        let geminiConfig = await GeminiApiConfig.findOne({ 
            taskName: intentResult.taskName, 
            isActive: true 
        });
        
        let modelName, generationConfig, systemInstruction, safetySettings;
        
        if (geminiConfig) {
            console.log(`Đã lấy được config ${intentResult.taskName} từ DB`);
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
                responseSchema: CHATBOT_RESPONSE_SCHEMA
            };
            generationConfig.responseMimeType = DEFAULT_GENERATION_CONFIG.responseMimeType;
            
            systemInstruction = geminiConfig.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
            
            if (geminiConfig.safetySettings && geminiConfig.safetySettings.length > 0) {
                safetySettings = JSON.parse(JSON.stringify(geminiConfig.safetySettings));
            } else {
                safetySettings = DEFAULT_SAFETY_SETTINGS;
            }
        } else {
            console.log(`Không tìm thấy config ${intentResult.taskName} trong DB hoặc config không active, dùng default`);
            modelName = 'gemini-1.5-flash-latest';
            generationConfig = DEFAULT_GENERATION_CONFIG;
            systemInstruction = DEFAULT_SYSTEM_INSTRUCTION;
            safetySettings = DEFAULT_SAFETY_SETTINGS;
        }

        try {
            // Initialize model for chat
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction,
                safetySettings: safetySettings
            });

            // Build base prompt without chat history
            let promptParts = [
                `Current User Message: ${userMessage}`,
                `Current UI Context Task: ${currentTaskName}`,
                `Detected Intent Task: ${intentResult.taskName}`,
                ''  // Empty line for spacing
            ];

            // Only add CV data if it exists and has content
            if (cvData && Object.keys(cvData).length > 0) {
                promptParts.push(`Base on User current CV: ${JSON.stringify(cvData, null, 2)}`);
            }

            // Only add job description if it exists
            if (jobDescription) {
                promptParts.push(`And Job Description: ${JSON.stringify(jobDescription, null, 2)}`);
            }

            // Only add form data if it has content
            if (Object.keys(currentFormData).length > 0) {
                promptParts.push(`Current Form Data: ${JSON.stringify(currentFormData, null, 2)}`);
            }

            // Add knowledge base info
            if (knowledgeData && knowledgeData.length > 0) {
                promptParts.push(`Knowledge To Answer: ${JSON.stringify(knowledgeData, null, 2)}`);
            }

            // Add detected intent information
            promptParts.push(`Detected Intent: ${JSON.stringify(intentResult, null, 2)}`);

            // Add instructions
            promptParts.push(`
            Based on the user's message and the available information:
            1. ${knowledgeData ? 'Use the knowledge content to formulate a helpful response' : 'Provide general guidance based on best practices'}
            2. Focus on helping the user with their question about ${intentResult.taskName.toLowerCase().replace(/_/g, ' ')}
            3. Note that while the user is in the ${currentTaskName} section, they are asking about ${intentResult.taskName}
            4. Provide guidance that is relevant to their question, regardless of their current section
            5. Consider the chat history for context when formulating your response
            6. Include appropriate actions in your response (e.g., SUGGEST_OPTIONS, SHOW_EXAMPLES)

            Format the response according to the specified schema with:
            - outputMessage: The main response to show to the user, focused on their specific question
            - actionRequired: Any specific action the user needs to take (if applicable)
            - currentTask: Keep this as their current UI context (${currentTaskName}) to maintain UI state
            - actions: Array of suggested actions or UI elements (if applicable)`);

            const prompt = promptParts.join('\n\n');

            // Initialize chat session with formatted history
            const chatSession = model.startChat({
                generationConfig,
                history: formattedGeminiHistory
            });

            // Send the current message
            const result = await chatSession.sendMessage(prompt);
            const responseText = result.response.text();
            
            // Parse response
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse Gemini response:', parseError);
                parsedResponse = {
                    outputMessage: responseText,
                    currentTask: currentTaskName,
                    actions: []
                };
            }

            // Add the new message to chat history
            const updatedHistory = [
                ...rawChatHistory,
                { 
                    role: 'user', 
                    content: userMessage,
                    timestamp: new Date().toISOString()
                },
                { 
                    role: 'assistant', 
                    content: parsedResponse.outputMessage,
                    timestamp: new Date().toISOString()
                }
            ];

            res.status(200).json({
                status: 'success',
                output: parsedResponse,
                knowledge: knowledgeData,
                data: normalizedData,
                config: geminiConfig,
                detectedIntent: intentResult,
                currentUITask: currentTaskName,
                chatHistory: updatedHistory
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
