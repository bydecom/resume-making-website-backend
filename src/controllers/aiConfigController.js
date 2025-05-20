const { GeminiApiConfig } = require('../models/aiModel');
const asyncHandler = require('express-async-handler');

// Lấy tất cả cấu hình
const getAllConfigs = asyncHandler(async (req, res) => {
  const configs = await GeminiApiConfig.find().sort({ createdAt: -1 });
  res.json({ success: true, data: configs });
});

// Lấy cấu hình theo id
const getConfigById = asyncHandler(async (req, res) => {
  const config = await GeminiApiConfig.findById(req.params.id);
  if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
  res.json({ success: true, data: config });
});

// Tạo mới cấu hình
const createConfig = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (await GeminiApiConfig.findOne({ name })) {
    return res.status(400).json({ success: false, message: 'Config name must be unique' });
  }
  const config = await GeminiApiConfig.create(req.body);
  res.status(201).json({ success: true, data: config });
});

// Cập nhật cấu hình
const updateConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const config = await GeminiApiConfig.findById(id);
  if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
  
  // Check for unique name if name is being updated
  if (req.body.name && req.body.name !== config.name) {
    if (await GeminiApiConfig.findOne({ name: req.body.name })) {
      return res.status(400).json({ success: false, message: 'Config name must be unique' });
    }
  }

  // Handle isActive separately
  if (req.body.isActive !== undefined) {
    config.isActive = req.body.isActive;
    // The pre-save middleware will handle deactivating other configs with the same taskName if needed
  }

  // Update other fields
  const updateFields = { ...req.body };
  delete updateFields.isActive; // Remove isActive from the update fields
  Object.assign(config, updateFields);

  await config.save();
  res.json({ success: true, data: config });
});

// Xóa cấu hình
const deleteConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const config = await GeminiApiConfig.findById(id);
  if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
  await config.deleteOne();
  res.json({ success: true, message: 'Config deleted' });
});

// Đặt cấu hình active
const setActiveConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const config = await GeminiApiConfig.findById(id);
  if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
  
  config.isActive = true;
  // The pre-save middleware will handle deactivating other configs with the same taskName
  await config.save();
  
  res.json({ success: true, data: config });
});

// Lấy cấu hình theo tên task (taskName)
const getConfigByTaskName = asyncHandler(async (req, res) => {
  const { taskName } = req.params;
  // Tìm config có description hoặc name chứa taskName (case-insensitive)
  const config = await GeminiApiConfig.findOne({
    $or: [
      { name: new RegExp('^' + taskName + '$', 'i') },
      { description: new RegExp(taskName, 'i') },
      { taskName: new RegExp('^' + taskName + '$', 'i') } // nếu có trường taskName
    ]
  });
  if (!config) return res.status(404).json({ success: false, message: 'Config not found for taskName' });
  res.json({ success: true, data: config });
});

module.exports = {
  getAllConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig,
  setActiveConfig,
  getConfigByTaskName
}; 