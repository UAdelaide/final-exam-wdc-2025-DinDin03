const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all walk requests (for walkers to view)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT wr.*, d.name AS dog_name, d.size, u.username AS owner_name
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// POST a new walk request (from owner)
router.post('/', async (req, res) => {
  const { dog_id, requested_time, duration_minutes, location } = req.body;

  // Add authentication check
  if (!req.session.user) {
    return res.status(401).json({ error: 'Must be logged in to create walk requests' });
  }

  if (req.session.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only owners can create walk requests' });
  }

  try {
    const [result] = await db.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location)
      VALUES (?, ?, ?, ?)
    `, [dog_id, requested_time, duration_minutes, location]);

    res.status(201).json({ message: 'Walk request created successfully', request_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create walk request' });
  }
});

// POST an application to walk a dog (from walker)
router.post('/:id/apply', async (req, res) => {
  const requestId = req.params.id;

  // Add authentication check
  if (!req.session.user) {
    return res.status(401).json({ error: 'Must be logged in to apply' });
  }

  if (req.session.user.role !== 'walker') {
    return res.status(403).json({ error: 'Only walkers can apply for walks' });
  }

  // Use walker_id from session for security (don't trust client data)
  const sessionWalkerId = req.session.user.user_id;

  try {
    // Check if walker has already applied for this walk
    const [existingApplication] = await db.query(`
      SELECT * FROM WalkApplications
      WHERE request_id = ? AND walker_id = ?
    `, [requestId, sessionWalkerId]);

    if (existingApplication.length > 0) {
      return res.status(400).json({ error: 'You have already applied for this walk' });
    }

    await db.query(`
      INSERT INTO WalkApplications (request_id, walker_id)
      VALUES (?, ?)
    `, [requestId, sessionWalkerId]);

    await db.query(`
      UPDATE WalkRequests
      SET status = 'accepted'
      WHERE request_id = ?
    `, [requestId]);

    res.status(201).json({ message: 'Application submitted successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply for walk' });
  }
});

module.exports = router;

// Added logout function to Vue.js setup
async function logout() { // Function to handle user logout
  try {
    const response = await fetch('/api/users/logout', { // Make a POST request to the logout endpoint
      method: 'POST'
    });

    if (response.ok) {
      // Redirect to login page after successful logout
      window.location.href = '/';
    } else {
      alert('Logout failed. Please try again.'); // Alert user if logout fails
    }
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed. Please try again.'); // Handle any errors during logout
  }
}

// Updated return statement to include logout function
return {
  walks,
  message,
  error,
  currentUser,
  applyToWalk,
  logout // logout function
};