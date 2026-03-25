const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, nome, cognome, telefono, ruolo, lingua FROM users WHERE id = ?')
      .get(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Get profile error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { nome, cognome, telefono, indirizzo_spedizione, lingua } = req.body;
    db.prepare(`
      UPDATE users SET nome = ?, cognome = ?, telefono = ?, indirizzo_spedizione = ?, lingua = ?
      WHERE id = ?
    `).run(nome, cognome, telefono, indirizzo_spedizione, lingua, req.user.id);

    logger.info('Profile updated', { userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    logger.error('Update profile error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, nome, cognome, ruolo FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Get user error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
