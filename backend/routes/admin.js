const express = require('express');
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { requireProfessore } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.get('/users', requireProfessore, (req, res) => {
  try {
    const users = db.prepare('SELECT id, email, nome, cognome, ruolo, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    logger.error('Get users error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users', requireProfessore, (req, res) => {
  try {
    const { email, nome, cognome, ruolo, password } = req.body;
    if (!email || !nome || !ruolo) return res.status(400).json({ error: 'Missing fields' });

    const id = uuid();
    const hash = password ? bcrypt.hashSync(password, 10) : null;

    db.prepare(`
      INSERT INTO users (id, email, nome, cognome, ruolo, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, email, nome, cognome, ruolo, hash);

    logger.info('User created', { email, ruolo });
    res.status(201).json({ id, email, ruolo });
  } catch (err) {
    logger.error('Create user error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logs', requireProfessore, (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM log_attivita ORDER BY created_at DESC LIMIT 100').all();
    res.json(logs);
  } catch (err) {
    logger.error('Get logs error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
