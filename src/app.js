const express = require('express');
const morgan = require('morgan');
const { default: helmet } = require('helmet');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');
const connectDB = require('./config/db');
const API_PREFIX = process.env.API_PREFIX || '/api';

// Connect to database
connectDB();

const app = express();

// CORS Configuration
const corsOptions = {
    origin: '*', // Allow all origins for testing
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400
};

// Init middlewares
app.use(morgan("dev"));

// Configure Helmet
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false
    })
);

app.use(compression());
app.use(cors(corsOptions));

// Body parsers with increased limits
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.text({ type: 'text/plain', limit: '10mb' }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.get('/', (req, res) => {
    const strCompress = 'Welcome to Resume Maker API';
    return res.status(200).json({
        message: 'API is running...',
        metaData: strCompress
    });
});

// Import routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cvRoutes = require('./routes/cvRoutes');
const extractRoutes = require('./routes/extractRoutes');
const cvEvaluationRoutes = require('./routes/cvEvaluationRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const jobDescriptionRoutes = require('./routes/jobDescriptionRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const userLogRoutes = require('./routes/userLogRoutes');
const templateRoutes = require('./routes/templateRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

// Import controllers
const { generateAutomaticEvaluationFromData } = require('./controllers/cvEvaluationController');
const { protect } = require('./middlewares/authMiddleware');

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/extract', extractRoutes);
app.use('/api/job-descriptions', jobDescriptionRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/user-logs', userLogRoutes);
// CV Evaluation Routes (nested dưới CV routes)
app.use('/api/cv/:cvId/evaluation', cvEvaluationRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Route đánh giá CV từ dữ liệu frontend
app.post('/api/cv/evaluate-from-data', protect, generateAutomaticEvaluationFromData);

// Error handling middleware
app.use((err, req, res, next) => {
    // Handle JSON parse errors (SyntaxError)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('JSON Parse Error:', err);
        return res.status(400).json({
            status: 'error',
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
            error: err.message
        });
    }
    
    // Handle other errors
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        status: 'error',
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

module.exports = app; 