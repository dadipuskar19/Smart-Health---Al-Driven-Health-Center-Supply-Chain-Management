const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_health';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED' });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.send('<h1>Smart Health API Backend is running...</h1>');
});

// Database Connection
console.log('Connecting to database...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas / Local Database.');
    // Start Server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed. Starting server in mock/offline mode...', err.message);
    
    // Fallback Server start in case MongoDB is not running locally (allows mock API testing)
    app.listen(PORT, () => {
      console.log(`Server (offline/mock mode) is running on port ${PORT}`);
    });
  });
