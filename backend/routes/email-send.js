const express = require('express');
const db = require('../config/database');
const { requireProfessore } = require('../middleware/auth');
const logger = require('../services/logger');
const emailSvc = require('../services/email');

const router = express.Router();

function getEsitoWithDetails(esitoId) {
  const esito = db.prepare(`
    SELECT e.*, u.email, u.nome, u.cognome, u.lingua, ex.nome as esame_nome
    FROM esiti e JOIN users u ON e.studente_id = u.id
    JOIN esami ex ON e.esame_id = ex.id WHERE e.id = ?
  `).get(esitoId);
  if (!esito) return null;

  const wrongAnswers = db.prepare(`
    SELECT d.testo_it as question, r.risposta_data as studentAnswer,
      d.risposta_corretta_it as correctAnswer, d.categoria
    FROM risposte_studenti r JOIN domande d ON r.domanda_id = d.id
    WHERE r.esame_id = ? AND r.studente_id = ? AND r.is_corretta = 0
  `).all(esito.esame_id, esito.studente_id);

  return { esito, wrongAnswers };
}

function buildEmail(esito, wrongAnswers) {
  const data = {
    student: { nome: esito.nome, cognome: esito.cognome },
    score: esito.punteggio_percentuale / 100,
    categoryScores: esito.analisi_per_categoria ? JSON.parse(esito.analisi_per_categoria) : {},
    wrongAnswers, language: esito.lingua || 'it'
  };
  if (esito.tipo_esito === 'positivo') return emailSvc.buildEsitoPositivoHTML(data);
  if (esito.tipo_esito === 'negativo') return emailSvc.buildEsitoNegativoHTML(data);
  return emailSvc.buildRetakeHTML({ ...data, weakAreas: wrongAnswers.map(w => w.question).slice(0, 5) });
}

// Send single esito email
router.post('/invia/:esito_id', requireProfessore, async (req, res) => {
  try {
    const result = getEsitoWithDetails(req.params.esito_id);
    if (!result) return res.status(404).json({ error: 'Esito not found' });

    const html = buildEmail(result.esito, result.wrongAnswers);
    const subject = `SSA Esame - ${result.esito.esame_nome}`;
    await emailSvc.sendEsitoEmail(result.esito.email, subject, html);

    db.prepare('UPDATE esiti SET email_inviata = 1 WHERE id = ?').run(req.params.esito_id);
    logger.info('Email sent', { esito_id: req.params.esito_id, to: result.esito.email });
    res.json({ success: true, sent_to: result.esito.email });
  } catch (err) {
    logger.error('Send email error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Send all esito emails for an exam
router.post('/invia-tutti/:esame_id', requireProfessore, async (req, res) => {
  try {
    const esiti = db.prepare('SELECT id FROM esiti WHERE esame_id = ?').all(req.params.esame_id);
    if (!esiti.length) return res.status(404).json({ error: 'No esiti found' });

    let sent = 0; const errors = [];
    for (const { id } of esiti) {
      try {
        const result = getEsitoWithDetails(id);
        if (!result) continue;
        const html = buildEmail(result.esito, result.wrongAnswers);
        await emailSvc.sendEsitoEmail(result.esito.email, `SSA Esame - ${result.esito.esame_nome}`, html);
        db.prepare('UPDATE esiti SET email_inviata = 1 WHERE id = ?').run(id);
        sent++;
      } catch (e) { errors.push({ id, error: e.message }); }
    }

    logger.info('Batch email', { esame_id: req.params.esame_id, sent, errors: errors.length });
    res.json({ success: true, sent, total: esiti.length, errors });
  } catch (err) {
    logger.error('Batch email error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
