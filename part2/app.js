const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
const session = require('express-session');

app.use(session({ // Configuring the session middleware
  secret: process.env.SESSION_SECRET || 'key', // set a secret key for session signing
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  cookie: { // configure cookie settings
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // expires in 1 day
  }
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes');


app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);

// Export the app instead of listening here
module.exports = app;