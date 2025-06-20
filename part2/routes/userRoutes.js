const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => { // Get current logged-in user
  if (!req.session.user) { // Check if user is logged in
    return res.status(401).json({ error: 'Not logged in' }); // If not logged in, return error
  }
  res.json(req.session.user); // Return user data from session
});

router.post('/login', async (req, res) => { // Login endpoint
  const { username, password } = req.body; // Extract username and password from request body

  try { // Query database using username for authentication
    const [rows] = await db.query(`
      SELECT user_id, username, email, role FROM Users
      WHERE username = ? AND password_hash = ?
    `, [username, password]);

    if (rows.length === 0) { // If no user found, return error
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0]; // Get the first user from the result

    // Store user in session
    req.session.user = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      email: user.email
    };
    // Send successful response with user data
    res.json({
      message: 'Login successful',
      user: req.session.user
    });
  } catch (error) { // Handle any errors during the query
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => { // Logout endpoint
  req.session.destroy((err) => { // Destroy the session
    if (err) { // If there's an error destroying the session, return error
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logged out successfully' }); // Send success response
  });
});

module.exports = router;