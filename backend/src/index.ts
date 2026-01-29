import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { swaggerSpec } from './swagger';
import { initializeWebSocket } from './services/websocket';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import sessionRoutes from './routes/session';
import boardRoutes from './routes/board';
import audioItemsRoutes from './routes/audioItems';
import textItemsRoutes from './routes/textItems';

// Create Express app
const app = express();
app.set('trust proxy', 1);

// Create HTTP server for WebSocket
const httpServer = createServer(app);

// Initialize WebSocket
initializeWebSocket(httpServer);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow audio file access
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiting (stricter)
const uploadLimiter = rateLimit({
  windowMs: config.rateLimit.uploadWindowMs,
  max: config.rateLimit.uploadMaxRequests,
  message: {
    error: 'Too Many Uploads',
    message: 'Please wait before uploading more files',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting
app.use('/api/', generalLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(config.upload.directory)));

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NOISE API Documentation',
}));

// Serve OpenAPI spec as JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/session', sessionRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/audio-items', uploadLimiter, audioItemsRoutes);
app.use('/api/text-items', textItemsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                    NOISE Backend                    ║
╠════════════════════════════════════════════════════╣
║  Server:     http://localhost:${config.port.toString().padEnd(22)}║
║  API Docs:   http://localhost:${config.port}/api/docs${' '.repeat(12)}║
║  WebSocket:  ws://localhost:${config.port}${' '.repeat(19)}║
║  Environment: ${config.nodeEnv.padEnd(34)}║
╚════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, httpServer };
