import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import videoRoutes from './routes/videos.js';
import livestreamRoutes from './routes/livestreams.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import searchRoutes from './routes/search.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/livestreams', livestreamRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (userId: string) => {
    socket.join(`user-${userId}`);
    io.emit('user-online', { userId, timestamp: new Date() });
  });

  socket.on('message', (data) => {
    io.to(`user-${data.receiverId}`).emit('new-message', data);
  });

  socket.on('typing', (data) => {
    io.to(`user-${data.receiverId}`).emit('user-typing', { userId: data.senderId });
  });

  socket.on('notification', (data) => {
    io.to(`user-${data.userId}`).emit('new-notification', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    io.emit('user-offline', { socketId: socket.id, timestamp: new Date() });
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Horizon Social server running on port ${PORT}`);
  console.log(`📡 WebSocket server listening`);
});

export { app, httpServer, io };
