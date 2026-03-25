const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  try {
    const { esame_id, domanda_id, risposta_data, is_corretta, punteggio } = req.body;
    if (!esame_id || !domanda_id) return res.status(400).json({ error: 'Missing fields' });

    const id = uuid();
    db.prepare(`
      INSERT INTO risposte_studenti
      (id, esame_id, studente_id, domanda_id, risposta_data, is_corretta, punteggio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, esame_id, req.user.id, domanda_id, risposta_data, is_corretta, punteggio);

    logger.info('Answer submitted', { esame_id, studente_id: req.user.id });
    res.status(201).json({ id });
  } catch (err) {
    logger.error('Submit answer error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/esame/:esame_id', authenticateToken, (req, res) => {
  try {
    const risposte = db.prepare(`
      SELECT * FROM risposte_studenti
      WHERE esame_id = ? AND studente_id = ?
      ORDER BY created_at DESC
    `).all(req.params.esame_id, req.user.id);

    res.json(risposte);
  } catch (err) {
    logger.error('Get answers error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
