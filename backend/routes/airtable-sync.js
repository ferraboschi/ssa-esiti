const express = require('express');
const db = require('../config/database');
const { requireProfessore } = require('../middleware/auth');
const logger = require('../services/logger');
const airtable = require('../services/airtable');

const router = express.Router();

// Sync students from Airtable
router.post('/sync', requireProfessore, async (req, res) => {
  try {
    const count = await airtable.syncStudentsToLocal(db);
    logger.info('Airtable sync completed', { count });
    res.json({ success: true, synced: count });
  } catch (err) {
    logger.error('Airtable sync error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Search student by email
router.get('/search', requireProfessore, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const student = await airtable.searchStudent(email);
    res.json(student || { found: false });
  } catch (err) {
    logger.error('Airtable search error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
