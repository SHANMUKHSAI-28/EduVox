const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyFirebaseToken } = require('../middleware/auth');
const { query } = require('../config/database');
const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Register/Create user profile
router.post('/register', 
  verifyFirebaseToken,
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('role').optional().isIn(['student', 'consultant', 'admin']).withMessage('Invalid role'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { fullName, role = 'student' } = req.body;
      const { uid, email } = req.user;

      // Check if user profile already exists
      const existingUser = await query(
        'SELECT * FROM user_profiles WHERE id = $1',
        [uid]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User profile already exists' });
      }

      // Create user profile
      const result = await query(
        `INSERT INTO user_profiles (id, full_name, email, role, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, NOW(), NOW()) 
         RETURNING *`,
        [uid, fullName, email, role]
      );

      res.status(201).json({ 
        message: 'User profile created successfully',
        user: result.rows[0] 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to create user profile' });
    }
  }
);

// Get current user profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const result = await query(
      'SELECT * FROM user_profiles WHERE id = $1',
      [uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', 
  verifyFirebaseToken,
  [
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('role').optional().isIn(['student', 'consultant', 'admin']).withMessage('Invalid role'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { uid } = req.user;
      const { fullName, role } = req.body;

      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (fullName !== undefined) {
        updateFields.push(`full_name = $${paramCount++}`);
        values.push(fullName);
      }

      if (role !== undefined) {
        updateFields.push(`role = $${paramCount++}`);
        values.push(role);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(uid);

      const result = await query(
        `UPDATE user_profiles SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      res.json({ 
        message: 'Profile updated successfully',
        user: result.rows[0] 
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Verify token endpoint (for client-side verification)
router.get('/verify', verifyFirebaseToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

module.exports = router;
