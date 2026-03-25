const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { JWT_SECRET } = require('../config/env');
const logger = require('../services/logger');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      user = {
        id: uuid(),
        email,
        nome: 'Student',
        cognome: '',
        ruolo: 'studente'
      };
      db.prepare(`
        INSERT INTO users (id, email, nome, cognome, ruolo)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.id, email, 'Student', '', 'studente');
    } else if (user.ruolo === 'professore' && !password) {
      return res.status(400).json({ error: 'Password required for professors' });
    } else if (user.ruolo === 'professore' && !bcrypt.compareSync(password, user.password_hash || '')) {
      logger.warn('Failed login attempt', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, ruolo: user.ruolo },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('User login', { email, ruolo: user.ruolo });
    res.json({ token, user: { id: user.id, email, ruolo: user.ruolo } });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  logger.info('User logout', { userId: req.headers.authorization });
  res.json({ success: true });
});

module.exports = router;
