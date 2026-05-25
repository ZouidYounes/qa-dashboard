import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from './db.js';
import testRoutes from './routes/tests.js';
import resultsRoutes from './routes/results.js';
import demoRoutes from './routes/demo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIO(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = new Database(join(__dirname, 'data.db'));
db.initialize();

// Store io instance for route handlers
app.locals.io = io;
app.locals.db = db;

// Routes
app.use('/api/tests', testRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/demo', demoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`QA Dashboard backend running on port ${PORT}`);
});
