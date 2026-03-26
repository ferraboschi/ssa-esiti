const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.get('/miei', authenticateToken, (req, res) => {
  try {
    // Professors get ALL esiti, students get only theirs
    const query = req.user.ruolo === 'professore'
      ? `SELECT e.*, ex.nome as esame_nome, u.email, u.nome, u.cognome
         FROM esiti e LEFT JOIN esami ex ON e.esame_id = ex.id
         LEFT JOIN users u ON e.studente_id = u.id ORDER BY e.created_at DESC`
      : `SELECT e.*, ex.nome as esame_nome FROM esiti e
         LEFT JOIN esami ex ON e.esame_id = ex.id
         WHERE e.studente_id = ? ORDER BY e.created_at DESC`;

    const esiti = req.user.ruolo === 'professore'
      ? db.prepare(query).all()
      : db.prepare(query).all(req.user.id);

    res.json(esiti);
  } catch (err) {
    logger.error('Get results error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all esiti for a specific exam (professors only)
router.get('/per-esame/:esame_id', authenticateToken, (req, res) => {
  try {
    if (req.user.ruolo !== 'professore') return res.status(403).json({ error: 'Not authorized' });

    const esiti = db.prepare(`
      SELECT e.*, u.email, u.nome, u.cognome
      FROM esiti e JOIN users u ON e.studente_id = u.id
      WHERE e.esame_id = ?
      ORDER BY u.cognome, u.nome
    `).all(req.params.esame_id);

    res.json(esiti);
  } catch (err) {
    logger.error('Get exam results error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const esito = db.prepare('SELECT * FROM esiti WHERE id = ?').get(req.params.id);
    if (!esito) return res.status(404).json({ error: 'Result not found' });

    if (esito.studente_id !== req.user.id && req.user.ruolo !== 'professore') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(esito);
  } catch (err) {
    logger.error('Get result error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { esame_id, punteggio_totale, punteggio_percentuale, tipo_esito } = req.body;
    if (!esame_id) return res.status(400).json({ error: 'Missing fields' });

    const id = uuid();
    const superato = punteggio_percentuale >= 70 ? 1 : 0;

    db.prepare(`
      INSERT INTO esiti
      (id, esame_id, studente_id, punteggio_totale, punteggio_percentuale, superato, tipo_esito)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, esame_id, req.user.id, punteggio_totale, punteggio_percentuale, superato, tipo_esito);

    logger.info('Result recorded', { esame_id, studente_id: req.user.id });
    res.status(201).json({ id });
  } catch (err) {
    logger.error('Create result error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
