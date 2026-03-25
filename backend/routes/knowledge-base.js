const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { authenticateToken, requireProfessore } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const { categoria, lingua } = req.query;

    let query = 'SELECT id, categoria, titolo, contenuto, lingua, created_at FROM knowledge_base';
    const params = [];

    if (categoria || lingua) {
      query += ' WHERE ';
      const conditions = [];
      if (categoria) {
        conditions.push('categoria = ?');
        params.push(categoria);
      }
      if (lingua) {
        conditions.push('lingua = ?');
        params.push(lingua);
      }
      query += conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';
    const entries = db.prepare(query).all(...params);

    res.json(entries);
  } catch (err) {
    logger.error('Get knowledge base error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireProfessore, (req, res) => {
  try {
    const { categoria, titolo, contenuto, lingua } = req.body;

    if (!categoria || !titolo || !contenuto) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuid();
    db.prepare(`
      INSERT INTO knowledge_base (id, categoria, titolo, contenuto, lingua, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(id, categoria, titolo, contenuto, lingua || 'IT');

    logger.info('Knowledge base entry created', { entry_id: id, professore_id: req.user.id });
    res.status(201).json({ id });
  } catch (err) {
    logger.error('Create KB entry error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireProfessore, (req, res) => {
  try {
    const { titolo, contenuto, categoria, lingua } = req.body;

    const entry = db.prepare('SELECT id FROM knowledge_base WHERE id = ?').get(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const updates = [];
    const values = [];

    if (titolo !== undefined) {
      updates.push('titolo = ?');
      values.push(titolo);
    }
    if (contenuto !== undefined) {
      updates.push('contenuto = ?');
      values.push(contenuto);
    }
    if (categoria !== undefined) {
      updates.push('categoria = ?');
      values.push(categoria);
    }
    if (lingua !== undefined) {
      updates.push('lingua = ?');
      values.push(lingua);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const query = `UPDATE knowledge_base SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    logger.info('KB entry updated', { entry_id: req.params.id, professore_id: req.user.id });
    res.json({ success: true });
  } catch (err) {
    logger.error('Update KB entry error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireProfessore, (req, res) => {
  try {
    const entry = db.prepare('SELECT id FROM knowledge_base WHERE id = ?').get(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(req.params.id);

    logger.info('KB entry deleted', { entry_id: req.params.id, professore_id: req.user.id });
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete KB entry error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
