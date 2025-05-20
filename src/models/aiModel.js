const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     AIModelConfig:
 *       type: object
 *       required:
 *         - name
 *         - provider
 *         - model
 *         - type
 *         - taskName
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109ca
 *         name:
 *           type: string
 *           description: Tên cấu hình
 *           example: "GPT-4 Chatbot Config"
 *         provider:
 *           type: string
 *           description: Nhà cung cấp AI
 *           example: "OpenAI"
 *         model:
 *           type: string
 *           description: Tên model
 *           example: "gpt-4"
 *         apiKey:
 *           type: string
 *           description: API key
 *           example: "sk-xxx..."
 *         endpoint:
 *           type: string
 *           description: Endpoint custom (nếu có)
 *           example: "https://api.openai.com/v1/chat/completions"
 *         params:
 *           type: object
 *           description: Các tham số cấu hình model
 *           example: {"temperature": 0.7, "max_tokens": 2000}
 *         type:
 *           type: string
 *           enum: [CHATBOT, TOOL]
 *           description: Loại AI
 *           example: "CHATBOT"
 *         taskName:
 *           type: string
 *           description: Tên nhiệm vụ sử dụng model này
 *           example: "resume_chat"
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Có đang được sử dụng không
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     GeminiApiConfig:
 *       type: object
 *       required:
 *         - name
 *         - apiKey
 *         - modelName
 *         - taskName
 *       properties:
 *         name:
 *           type: string
 *           description: Unique config name
 *           example: "Gemini Resume Assistant"
 *         description:
 *           type: string
 *           description: Short description of this config
 *           example: "Gemini model for resume creation assistance"
 *         apiKey:
 *           type: string
 *           description: Gemini API key (can be empty to use .env)
 *           example: "AIzaSyXXX..."
 *         modelName:
 *           type: string
 *           description: Gemini model name
 *           enum: [gemini-1.5-flash-latest, gemini-1.5-flash-001, gemini-1.5-pro-latest]
 *           example: "gemini-1.5-pro-latest"
 *         systemInstruction:
 *           type: string
 *           description: System prompt for the model
 *           example: "You are a professional resume writing assistant..."
 *         taskName:
 *           type: string
 *           description: Task name for this config (e.g. match_resume)
 *           example: "resume_creation"
 *         type:
 *           type: string
 *           enum: [CHATBOT, TOOL]
 *           description: Type of AI model
 *           example: "CHATBOT"
 *         generationConfig:
 *           type: object
 *           properties:
 *             temperature:
 *               type: number
 *               example: 0.9
 *             topP:
 *               type: number
 *               example: 1.0
 *             topK:
 *               type: number
 *               example: 1
 *             maxOutputTokens:
 *               type: number
 *               example: 2048
 *             stopSequences:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["END", "STOP"]
 *         safetySettings:
 *           type: array
 *           items:
 *             type: object
 *             required: [category, threshold]
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [HARM_CATEGORY_HARASSMENT, HARM_CATEGORY_HATE_SPEECH, HARM_CATEGORY_SEXUALLY_EXPLICIT, HARM_CATEGORY_DANGEROUS_CONTENT]
 *                 example: "HARM_CATEGORY_HARASSMENT"
 *               threshold:
 *                 type: string
 *                 enum: [BLOCK_NONE, BLOCK_ONLY_HIGH, BLOCK_LOW_AND_ABOVE, BLOCK_MEDIUM_AND_ABOVE]
 *                 example: "BLOCK_MEDIUM_AND_ABOVE"
 *         isActive:
 *           type: boolean
 *           description: Mark this config as active
 *           example: true
 */

const safetySettingSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'HARM_CATEGORY_HARASSMENT',
      'HARM_CATEGORY_HATE_SPEECH',
      'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'HARM_CATEGORY_DANGEROUS_CONTENT',
    ],
    description: "Harmful content category to block."
  },
  threshold: {
    type: String,
    required: true,
    enum: [
      'BLOCK_NONE',
      'BLOCK_ONLY_HIGH',
      'BLOCK_LOW_AND_ABOVE',
      'BLOCK_MEDIUM_AND_ABOVE',
    ],
    description: "Block threshold for the corresponding category."
  }
}, {_id: false});

const generationConfigSchema = new mongoose.Schema({
  temperature: {
    type: Number,
    min: 0.0,
    max: 2.0,
    default: 0.9,
    description: "Controls randomness. Higher values (e.g. 1.0) are more creative, lower (e.g. 0.2) are more deterministic."
  },
  topP: {
    type: Number,
    min: 0.0,
    max: 1.0,
    default: 1.0,
    description: "Nucleus sampling. Considers tokens with cumulative probability topP. Lower values limit token choices."
  },
  topK: {
    type: Number,
    min: 1,
    default: 1,
    description: "Considers the topK most likely tokens. Lower values limit token choices."
  },
  maxOutputTokens: {
    type: Number,
    min: 1,
    default: 2048,
    description: "Maximum number of tokens generated in the response."
  },
  stopSequences: {
    type: [String],
    default: [],
    description: "A list of sequences that will cause text generation to stop when encountered."
  },
  responseSchema: {
    type: mongoose.Schema.Types.Mixed, 
    default: null, 
    description: "The JSON schema that the model's response should adhere to. This will set responseMimeType to application/json."
  }
}, {_id: false});

const geminiApiConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Config name is required"],
    unique: true,
    trim: true,
    description: "Unique identifier for this config."
  },
  description: {
    type: String,
    trim: true,
    description: "Short description of this config."
  },
  apiKey: {
    type: String,
    required: [true, "API Key is required"],
    trim: false,
    description: "Google AI Studio or Google Cloud Vertex AI API Key."
  },
  modelName: {
    type: String,
    default: 'gemini-1.5-flash-latest',
    enum: ['gemini-1.5-flash-latest', 'gemini-1.5-flash-001', 'gemini-1.5-pro-latest'],
    description: "Gemini model name to use."
  },
  systemInstruction: {
    type: String,
    trim: true,
    default: null,
    description: "System prompt to shape model behavior for the whole conversation or task."
  },
  taskName: {
    type: String,
    required: [true, "Task name is required"],
    unique: true,
    trim: true,
    description: "Task name for this config (e.g. 'extract_cv', 'chat', ...)."
  },
  generationConfig: {
    type: generationConfigSchema,
    default: () => ({})
  },
  safetySettings: {
    type: [safetySettingSchema],
    default: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ],
    description: "Content safety filter config."
  },
  isActive: {
    type: Boolean,
    default: false,
    description: "Mark this config as active. Only one config should be active at a time."
  },
  type: {
    type: String,
    enum: ['CHATBOT', 'TOOL'],
    default: 'CHATBOT',
    description: "Type of AI model."
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

geminiApiConfigSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  next();
});

geminiApiConfigSchema.pre('save', async function(next) {
  if (this.isModified('isActive')) {
    if (this.isActive) {
      await this.constructor.updateMany(
        { 
          _id: { $ne: this._id }, 
          taskName: this.taskName,
          isActive: true 
        },
        { isActive: false }
      );
    }
  }
  next();
});

const GeminiApiConfig = mongoose.model('GeminiApiConfig', geminiApiConfigSchema);

// If you want to keep AIModelConfig for other providers:
const aiModelConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  provider: { type: String, required: true },
  model: { type: String, required: true },
  apiKey: { type: String },
  endpoint: { type: String },
  params: { type: Object, default: {} },
  type: { type: String, enum: ['CHATBOT', 'TOOL'], required: true },
  taskName: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const AIModelConfig = mongoose.model('AIModelConfig', aiModelConfigSchema);

module.exports = { GeminiApiConfig, AIModelConfig };
