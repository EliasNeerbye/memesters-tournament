const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/api/userRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/users', userRoutes);

// Serve static files from React frontend
const reactPath = process.env.APPLICATION_STATE === 'production' ? '../frontend/build' : '../frontend/public';
app.use(express.static(path.join(__dirname, reactPath)));

// Catch-all to serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, reactPath, 'index.html'));
});

// Socket.IO setup
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Example event listener for meme game actions
    socket.on('memeAction', (data) => {
        console.log(`Received meme action: ${data}`);
        // Broadcast to all clients (or modify as needed)
        io.emit('memeAction', data);
    });
    
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});