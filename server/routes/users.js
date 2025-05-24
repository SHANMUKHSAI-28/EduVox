const express = require('express');
const { verifyFirebaseToken } = require('../middleware/auth');
const { query } = require('../config/database');
const router = express.Router();

// Get all users (admin only)
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await query(
      'SELECT role FROM user_profiles WHERE id = $1',
      [req.user.uid]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, full_name, email, role, created_at, updated_at 
       FROM user_profiles 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM user_profiles');
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:userId', verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own profile unless they're admin
    if (req.user.uid !== userId) {
      const userResult = await query(
        'SELECT role FROM user_profiles WHERE id = $1',
        [req.user.uid]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await query(
      'SELECT id, full_name, email, role, created_at, updated_at FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
