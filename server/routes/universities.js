const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { verifyFirebaseToken, optionalAuth } = require('../middleware/auth');
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

// Get all universities with filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      country,
      state,
      type,
      minRanking,
      maxRanking,
      minTuition,
      maxTuition,
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (country) {
      conditions.push(`country ILIKE $${paramCount++}`);
      values.push(`%${country}%`);
    }

    if (state) {
      conditions.push(`state ILIKE $${paramCount++}`);
      values.push(`%${state}%`);
    }

    if (type) {
      conditions.push(`type = $${paramCount++}`);
      values.push(type);
    }

    if (minRanking) {
      conditions.push(`ranking >= $${paramCount++}`);
      values.push(parseInt(minRanking));
    }

    if (maxRanking) {
      conditions.push(`ranking <= $${paramCount++}`);
      values.push(parseInt(maxRanking));
    }

    if (minTuition) {
      conditions.push(`tuition_min >= $${paramCount++}`);
      values.push(parseInt(minTuition));
    }

    if (maxTuition) {
      conditions.push(`tuition_max <= $${paramCount++}`);
      values.push(parseInt(maxTuition));
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramCount++} OR city ILIKE $${paramCount++})`);
      values.push(`%${search}%`, `%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Add pagination parameters
    values.push(parseInt(limit), offset);
    const limitClause = `LIMIT $${paramCount++} OFFSET $${paramCount++}`;

    const universitiesQuery = `
      SELECT * FROM universities 
      ${whereClause} 
      ORDER BY ranking ASC NULLS LAST, name ASC 
      ${limitClause}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM universities ${whereClause}
    `;

    const [universitiesResult, countResult] = await Promise.all([
      query(universitiesQuery, values.slice(0, -2).concat([parseInt(limit), offset])),
      query(countQuery, values.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      universities: universitiesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Universities fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// Get university by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM universities WHERE id = $1',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'University not found' });
    }

    res.json({ university: result.rows[0] });
  } catch (error) {
    console.error('University fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch university' });
  }
});

// University matching algorithm
router.post('/match', verifyFirebaseToken, [
  body('cgpa').isFloat({ min: 0, max: 4 }).withMessage('CGPA must be between 0 and 4'),
  body('ieltsScore').optional().isFloat({ min: 0, max: 9 }).withMessage('IELTS score must be between 0 and 9'),
  body('toeflScore').optional().isInt({ min: 0, max: 120 }).withMessage('TOEFL score must be between 0 and 120'),
  body('greScore').optional().isInt({ min: 0, max: 340 }).withMessage('GRE score must be between 0 and 340'),
  body('budgetMin').optional().isInt({ min: 0 }).withMessage('Minimum budget must be positive'),
  body('budgetMax').optional().isInt({ min: 0 }).withMessage('Maximum budget must be positive'),
  body('preferredCountries').optional().isArray().withMessage('Preferred countries must be an array'),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      cgpa,
      ieltsScore,
      toeflScore,
      greScore,
      budgetMin,
      budgetMax,
      preferredCountries
    } = req.body;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Match CGPA requirement
    conditions.push(`(cgpa_requirement IS NULL OR cgpa_requirement <= $${paramCount++})`);
    values.push(cgpa);

    // Match IELTS requirement
    if (ieltsScore) {
      conditions.push(`(ielts_requirement IS NULL OR ielts_requirement <= $${paramCount++})`);
      values.push(ieltsScore);
    }

    // Match TOEFL requirement
    if (toeflScore) {
      conditions.push(`(toefl_requirement IS NULL OR toefl_requirement <= $${paramCount++})`);
      values.push(toeflScore);
    }

    // Match GRE requirement
    if (greScore) {
      conditions.push(`(gre_requirement IS NULL OR gre_requirement <= $${paramCount++})`);
      values.push(greScore);
    }

    // Match budget range
    if (budgetMin && budgetMax) {
      conditions.push(`(
        (tuition_min IS NULL OR tuition_min >= $${paramCount++}) AND 
        (tuition_max IS NULL OR tuition_max <= $${paramCount++})
      )`);
      values.push(budgetMin, budgetMax);
    }

    // Match preferred countries
    if (preferredCountries && preferredCountries.length > 0) {
      const countryPlaceholders = preferredCountries.map(() => `$${paramCount++}`).join(',');
      conditions.push(`country IN (${countryPlaceholders})`);
      values.push(...preferredCountries);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const matchQuery = `
      SELECT *, 
        CASE 
          WHEN ranking IS NOT NULL THEN (100 - ranking) 
          ELSE 0 
        END as match_score
      FROM universities 
      ${whereClause} 
      ORDER BY match_score DESC, ranking ASC NULLS LAST
      LIMIT 50
    `;

    const result = await query(matchQuery, values);

    res.json({ 
      matches: result.rows,
      criteria: req.body,
      count: result.rows.length 
    });
  } catch (error) {
    console.error('University matching error:', error);
    res.status(500).json({ error: 'Failed to match universities' });
  }
});

// Save university to user's list
router.post('/save', verifyFirebaseToken, [
  body('universityId').isInt({ min: 1 }).withMessage('Valid university ID is required'),
], handleValidationErrors, async (req, res) => {
  try {
    const { universityId } = req.body;
    const { uid } = req.user;

    // Check if university exists
    const universityResult = await query(
      'SELECT id FROM universities WHERE id = $1',
      [universityId]
    );

    if (universityResult.rows.length === 0) {
      return res.status(404).json({ error: 'University not found' });
    }

    // Check if already saved
    const existingResult = await query(
      'SELECT id FROM saved_universities WHERE user_id = $1 AND university_id = $2',
      [uid, universityId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'University already saved' });
    }

    // Save university
    const result = await query(
      'INSERT INTO saved_universities (user_id, university_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [uid, universityId]
    );

    res.status(201).json({ 
      message: 'University saved successfully',
      savedUniversity: result.rows[0] 
    });
  } catch (error) {
    console.error('Save university error:', error);
    res.status(500).json({ error: 'Failed to save university' });
  }
});

// Get user's saved universities
router.get('/saved/list', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const result = await query(`
      SELECT su.*, u.name, u.country, u.state, u.city, u.type, u.ranking, 
             u.tuition_min, u.tuition_max, u.logo_url, u.website
      FROM saved_universities su
      JOIN universities u ON su.university_id = u.id
      WHERE su.user_id = $1
      ORDER BY su.created_at DESC
    `, [uid]);

    res.json({ savedUniversities: result.rows });
  } catch (error) {
    console.error('Saved universities fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch saved universities' });
  }
});

// Remove saved university
router.delete('/saved/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;

    const result = await query(
      'DELETE FROM saved_universities WHERE id = $1 AND user_id = $2 RETURNING *',
      [parseInt(id), uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Saved university not found' });
    }

    res.json({ message: 'University removed from saved list' });
  } catch (error) {
    console.error('Remove saved university error:', error);
    res.status(500).json({ error: 'Failed to remove saved university' });
  }
});

module.exports = router;
