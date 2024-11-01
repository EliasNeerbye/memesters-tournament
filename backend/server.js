
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Create an instance of Express
const app = express();
let reactWhere;
if (process.env.APPLIACTION_STATE == "production") {
    reactWhere = "../frontend/build"
} else {
    reactWhere = "../frontend/public"
}

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Define API routes
app.get('/api/users', (req, res) => {
    // Example response
    res.json([{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Doe' }]);
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, )));

// Catch-all handler to serve the React app for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});