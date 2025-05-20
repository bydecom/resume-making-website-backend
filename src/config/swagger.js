const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'CV Builder API',
            description: 'API documentation for CV Builder application',
            version: '1.0.0',
            contact: {
                name: 'Your Name',
                email: 'your.email@example.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                CV: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'MongoDB ObjectId của CV'
                        },
                        userId: {
                            type: 'string',
                            description: 'ID của người dùng sở hữu CV'
                        },
                        name: {
                            type: 'string',
                            description: 'Tên của CV',
                            example: "CV - Professional 2024"
                        },
                        personalInfo: {
                            type: 'object',
                            properties: {
                                firstName: {
                                    type: 'string',
                                    example: 'John'
                                },
                                lastName: {
                                    type: 'string',
                                    example: 'Doe'
                                },
                                email: {
                                    type: 'string',
                                    example: 'john.doe@example.com'
                                },
                                phone: {
                                    type: 'string',
                                    example: '+1234567890'
                                },
                                location: {
                                    type: 'string',
                                    example: 'New York'
                                },
                                country: {
                                    type: 'string',
                                    example: 'USA'
                                },
                                website: {
                                    type: 'string',
                                    example: 'www.johndoe.com'
                                },
                                linkedin: {
                                    type: 'string',
                                    example: 'linkedin.com/in/johndoe'
                                }
                            }
                        },
                        summary: {
                            type: 'string',
                            description: 'Tóm tắt về bản thân'
                        },
                        education: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    degree: {
                                        type: 'string',
                                        example: 'Bachelor of Computer Science'
                                    },
                                    school: {
                                        type: 'string',
                                        example: 'University of Technology'
                                    },
                                    startDate: {
                                        type: 'string',
                                        example: '2015-09'
                                    },
                                    endDate: {
                                        type: 'string',
                                        example: '2019-06'
                                    },
                                    description: {
                                        type: 'string'
                                    },
                                    isPresent: {
                                        type: 'boolean',
                                        default: false
                                    }
                                }
                            }
                        },
                        experience: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    title: {
                                        type: 'string',
                                        example: 'Senior Software Engineer'
                                    },
                                    company: {
                                        type: 'string',
                                        example: 'Tech Company'
                                    },
                                    startDate: {
                                        type: 'string',
                                        example: '2019-07'
                                    },
                                    endDate: {
                                        type: 'string',
                                        example: '2023-12'
                                    },
                                    description: {
                                        type: 'string'
                                    },
                                    isPresent: {
                                        type: 'boolean',
                                        default: false
                                    }
                                }
                            }
                        },
                        skills: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            example: ['JavaScript', 'React', 'Node.js']
                        },
                        projects: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    title: {
                                        type: 'string'
                                    },
                                    role: {
                                        type: 'string'
                                    },
                                    startDate: {
                                        type: 'string'
                                    },
                                    endDate: {
                                        type: 'string'
                                    },
                                    description: {
                                        type: 'string'
                                    },
                                    url: {
                                        type: 'string'
                                    },
                                    isPresent: {
                                        type: 'boolean',
                                        default: false
                                    }
                                }
                            }
                        },
                        certifications: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string'
                                    },
                                    issuer: {
                                        type: 'string'
                                    },
                                    date: {
                                        type: 'string'
                                    },
                                    url: {
                                        type: 'string'
                                    }
                                }
                            }
                        },
                        languages: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    language: {
                                        type: 'string'
                                    },
                                    proficiency: {
                                        type: 'string'
                                    }
                                }
                            }
                        },
                        additionalInfo: {
                            type: 'object',
                            properties: {
                                interests: {
                                    type: 'string'
                                },
                                achievements: {
                                    type: 'string'
                                },
                                publications: {
                                    type: 'string'
                                },
                                references: {
                                    type: 'string'
                                }
                            }
                        },
                        customFields: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    label: {
                                        type: 'string'
                                    },
                                    value: {
                                        type: 'string'
                                    }
                                }
                            }
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    },
                    required: [
                        'userId',
                        'name',
                        'personalInfo'
                    ]
                },
                Resume: {
                    type: 'object',
                    required: ['userId', 'jobDescriptionId'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'MongoDB ObjectId của Resume'
                        },
                        userId: {
                            type: 'string',
                            description: 'ID của người dùng sở hữu Resume'
                        },
                        jobDescriptionId: {
                            type: 'string',
                            description: 'ID của Job Description mà Resume này được tạo cho'
                        },
                        name: {
                            type: 'string',
                            description: 'Tên của Resume',
                            example: 'Resume - Software Engineer Position'
                        },
                        template: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    example: 'professionalBlue'
                                },
                                name: {
                                    type: 'string',
                                    example: 'Professional Blue'
                                }
                            }
                        },
                        personalInfo: {
                            type: 'object',
                            properties: {
                                firstName: { type: 'string', example: 'John' },
                                lastName: { type: 'string', example: 'Doe' },
                                email: { type: 'string', example: 'john.doe@example.com' },
                                phone: { type: 'string', example: '+1234567890' },
                                location: { type: 'string', example: 'New York' },
                                country: { type: 'string', example: 'USA' },
                                website: { type: 'string', example: 'www.johndoe.com' },
                                linkedin: { type: 'string', example: 'linkedin.com/in/johndoe' }
                            }
                        },
                        summary: {
                            type: 'string',
                            maxLength: 2000,
                            description: 'Tóm tắt về bản thân'
                        },
                        education: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    degree: { type: 'string', example: 'Bachelor of Computer Science' },
                                    school: { type: 'string', example: 'University of Technology' },
                                    startDate: { type: 'string', example: '2015-09' },
                                    endDate: { type: 'string', example: '2019-06' },
                                    description: { type: 'string' },
                                    isPresent: { type: 'boolean', default: false }
                                }
                            }
                        },
                        experience: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string', example: 'Senior Software Engineer' },
                                    company: { type: 'string', example: 'Tech Company' },
                                    startDate: { type: 'string', example: '2019-07' },
                                    endDate: { type: 'string', example: '2023-12' },
                                    description: { type: 'string' },
                                    isPresent: { type: 'boolean', default: false }
                                }
                            }
                        },
                        skills: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['JavaScript', 'React', 'Node.js']
                        },
                        projects: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    role: { type: 'string' },
                                    startDate: { type: 'string' },
                                    endDate: { type: 'string' },
                                    description: { type: 'string' },
                                    url: { type: 'string' },
                                    isPresent: { type: 'boolean', default: false }
                                }
                            }
                        },
                        certifications: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    issuer: { type: 'string' },
                                    date: { type: 'string' },
                                    url: { type: 'string' }
                                }
                            }
                        },
                        languages: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    language: { type: 'string' },
                                    proficiency: { type: 'string' }
                                }
                            }
                        },
                        additionalInfo: {
                            type: 'object',
                            properties: {
                                interests: { type: 'string' },
                                achievements: { type: 'string' },
                                publications: { type: 'string' },
                                references: { type: 'string' }
                            }
                        },
                        customFields: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    label: { type: 'string' },
                                    value: { type: 'string' }
                                }
                            }
                        },
                        status: {
                            type: 'string',
                            enum: ['draft', 'published'],
                            default: 'draft'
                        },
                        isDefault: {
                            type: 'boolean',
                            default: false
                        }
                    }
                },
                JobDescription: {
                    type: 'object',
                    required: ['userId', 'position', 'company'],
                    required: ['userId', 'title', 'company'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'MongoDB ObjectId của Job Description'
                        },
                        userId: {
                            type: 'string',
                            description: 'ID của người dùng sở hữu Job Description'
                        },
                        title: {
                            type: 'string',
                            description: 'Tiêu đề công việc',
                            example: 'Senior Software Engineer'
                        },
                        company: {
                            type: 'string',
                            description: 'Tên công ty',
                            example: 'Tech Company Inc.'
                        },
                        location: {
                            type: 'string',
                            description: 'Địa điểm làm việc',
                            example: 'Ho Chi Minh City, Vietnam'
                        },
                        jobType: {
                            type: 'string',
                            enum: ['full-time', 'part-time', 'contract', 'internship'],
                            description: 'Loại hình công việc'
                        },
                        description: {
                            type: 'string',
                            description: 'Mô tả chi tiết về công việc'
                        },
                        requirements: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Danh sách yêu cầu công việc',
                            example: [
                                '5+ years of experience in software development',
                                'Strong knowledge of JavaScript and React',
                                'Experience with Node.js and MongoDB'
                            ]
                        },
                        responsibilities: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Danh sách trách nhiệm công việc',
                            example: [
                                'Develop and maintain web applications',
                                'Collaborate with cross-functional teams',
                                'Write clean, maintainable code'
                            ]
                        },
                        benefits: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Danh sách phúc lợi',
                            example: [
                                'Competitive salary',
                                'Health insurance',
                                'Flexible working hours'
                            ]
                        },
                        salary: {
                            type: 'object',
                            properties: {
                                min: { type: 'number', example: 2000 },
                                max: { type: 'number', example: 3000 },
                                currency: { type: 'string', example: 'USD' },
                                period: { type: 'string', example: 'month' }
                            }
                        },
                        keywords: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Từ khóa liên quan đến công việc',
                            example: ['JavaScript', 'React', 'Node.js', 'MongoDB']
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'closed', 'draft'],
                            default: 'active',
                            description: 'Trạng thái của job posting'
                        },
                        applicationDeadline: {
                            type: 'string',
                            format: 'date',
                            description: 'Hạn nộp hồ sơ'
                        },
                        contactInfo: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                email: { type: 'string' },
                                phone: { type: 'string' }
                            }
                        }
                    }
                },
                DashboardMetrics: {
                    type: 'object',
                    properties: {
                        summary: {
                            type: 'object',
                            properties: {
                                totalNewUsers: {
                                    type: 'integer',
                                    description: 'Tổng số người dùng mới trong khoảng thời gian đã chọn',
                                    example: 120
                                },
                                averageNewUsersPerDay: {
                                    type: 'integer',
                                    description: 'Số người dùng mới trung bình mỗi ngày',
                                    example: 17
                                },
                                growthRate: {
                                    type: 'integer',
                                    description: 'Tỷ lệ tăng trưởng so với kỳ trước (tính bằng %)',
                                    example: 25
                                },
                                totalUsers: {
                                    type: 'integer',
                                    description: 'Tổng số người dùng hiện có trong hệ thống',
                                    example: 1500
                                }
                            }
                        },
                        charts: {
                            type: 'array',
                            description: 'Dữ liệu theo ngày cho biểu đồ',
                            items: {
                                type: 'object',
                                properties: {
                                    date: {
                                        type: 'string',
                                        example: 'T2, 15/3'
                                    },
                                    newUsers: {
                                        type: 'integer',
                                        example: 15
                                    },
                                    totalUsers: {
                                        type: 'integer',
                                        example: 1250
                                    },
                                    activeUsers: {
                                        type: 'integer',
                                        example: 450
                                    }
                                }
                            }
                        }
                    }
                },
                Knowledge: {
                    type: 'object',
                    required: ['title', 'type', 'taskName'],
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Tiêu đề của knowledge'
                        },
                        description: {
                            type: 'string',
                            description: 'Mô tả ngắn về knowledge'
                        },
                        textContent: {
                            type: 'string',
                            description: 'Nội dung văn bản hướng dẫn'
                        },
                        qaContent: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    question: {
                                        type: 'string',
                                        description: 'Câu hỏi'
                                    },
                                    answer: {
                                        type: 'string',
                                        description: 'Câu trả lời'
                                    }
                                }
                            }
                        },
                        type: {
                            type: 'string',
                            enum: ['GENERAL', 'SPECIFIC'],
                            description: 'Loại knowledge'
                        },
                        taskName: {
                            type: 'string',
                            description: 'Task name để identify knowledge này'
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Tags phân loại'
                        },
                        priority: {
                            type: 'number',
                            description: 'Độ ưu tiên'
                        }
                    }
                }
            }
        },
        paths: {
            '/api/resumes': {
                post: {
                    tags: ['Resumes'],
                    summary: 'Create a new resume',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Resume'
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Resume created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { $ref: '#/components/schemas/Resume' }
                                        }
                                    }
                                }
                            }
                        },
                        400: { description: 'Invalid input data' },
                        401: { description: 'Not authorized' }
                    }
                },
                get: {
                    tags: ['Resumes'],
                    summary: 'Get all resumes for the logged-in user',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of resumes',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            count: { type: 'number' },
                                            data: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/Resume' }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        401: { description: 'Not authorized' }
                    }
                }
            },
            '/api/resumes/{id}': {
                get: {
                    tags: ['Resumes'],
                    summary: 'Get a single resume by ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Resume details',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { $ref: '#/components/schemas/Resume' }
                                        }
                                    }
                                }
                            }
                        },
                        404: { description: 'Resume not found' },
                        401: { description: 'Not authorized' }
                    }
                },
                put: {
                    tags: ['Resumes'],
                    summary: 'Update a resume',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Resume'
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Resume updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { $ref: '#/components/schemas/Resume' }
                                        }
                                    }
                                }
                            }
                        },
                        404: { description: 'Resume not found' },
                        401: { description: 'Not authorized' }
                    }
                },
                delete: {
                    tags: ['Resumes'],
                    summary: 'Delete a resume',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Resume deleted successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { type: 'object' }
                                        }
                                    }
                                }
                            }
                        },
                        404: { description: 'Resume not found' },
                        401: { description: 'Not authorized' }
                    }
                }
            },
            '/api/job-descriptions': {
                post: {
                    tags: ['Job Descriptions'],
                    summary: 'Create a new job description',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/JobDescription'
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Job description created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { $ref: '#/components/schemas/JobDescription' }
                                        }
                                    }
                                }
                            }
                        },
                        400: { description: 'Invalid input data' },
                        401: { description: 'Not authorized' }
                    }
                },
                get: {
                    tags: ['Job Descriptions'],
                    summary: 'Get all job descriptions for the logged-in user',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of job descriptions',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            count: { type: 'number' },
                                            data: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/JobDescription' }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        401: { description: 'Not authorized' }
                    }
                }
            },
            '/api/job-descriptions/{id}': {
                get: {
                    tags: ['Job Descriptions'],
                    summary: 'Get a single job description by ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Job description details',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { $ref: '#/components/schemas/JobDescription' }
                                        }
                                    }
                                }
                            }
                        },
                        404: { description: 'Job description not found' },
                        401: { description: 'Not authorized' }
                    }
                },
                put: {
                    tags: ['Job Descriptions'],
                    summary: 'Update a job description',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/JobDescription'
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Job description updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { $ref: '#/components/schemas/JobDescription' }
                                        }
                                    }
                                }
                            }
                        },
                        404: { description: 'Job description not found' },
                        401: { description: 'Not authorized' }
                    }
                },
                delete: {
                    tags: ['Job Descriptions'],
                    summary: 'Delete a job description',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Job description deleted successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { type: 'object' }
                                        }
                                    }
                                }
                            }
                        },
                        404: { description: 'Job description not found' },
                        401: { description: 'Not authorized' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js', './src/models/*.js', './src/swagger/*.yaml']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs; 