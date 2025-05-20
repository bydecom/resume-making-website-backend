const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

/**
 * Tiện ích để tạo đánh giá CV tự động sử dụng Gemini API
 */
class AIEvaluationService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
  }

  /**
   * Tạo prompt cho AI để đánh giá CV
   * @param {Object} cv - Dữ liệu CV cần đánh giá
   * @returns {String} - Prompt cho AI
   */
  _createPrompt(cv) {
    return `
    Please evaluate the following CV and provide:
    1. An overall score from 0-100
    2. A completion progress percentage from 0-100
    3. 3-5 strengths of the CV
    4. 3-5 suggestions for improvements

    CV Data:
    ${JSON.stringify(cv, null, 2)}

    Format your response as a valid JSON object with the following structure:
    {
      "score": number,
      "progress": number,
      "strengths": [string],
      "improvements": [string]
    }
    `;
  }

  /**
   * Tạo cấu hình cho việc generate nội dung
   * @returns {Object} - Cấu hình generation
   */
  _getGenerationConfig() {
    return {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 1024,
      responseSchema: {
        type: "object",
        properties: {
          score: {
            type: "number",
            description: "Overall CV score from 0-100"
          },
          progress: {
            type: "number",
            description: "CV completion progress percentage from 0-100"
          },
          strengths: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of CV strengths"
          },
          improvements: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of CV improvement suggestions"
          }
        },
        required: ["score", "progress", "strengths", "improvements"]
      }
    };
  }

  /**
   * Đánh giá CV sử dụng AI
   * @param {Object} cvData - Dữ liệu CV cần đánh giá
   * @returns {Promise<Object>} - Kết quả đánh giá
   */
  async evaluateCV(cvData) {
    try {
      const prompt = this._createPrompt(cvData);
      const generationConfig = this._getGenerationConfig();

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const responseText = response.text();
      
      // Parse JSON từ phản hồi của AI
      const evaluationData = JSON.parse(responseText);
      
      // Validate dữ liệu
      if (
        typeof evaluationData.score !== 'number' || 
        typeof evaluationData.progress !== 'number' || 
        !Array.isArray(evaluationData.strengths) || 
        !Array.isArray(evaluationData.improvements)
      ) {
        throw new Error('Invalid response format from AI');
      }
      
      return {
        score: evaluationData.score,
        progress: evaluationData.progress,
        strengths: evaluationData.strengths,
        improvements: evaluationData.improvements
      };
    } catch (error) {
      console.error('Error in AI evaluation:', error);
      throw error;
    }
  }

  /**
   * Đánh giá CV từ dữ liệu gửi lên
   * @param {Object} cvData - Dữ liệu CV gửi lên từ frontend
   * @returns {Promise<Object>} - Kết quả đánh giá
   */
  async evaluateCVFromData(cvData) {
    return this.evaluateCV(cvData);
  }
}

module.exports = new AIEvaluationService(); 