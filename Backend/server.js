// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows the server to parse JSON payloads

// Sample API Endpoint
app.get('/api/message', (req, res) => {
    res.json({ message: "Hello from the Node.js backend!" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});