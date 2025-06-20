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

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
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

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;

// Added to Vue.js setup function
const currentUser = ref(null); // Track the current user

// Added logout function
async function logout() {
  try {
    const response = await fetch('/api/users/logout', { // Call the logout endpoint
      method: 'POST' // Use POST method for logout
    });

    if (response.ok) {
      // Redirect to login page after successful logout
      window.location.href = '/';
    } else {
      alert('Logout failed. Please try again.'); // Handle logout failure
    }
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed. Please try again.'); // Handle network errors
  }
}

// Added authentication check to get current user
async function checkAuth() {
  try {
    const response = await fetch('/api/users/me'); // Call the endpoint to get current user
    if (!response.ok) {
      window.location.href = '/'; // Redirect to login if not authenticated
      return false;
    }
    const user = await response.json();
    if (user.role !== 'owner') {
      alert('Access denied. Owner access required.');
      window.location.href = '/';
      return false;
    }
    currentUser.value = user;
    return true;
  } catch (error) {
    window.location.href = '/';
    return false;
  }
}

// Updated onMounted to check authentication
onMounted(async () => {
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) {
    loadWalks();
  }
});

// Updated return statement to include logout function
return {
  form,
  walks,
  message,
  error,
  currentUser,
  isSubmitting,
  submitWalkRequest,
  getStatusClass,
  logout // Added logout function
};