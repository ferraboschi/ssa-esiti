const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const esami = db.prepare(`
      SELECT e.*, c.nome as corso_nome FROM esami e
      LEFT JOIN corsi c ON e.corso_id = c.id
      ORDER BY e.data_esame DESC
    `).all();
    res.json(esami);
  } catch (err) {
    logger.error('Get exams error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const esame = db.prepare(`
      SELECT e.*, c.nome as corso_nome FROM esami e
      LEFT JOIN corsi c ON e.corso_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!esame) return res.status(404).json({ error: 'Exam not found' });

    const domande = db.prepare('SELECT * FROM domande WHERE esame_id = ? AND attiva = 1 ORDER BY numero').all(req.params.id);

    res.json({ ...esame, domande });
  } catch (err) {
    logger.error('Get exam error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { corso_id, nome, tipo, data_esame, citta } = req.body;
    if (!corso_id || !nome || !tipo) return res.status(400).json({ error: 'Missing fields' });

    const id = uuid();
    db.prepare(`
      INSERT INTO esami (id, corso_id, nome, tipo, data_esame, citta)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, corso_id, nome, tipo, data_esame, citta);

    logger.info('Exam created', { id, nome });
    res.status(201).json({ id, nome, tipo });
  } catch (err) {
    logger.error('Create exam error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
