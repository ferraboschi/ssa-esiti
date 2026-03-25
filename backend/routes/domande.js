const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const { esame_id } = req.query;
    if (!esame_id) return res.status(400).json({ error: 'esame_id required' });

    const domande = db.prepare(`
      SELECT * FROM domande WHERE esame_id = ? AND attiva = 1 ORDER BY numero
    `).all(esame_id);
    res.json(domande);
  } catch (err) {
    logger.error('Get domande error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const domanda = db.prepare('SELECT * FROM domande WHERE id = ?').get(req.params.id);
    if (!domanda) return res.status(404).json({ error: 'Question not found' });
    res.json(domanda);
  } catch (err) {
    logger.error('Get domanda error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { testo_it, testo_en, testo_jp, tipo, risposta_corretta_it, risposta_corretta_en,
      risposta_corretta_jp, opzioni_it, opzioni_en, opzioni_jp, categoria, punti } = req.body;

    const domanda = db.prepare('SELECT id FROM domande WHERE id = ?').get(req.params.id);
    if (!domanda) return res.status(404).json({ error: 'Question not found' });

    const fields = { testo_it, testo_en, testo_jp, tipo, risposta_corretta_it,
      risposta_corretta_en, risposta_corretta_jp, categoria, punti };
    // JSON fields
    if (opzioni_it) fields.opzioni_it = JSON.stringify(opzioni_it);
    if (opzioni_en) fields.opzioni_en = JSON.stringify(opzioni_en);
    if (opzioni_jp) fields.opzioni_jp = JSON.stringify(opzioni_jp);

    const updates = []; const values = [];
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) { updates.push(`${k} = ?`); values.push(v); }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.id);
    db.prepare(`UPDATE domande SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    logger.info('Question updated', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    logger.error('Update domanda error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const domanda = db.prepare('SELECT id FROM domande WHERE id = ?').get(req.params.id);
    if (!domanda) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE domande SET attiva = 0 WHERE id = ?').run(req.params.id);
    logger.info('Question deactivated', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete domanda error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
