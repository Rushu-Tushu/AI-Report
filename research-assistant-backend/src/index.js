import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import config from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import documentsRouter from './routes/documents.js';
import templatesRouter from './routes/templates.js';
import projectsRouter from './routes/projects.js';
import draftsRouter from './routes/drafts.js';
import exportsRouter from './routes/exports.js';

// Create Express app
const app = express();

// ======================
// Global Middleware
// ======================

// Security headers (protects against common web vulnerabilities)
app.use(helmet());

// CORS (allows frontend to call this API)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
  credentials: true,
}));

// Request logging (shows each request in console)
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// ======================
// Health Check Route
// ======================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ======================
// API Routes
// ======================

app.use('/api/documents', documentsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/drafts', draftsRouter);
app.use('/api/exports', exportsRouter);

// ======================
// 404 Handler
// ======================

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ======================
// Global Error Handler
// ======================

app.use(errorHandler);

// ======================
// Start Server
// ======================

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
  ========================================
  🚀 Research Assistant API Server
  ========================================
  Environment: ${config.nodeEnv}
  Port:        ${PORT}
  Health:      http://localhost:${PORT}/health
  ========================================
  `);
});

export default app;
