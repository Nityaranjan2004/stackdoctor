import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scanRoutes from './routes/scan.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const configuredFrontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null;

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. Postman, cURL, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin matches localhost, netlify.app, or FRONTEND_URL
    const isLocalhost = origin.startsWith('http://localhost:');
    const isNetlify = origin.endsWith('.netlify.app');
    const isConfigured = configuredFrontendUrl && origin === configuredFrontendUrl;

    if (isLocalhost || isNetlify || isConfigured) {
      return callback(null, true);
    }

    return callback(new Error('CORS not allowed for this origin: ' + origin));
  },
  credentials: true
}));
app.use(express.json());

// Routes mapping
app.use('/api/scan', scanRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express server unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`StackDoctor Backend Server is running on port ${PORT}`);
});

export default app;
