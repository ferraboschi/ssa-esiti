const express = require('express');
const db = require('../config/database');
const { requireProfessore } = require('../middleware/auth');
const logger = require('../services/logger');
const emailSvc = require('../services/email');

const router = express.Router();

// Send generic notification to course students
router.post('/invia', requireProfessore, async (req, res) => {
  try {
    const { corso_id, messaggio, tipo } = req.body;
    if (!messaggio) return res.status(400).json({ error: 'Messaggio richiesto' });

    let students = [];
    if (corso_id) {
      // Get students who have esiti for exams in this course
      students = db.prepare(`
        SELECT DISTINCT u.id, u.email, u.nome, u.cognome
        FROM users u
        JOIN esiti e ON e.studente_id = u.id
        JOIN esami ex ON e.esame_id = ex.id
        WHERE ex.corso_id = ? AND u.ruolo = 'studente'
      `).all(corso_id);
    } else {
      students = db.prepare(
        "SELECT id, email, nome, cognome FROM users WHERE ruolo = 'studente'"
      ).all();
    }

    if (!students.length) {
      return res.json({ success: true, sent: 0, message: 'Nessuno studente trovato' });
    }

    const subject = tipo === 'invito_corso' ? 'SSA - Invito Corso'
      : tipo === 'promemoria_esame' ? 'SSA - Promemoria Esame'
      : tipo === 'gruppo_certificati' ? 'SSA - Gruppo Certificati'
      : 'SSA - Comunicazione';

    let sent = 0;
    const errors = [];
    for (const student of students) {
      try {
        const html = buildNotificaHTML(student, messaggio, tipo);
        await emailSvc.sendEsitoEmail(student.email, subject, html);
        sent++;
      } catch (err) {
        errors.push({ email: student.email, error: err.message });
      }
    }

    // Log activity
    try {
      db.prepare('INSERT INTO log_attivita (user_id, azione, dettagli) VALUES (?, ?, ?)')
        .run(req.user.id, 'notifica_inviata', JSON.stringify({ tipo, sent, total: students.length }));
    } catch (e) { /* ignore log errors */ }

    logger.info('Notification sent', { tipo, sent, total: students.length });
    res.json({ success: true, sent, total: students.length, errors });
  } catch (err) {
    logger.error('Send notification error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

function buildNotificaHTML(student, messaggio, tipo) {
  const name = student.nome || student.email;
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #635BFF; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🍶 Sake Sommelier Association</h1>
      </div>
      <div style="padding: 30px; background: white; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 20px;">Ciao ${name},</p>
        <div style="white-space: pre-line; line-height: 1.6; color: #333;">${messaggio}</div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; margin: 0;">Sake Sommelier Association<br>corsi@sakesommelierassociation.it</p>
      </div>
    </div>
  `;
}

module.exports = router;
