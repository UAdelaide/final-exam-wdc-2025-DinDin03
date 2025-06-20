const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
const session = require('express-session'); // Added session import

app.use(session({
  secret: process.env.SESSION_SECRET || 'dog-walking-secret-key',
  resave: false,              // Don't save session if unmodified
  saveUninitialized: false,   // Don't create session until something stored
  cookie: {
    secure: false,            // Set to true if using HTTPS in production
    httpOnly: true,           // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000 // Session expires in 24 hours
  }
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;