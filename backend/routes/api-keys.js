const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const keys = db.prepare(`
      SELECT id, chiave, descrizione, attiva, created_at, last_used
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json(keys);
  } catch (err) {
    logger.error('Get API keys error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { descrizione } = req.body;

    const id = uuid();
    const chiave = `ssa_${uuid()}`;

    db.prepare(`
      INSERT INTO api_keys (id, user_id, chiave, descrizione, attiva, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `).run(id, req.user.id, chiave, descrizione || 'API Key');

    logger.info('API key generated', { user_id: req.user.id, key_id: id });
    res.status(201).json({ id, chiave, created_at: new Date().toISOString() });
  } catch (err) {
    logger.error('Create API key error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const key = db.prepare(`
      SELECT id FROM api_keys WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!key) return res.status(404).json({ error: 'API key not found' });

    db.prepare('UPDATE api_keys SET attiva = 0 WHERE id = ?').run(req.params.id);

    logger.info('API key deactivated', { user_id: req.user.id, key_id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete API key error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
