const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/api/userRoutes');
const gameRoutes = require('./routes/api/gameRoutes');
const memeRoutes = require('./routes/api/memeRoutes');
const authRoutes = require('./routes/api/authRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Enhanced MongoDB connection with error handling
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        // Exit process with failure
        process.exit(1);
    }
};

// Security Middleware
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(compression()); // Compress response bodies
app.use(limiter); // Apply rate limiting
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/memes', memeRoutes);
app.use('/api/auth', authRoutes);

// Serve static files from React frontend
const reactPath = process.env.NODE_ENV === 'production' ? path.join(__dirname, '../frontend/build') : path.join(__dirname, '../frontend/public');
app.use(express.static(reactPath));

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(reactPath, 'index.html'));
});

// Socket.IO setup
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

// Start server
const PORT = process.env.PORT || 5000;

// Connect to DB and start server
const startServer = async () => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

module.exports = { app, server, io };