const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const corsi = db.prepare('SELECT id, nome, tipo, descrizione FROM corsi ORDER BY nome').all();
    res.json(corsi);
  } catch (err) {
    logger.error('Get courses error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const corso = db.prepare('SELECT * FROM corsi WHERE id = ?').get(req.params.id);
    if (!corso) return res.status(404).json({ error: 'Course not found' });

    const esami = db.prepare('SELECT id, nome, tipo FROM esami WHERE corso_id = ?').all(req.params.id);
    res.json({ ...corso, esami });
  } catch (err) {
    logger.error('Get course error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { nome, tipo, descrizione } = req.body;
    if (!nome || !tipo) return res.status(400).json({ error: 'Missing fields' });

    const id = uuid();
    db.prepare('INSERT INTO corsi (id, nome, tipo, descrizione) VALUES (?, ?, ?, ?)')
      .run(id, nome, tipo, descrizione);

    logger.info('Course created', { id, nome });
    res.status(201).json({ id, nome, tipo });
  } catch (err) {
    logger.error('Create course error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
