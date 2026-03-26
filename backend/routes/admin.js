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

    // Enrich each user with enrollment info (most recent enrollment)
    const enriched = users.map(user => {
      try {
        const iscrizioni = db.prepare(`
          SELECT tipo_corso, citta, corso_nome, data_corso
          FROM iscrizioni
          WHERE studente_id = ?
          ORDER BY created_at DESC
        `).all(user.id);

        if (iscrizioni.length > 0) {
          user.tipo_corso = iscrizioni[0].tipo_corso;
          user.citta = iscrizioni[0].citta;
          user.corso_nome = iscrizioni[0].corso_nome;
          user.data_corso = iscrizioni[0].data_corso;
          if (iscrizioni.length > 1) {
            user.altri_corsi = iscrizioni.length - 1;
          }
        }
      } catch (e) {
        // iscrizioni table might not exist yet on first deploy
      }
      return user;
    });

    res.json(enriched);
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
