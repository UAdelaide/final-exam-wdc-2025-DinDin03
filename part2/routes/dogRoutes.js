const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT
        d.name AS dog_name,
        d.size,
        u.username AS owner_username,
        u.user_id AS owner_id
      FROM Dogs d
      INNER JOIN Users u ON d.owner_id = u.user_id
      ORDER BY d.dog_id
    `;

    const [results] = await db.query(query);
    res.json(results);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// GET dogs owned by the logged-in user
router.get('/my-dogs', async (req, res) => {
  // Check if user is logged in and is an owner
  if (!req.session.user) {
    return res.status(401).json({ error: 'Must be logged in' });
  }

  if (req.session.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only owners can view their dogs' });
  }

  try {
    // Query matches your Dogs table structure exactly
    const [rows] = await db.query(`
      SELECT dog_id, name, size
      FROM Dogs
      WHERE owner_id = ?
      ORDER BY name
    `, [req.session.user.user_id]);

    res.json(rows);
  } catch (error) {
    console.error('Load user dogs error:', error);
    res.status(500).json({ error: 'Failed to load your dogs' });
  }
});

module.exports = router;