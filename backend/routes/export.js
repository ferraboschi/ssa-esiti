const express = require('express');
const XLSX = require('xlsx');
const db = require('../config/database');
const { requireProfessore } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

// Export esiti as XLS for an exam
router.get('/esiti/:esame_id', requireProfessore, (req, res) => {
  try {
    const esame = db.prepare('SELECT nome FROM esami WHERE id = ?').get(req.params.esame_id);
    if (!esame) return res.status(404).json({ error: 'Esame non trovato' });

    const esiti = db.prepare(`
      SELECT e.punteggio_totale, e.punteggio_percentuale, e.superato,
        e.tipo_esito, e.livello_comprensione, e.analisi_per_categoria,
        e.email_inviata, e.created_at,
        u.email, u.nome, u.cognome, u.telefono
      FROM esiti e
      JOIN users u ON e.studente_id = u.id
      WHERE e.esame_id = ?
      ORDER BY u.cognome, u.nome
    `).all(req.params.esame_id);

    const rows = esiti.map(e => {
      const catAnalysis = e.analisi_per_categoria ? JSON.parse(e.analisi_per_categoria) : {};
      return {
        'Nome': e.nome,
        'Cognome': e.cognome,
        'Email': e.email,
        'Telefono': e.telefono || '',
        'Punteggio Totale': e.punteggio_totale,
        'Percentuale': e.punteggio_percentuale,
        'Superato': e.superato ? 'SI' : 'NO',
        'Esito': e.tipo_esito,
        'Comprensione': e.livello_comprensione || '',
        'Email Inviata': e.email_inviata ? 'SI' : 'NO',
        'Data': e.created_at,
        ...Object.fromEntries(
          Object.entries(catAnalysis).map(([k, v]) => [`Cat: ${k}`, typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : v])
        )
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-width columns
    const colWidths = Object.keys(rows[0] || {}).map(k => ({
      wch: Math.max(k.length, ...rows.map(r => String(r[k] || '').length)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Esiti');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const filename = `esiti_${esame.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

    logger.info('Export generated', { esame_id: req.params.esame_id, rows: rows.length });
  } catch (err) {
    logger.error('Export error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
