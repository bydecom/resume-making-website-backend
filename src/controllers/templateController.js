const Template = require('../models/templateModel');
const { createAdminLog } = require('../services/adminLogService');
const CV = require('../models/cvModel');
const Resume = require('../models/resumeModel');
const UserLog = require('../models/userLogModel');

/**
 * @desc    Lấy tất cả templates (cả active và inactive)
 * @route   GET /api/templates
 * @access  Private (Admin)
 */
exports.getAllTemplates = async (req, res) => {
    try {
        const templates = await Template.find()
            .select('-__v')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: templates,
            message: 'Templates retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting templates:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

/**
 * @desc    Lấy tất cả templates đang active
 * @route   GET /api/templates/active
 * @access  Public
 */
exports.getActiveTemplates = async (req, res) => {
    try {
        const templates = await Template.find({ isActive: true })
            .select('-__v')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: templates,
            message: 'Active templates retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting active templates:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

/**
 * @desc    Lấy template theo ID
 * @route   GET /api/templates/:templateId
 * @access  Public
 */
exports.getTemplateById = async (req, res) => {
    try {
        const template = await Template.findOne({ templateId: req.params.templateId })
            .select('-__v');

        if (!template) {
            return res.status(404).json({
                status: 'error',
                message: 'Template not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: template,
            message: 'Template retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting template:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

/**
 * @desc    Cập nhật metadata của template
 * @route   PUT /api/templates/:templateId
 * @access  Private (Admin)
 */
exports.updateTemplate = async (req, res) => {
    try {
        const { name, description, previewImage, category, isDefault, isActive } = req.body;
        const template = await Template.findOne({ templateId: req.params.templateId });

        if (!template) {
            return res.status(404).json({
                status: 'error',
                message: 'Template not found'
            });
        }

        // Nếu template này được set làm default, bỏ default của các template khác
        if (isDefault) {
            await Template.updateMany(
                { templateId: { $ne: req.params.templateId } },
                { isDefault: false }
            );
        }

        template.name = name || template.name;
        template.description = description || template.description;
        template.previewImage = previewImage || template.previewImage;
        template.category = category || template.category;
        template.isDefault = isDefault !== undefined ? isDefault : template.isDefault;
        template.isActive = isActive !== undefined ? isActive : template.isActive;

        await template.save();

        // Log admin action
        await createAdminLog({
            adminId: req.user._id,
            action: 'update_template',
            details: {
                templateId: template.templateId,
                changes: req.body,
                timestamp: new Date()
            }
        }, req);

        res.status(200).json({
            status: 'success',
            data: template,
            message: 'Template updated successfully'
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

/**
 * @desc    Đồng bộ templates từ frontend
 * @route   POST /api/templates/sync
 * @access  Private (Admin)
 */
exports.syncTemplates = async (req, res) => {
    try {
        const { templates } = req.body;
        
        if (!Array.isArray(templates)) {
            return res.status(400).json({
                status: 'error',
                message: 'Templates must be an array'
            });
        }

        // Xử lý từng template
        const results = await Promise.all(templates.map(async (template) => {
            const { id, name, description, previewImage, category, isDefault, isActive } = template;

            // Tìm template trong DB
            let existingTemplate = await Template.findOne({ templateId: id });

            if (existingTemplate) {
                // Cập nhật template đã tồn tại
                existingTemplate.name = name;
                existingTemplate.description = description;
                existingTemplate.previewImage = previewImage;
                existingTemplate.category = category;
                existingTemplate.isDefault = isDefault;
                existingTemplate.isActive = isActive;

                await existingTemplate.save();
                return { status: 'updated', templateId: id };
            } else {
                // Tạo template mới
                const newTemplate = await Template.create({
                    templateId: id,
                    name,
                    description,
                    previewImage,
                    category,
                    isDefault,
                    isActive
                });
                return { status: 'created', templateId: id };
            }
        }));

        // Log admin action
        await createAdminLog({
            adminId: req.user._id,
            action: 'sync_templates',
            details: {
                results,
                timestamp: new Date()
            }
        }, req);

        res.status(200).json({
            status: 'success',
            data: results,
            message: 'Templates synchronized successfully'
        });
    } catch (error) {
        console.error('Error syncing templates:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to sync templates'
        });
    }
};

/**
 * @desc    Lấy thống kê tất cả templates
 * @route   GET /api/templates/stats
 * @access  Private (Admin)
 */
exports.getAllTemplateStats = async (req, res) => {
    try {
        // Lọc theo khoảng thời gian nếu có
        let startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        let endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        const { period } = req.query;

        if (period && !startDate) {
            endDate = new Date();
            if (period === '7d') {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 7);
            } else if (period === '30d') {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 30);
            } else if (period === '90d') {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 90);
            } else if (period === '365d' || period === '1y') {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 365);
            }
        }

        // Lấy tất cả templates
        const templates = await Template.find().select('-__v');

        // Thống kê cho từng template
        const stats = await Promise.all(templates.map(async (template) => {
            // Điều kiện thời gian cho logs
            const timeFilter = {};
            if (startDate && endDate) {
                timeFilter.timestamp = { $gte: startDate, $lte: endDate };
            }

            // 1. Tổng số CV đã tạo với template này
            const totalCVs = await CV.countDocuments({ 
                'template.id': template.templateId,
            });
            
            // 2. Số CV đang active với template này (chưa bị xóa)
            const activeCVs = await CV.countDocuments({ 
                'template.id': template.templateId,
                is_deleted: false
            });

            // 3. Tổng số Resume đã tạo với template này
            const totalResumes = await Resume.countDocuments({ 
                'template.id': template.templateId,
            });
            
            // 4. Số Resume đang active với template này (chưa bị xóa)
            const activeResumes = await Resume.countDocuments({ 
                'template.id': template.templateId,
                is_deleted: false
            });

            // 5. Số lượt download CV
            const cvDownloads = await UserLog.countDocuments({
                action: 'download_cv',
                'details.templateId': template.templateId,
                ...timeFilter
            });

            // 6. Số lượt download Resume
            const resumeDownloads = await UserLog.countDocuments({
                action: 'download_resume',
                'details.templateId': template.templateId,
                ...timeFilter
            });

            return {
                templateId: template.templateId,
                name: template.name,
                isActive: template.isActive,
                isDefault: template.isDefault,
                usage: {
                    cv: {
                        total: totalCVs,
                        active: activeCVs,
                        downloads: cvDownloads
                    },
                    resume: {
                        total: totalResumes,
                        active: activeResumes,
                        downloads: resumeDownloads
                    },
                    total: {
                        created: totalCVs + totalResumes,
                        active: activeCVs + activeResumes,
                        downloads: cvDownloads + resumeDownloads
                    }
                }
            };
        }));

        // Tính tổng số liệu của tất cả templates
        const totals = stats.reduce((acc, curr) => {
            return {
                cv: {
                    total: acc.cv.total + curr.usage.cv.total,
                    active: acc.cv.active + curr.usage.cv.active,
                    downloads: acc.cv.downloads + curr.usage.cv.downloads
                },
                resume: {
                    total: acc.resume.total + curr.usage.resume.total,
                    active: acc.resume.active + curr.usage.resume.active,
                    downloads: acc.resume.downloads + curr.usage.resume.downloads
                },
                total: {
                    created: acc.total.created + curr.usage.total.created,
                    active: acc.total.active + curr.usage.total.active,
                    downloads: acc.total.downloads + curr.usage.total.downloads
                }
            };
        }, {
            cv: { total: 0, active: 0, downloads: 0 },
            resume: { total: 0, active: 0, downloads: 0 },
            total: { created: 0, active: 0, downloads: 0 }
        });

        res.status(200).json({
            status: 'success',
            data: {
                templates: stats,
                totals
            },
            message: 'Template statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting template statistics:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

/**
 * @desc    Lấy thống kê của một template cụ thể
 * @route   GET /api/templates/:templateId/stats
 * @access  Private (Admin)
 */
exports.getTemplateStats = async (req, res) => {
    try {
        const { templateId } = req.params;

        // Tìm template
        const template = await Template.findOne({ templateId }).select('-__v');
        if (!template) {
            return res.status(404).json({
                status: 'error',
                message: 'Template not found'
            });
        }

        // Lọc theo khoảng thời gian nếu có
        let startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        let endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        const { period } = req.query;

        if (period && !startDate) {
            endDate = new Date();
            if (period === '7d') {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 7);
            } else if (period === '30d') {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 30);
            } else if (period === '90d') {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 90);
            } else if (period === '365d' || period === '1y') {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 365);
            }
        }

        // Điều kiện thời gian cho logs
        const timeFilter = {};
        if (startDate && endDate) {
            timeFilter.timestamp = { $gte: startDate, $lte: endDate };
        }

        // 1. Tổng số CV đã tạo với template này
        const totalCVs = await CV.countDocuments({ 
            'template.id': templateId,
            is_deleted: { $ne: true }
        });
        
        // 2. Số CV đang active với template này (chưa bị xóa)
        const activeCVs = await CV.countDocuments({ 
            'template.id': templateId,
            is_deleted: false
        });

        // 3. Tổng số Resume đã tạo với template này
        const totalResumes = await Resume.countDocuments({ 
            'template.id': templateId,
            is_deleted: { $ne: true }
        });
        
        // 4. Số Resume đang active với template này (chưa bị xóa)
        const activeResumes = await Resume.countDocuments({ 
            'template.id': templateId,
            is_deleted: false
        });

        // 5. Số lượt download CV
        const cvDownloads = await UserLog.countDocuments({
            action: 'download_cv',
            'details.templateId': templateId,
            ...timeFilter
        });

        // 6. Số lượt download Resume
        const resumeDownloads = await UserLog.countDocuments({
            action: 'download_resume',
            'details.templateId': templateId,
            ...timeFilter
        });

        // 7. Thống kê download theo tháng
        const downloadStats = await UserLog.aggregate([
            {
                $match: {
                    action: { $in: ['download_cv', 'download_resume'] },
                    'details.templateId': templateId,
                    ...timeFilter
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        action: "$action"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Định dạng lại thống kê theo tháng
        const monthlyStats = {};
        downloadStats.forEach(stat => {
            const year = stat._id.year;
            const month = stat._id.month.toString().padStart(2, '0');
            const key = `${year}-${month}`;
            
            if (!monthlyStats[key]) {
                monthlyStats[key] = {
                    cvDownloads: 0,
                    resumeDownloads: 0
                };
            }

            if (stat._id.action === 'download_cv') {
                monthlyStats[key].cvDownloads = stat.count;
            } else {
                monthlyStats[key].resumeDownloads = stat.count;
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                template: {
                    id: template.templateId,
                    name: template.name,
                    isActive: template.isActive,
                    isDefault: template.isDefault
                },
                usage: {
                    cv: {
                        total: totalCVs,
                        active: activeCVs,
                        downloads: cvDownloads
                    },
                    resume: {
                        total: totalResumes,
                        active: activeResumes,
                        downloads: resumeDownloads
                    },
                    total: {
                        created: totalCVs + totalResumes,
                        active: activeCVs + activeResumes,
                        downloads: cvDownloads + resumeDownloads
                    }
                },
                monthlyStats: Object.entries(monthlyStats).map(([month, stats]) => ({
                    month,
                    ...stats
                }))
            },
            message: 'Template statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting template statistics:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
}; 