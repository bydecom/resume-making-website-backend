const KnowledgeModel = require('../models/knowledgeModel');

// Validation helper
const validateKnowledgeInput = (data) => {
  const errors = [];
  
  // Check required fields
  if (!data.title?.trim()) {
    errors.push('Title is required');
  }

  // Check if at least one of textContent or qaContent is provided
  if (!data.textContent?.trim() && (!Array.isArray(data.qaContent) || data.qaContent.length === 0)) {
    errors.push('Either textContent or qaContent is required');
  }

  // Validate qaContent structure if provided
  if (data.qaContent && Array.isArray(data.qaContent)) {
    data.qaContent.forEach((qa, index) => {
      if (!qa.question?.trim()) {
        errors.push(`Question is required for Q&A item ${index + 1}`);
      }
      if (!qa.answer?.trim()) {
        errors.push(`Answer is required for Q&A item ${index + 1}`);
      }
    });
  }
  
  // Check taskName
  if (!data.taskName?.trim()) {
    errors.push('Task name is required');
  }
  
  // Check optional fields
  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }
  if (data.priority && (typeof data.priority !== 'number' || data.priority < 0)) {
    errors.push('Priority must be a non-negative number');
  }
  
  return errors;
};

/**
 * @swagger
 * tags:
 *   name: Knowledge
 *   description: Knowledge management endpoints
 */

/**
 * @swagger
 * /api/knowledge:
 *   post:
 *     tags: [Knowledge]
 *     summary: Create new knowledge
 *     description: Create a new knowledge entry (default type is SPECIFIC)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Skills Section Writing Guide"
 *               description:
 *                 type: string
 *                 example: "Hướng dẫn và Q&A về cách viết phần kỹ năng trong CV"
 *               textContent:
 *                 type: string
 *                 example: "# Hướng dẫn viết phần Skills trong CV\n\n## Nguyên tắc cơ bản..."
 *               qaContent:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       example: "Nên liệt kê bao nhiêu kỹ năng trong CV?"
 *                     answer:
 *                       type: string
 *                       example: "Nên liệt kê 5-7 kỹ năng chính cho mỗi nhóm..."
 *               taskName:
 *                 type: string
 *                 example: "CV_SKILLS"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["CV", "skills", "kỹ năng"]
 *               priority:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Knowledge created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Knowledge'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
exports.createKnowledge = async (req, res) => {
  try {
    const validationErrors = validateKnowledgeInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        status: 'error',
        errors: validationErrors 
      });
    }

    const knowledgeData = {
      ...req.body,
      taskName: req.body.type === 'GENERAL' ? 'GENERAL' : req.body.taskName,
      createdBy: req.user?._id
    };

    const knowledge = await KnowledgeModel.create(knowledgeData);
    
    res.status(201).json({
      status: 'success',
      data: knowledge
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/knowledge:
 *   get:
 *     tags: [Knowledge]
 *     summary: Get all knowledge entries
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [GENERAL, SPECIFIC]
 *       - in: query
 *         name: taskName
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of knowledge entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Knowledge'
 */
exports.getAllKnowledge = async (req, res) => {
  try {
    const { type, taskName, tags } = req.query;
    const query = { isActive: true };

    if (type) query.type = type;
    if (taskName) query.taskName = taskName;
    if (tags) query.tags = { $in: tags.split(',') };

    const knowledge = await KnowledgeModel.find(query)
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: knowledge
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/knowledge/{id}:
 *   get:
 *     tags: [Knowledge]
 *     summary: Get knowledge by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Knowledge entry found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Knowledge'
 *       404:
 *         description: Knowledge not found
 */
exports.getKnowledgeById = async (req, res) => {
  try {
    const knowledge = await KnowledgeModel.findById(req.params.id);
    if (!knowledge) {
      return res.status(404).json({
        status: 'error',
        message: 'Knowledge not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: knowledge
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/knowledge/{id}:
 *   put:
 *     tags: [Knowledge]
 *     summary: Update knowledge
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
 *             $ref: '#/components/schemas/Knowledge'
 *     responses:
 *       200:
 *         description: Knowledge updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Knowledge'
 *       404:
 *         description: Knowledge not found
 */
exports.updateKnowledge = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?._id
    };

    const knowledge = await KnowledgeModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!knowledge) {
      return res.status(404).json({
        status: 'error',
        message: 'Knowledge not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: knowledge
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/knowledge/{id}:
 *   delete:
 *     tags: [Knowledge]
 *     summary: Delete knowledge
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Knowledge deleted successfully
 *       404:
 *         description: Knowledge not found
 */
exports.deleteKnowledge = async (req, res) => {
  try {
    const knowledge = await KnowledgeModel.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!knowledge) {
      return res.status(404).json({
        status: 'error',
        message: 'Knowledge not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Knowledge deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/knowledge/task/{taskName}:
 *   put:
 *     tags: [Knowledge]
 *     summary: Update knowledge by taskName
 *     description: Update a knowledge entry by its taskName
 *     parameters:
 *       - in: path
 *         name: taskName
 *         required: true
 *         schema:
 *           type: string
 *         description: Task name to identify the knowledge (e.g. CV_SKILLS)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               textContent:
 *                 type: string
 *               qaContent:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     answer:
 *                       type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Knowledge updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Knowledge'
 *       404:
 *         description: Knowledge not found
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
exports.updateKnowledgeByTaskName = async (req, res) => {
  try {
    const { taskName } = req.params;
    
    // Validate update data
    const validationErrors = validateKnowledgeInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        errors: validationErrors
      });
    }

    // Add updatedBy if authentication is used
    const updateData = {
      ...req.body,
      updatedBy: req.user?._id
    };

    // Use the static method from model
    const knowledge = await KnowledgeModel.updateByTaskName(taskName, updateData);

    res.status(200).json({
      status: 'success',
      data: knowledge
    });
  } catch (error) {
    // Handle specific errors
    if (error.message.includes('No knowledge found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }

    // Handle other errors
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}; 