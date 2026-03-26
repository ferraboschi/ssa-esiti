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

// Discovery: list all tables and their fields in the Airtable base
router.get('/discover', requireProfessore, async (req, res) => {
  try {
    const tables = await airtable.listTables();
    const summary = tables.map(t => ({
      id: t.id,
      name: t.name,
      fields: (t.fields || []).map(f => ({ id: f.id, name: f.name, type: f.type }))
    }));
    res.json({ baseId: 'appj4DEH3RYFqct1Q', tables: summary });
  } catch (err) {
    logger.error('Airtable discover error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Discovery: fetch all raw records from a specific table
router.get('/discover/:tableId', requireProfessore, async (req, res) => {
  try {
    const records = await airtable.fetchAllRecords(req.params.tableId);
    res.json({ count: records.length, records: records.slice(0, 50) }); // limit to 50 for preview
  } catch (err) {
    logger.error('Airtable discover table error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
