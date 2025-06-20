const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET || 'key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes');

app.get('/api/dogs', async (req, res) => {
  try {
    const query = `
      SELECT
        d.name AS dog_name,
        d.size,
        u.username AS owner_username
      FROM Dogs d
      INNER JOIN Users u ON d.owner_id = u.user_id
      ORDER BY d.dog_id
    `;

    // Use your existing database connection
    const [results] = await db.query(query);
    res.json(results);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);

// Export the app instead of listening here
module.exports = app;