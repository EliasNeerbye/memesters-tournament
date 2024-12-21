const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.resolve(__dirname, './.env') })
const fileUpload = require('express-fileupload');
const GameSocket = require('./sockets/gameSocket');
const cookieParser = require('cookie-parser');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
});

app.use(cookieParser());
GameSocket(io);

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
  windowMs: 2 * 60 * 1000,
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https://api.memegen.link/"],
                connectSrc: ["'self'", "ws:", "wss:"],
                upgradeInsecureRequests: process.env.NODE_ENV == "production" ? [] : null,
            },
        },
    })
);

app.use(
    cors({
        origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Set-Cookie"],
    })
);

app.use(compression()); // Compress response bodies
// app.use(limiter); // Apply rate limiting
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    limits: { fileSize: 4 * 1024 * 1024 }, // 1 MB
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true,
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
    debug: false
}));  

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'tests.html'));
})

// Import routes
const userRoutes = require('./routes/api/userRoutes');
const gameRoutes = require("./routes/api/gameRoutes");

app.set("io", io);

// API routes
app.use('/api/users', userRoutes);
app.use("/api/games", gameRoutes);

// Serve static files from React frontend
const reactPath = process.env.NODE_ENV === 'production' ? path.join(__dirname, '../frontend/public') /* Techinacally build here :§ */ : path.join(__dirname, '../frontend/public');
app.use(express.static(reactPath));

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(reactPath, 'index.html'));
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
        console.log(`Server is running on ${process.env.FRONTEND_URL || "http://localhost:"+PORT}`);
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