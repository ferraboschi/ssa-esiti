const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { requireProfessore } = require('../middleware/auth');
const logger = require('../services/logger');
const { parseExamQuestions, parseSocrativeResults } = require('../services/excel-parser');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Upload exam questions from Excel
router.post('/excel-domande', requireProfessore, upload.single('file'), (req, res) => {
  try {
    if (!req.file || !req.body.esame_id) {
      return res.status(400).json({ error: 'File and esame_id required' });
    }
    const questions = parseExamQuestions(req.file.path);
    const stmt = db.prepare(`
      INSERT INTO domande (id, esame_id, numero, categoria, testo_it, tipo,
        risposta_corretta_it, opzioni_it, punti, attiva)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `);
    const insertAll = db.transaction((qs) => {
      for (const q of qs) {
        stmt.run(uuid(), req.body.esame_id, q.index, q.category, q.questionText,
          q.wrongAnswers.length > 0 ? 'scelta_multipla' : 'risposta_aperta',
          q.correctAnswer, JSON.stringify(q.allOptions));
      }
    });
    insertAll(questions);
    fs.unlinkSync(req.file.path);
    logger.info('Questions uploaded', { esame_id: req.body.esame_id, count: questions.length });
    res.json({ success: true, inserted: questions.length });
  } catch (err) {
    logger.error('Upload domande error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Upload Socrative results
router.post('/socrative-risultati', requireProfessore, upload.single('file'), (req, res) => {
  try {
    if (!req.file || !req.body.esame_id) {
      return res.status(400).json({ error: 'File and esame_id required' });
    }
    const results = parseSocrativeResults(req.file.path);
    const esameId = req.body.esame_id;
    const domande = db.prepare('SELECT * FROM domande WHERE esame_id = ? ORDER BY numero').all(esameId);
    let totalInserted = 0;

    const stmtUser = db.prepare('SELECT id FROM users WHERE email = ?');
    const stmtInsertUser = db.prepare(`INSERT INTO users (id, email, nome, cognome, ruolo) VALUES (?, ?, ?, ?, 'studente')`);
    const stmtResp = db.prepare(`
      INSERT INTO risposte_studenti (id, esame_id, studente_id, domanda_id, risposta_data, is_corretta, punteggio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertResults = db.transaction((studentResults) => {
      for (const sr of studentResults) {
        let user = stmtUser.get(sr.studentEmail);
        if (!user && sr.studentEmail) {
          const uid = uuid();
          stmtInsertUser.run(uid, sr.studentEmail, sr.studentName || '', '', );
          user = { id: uid };
        }
        if (!user) continue;
        for (const ans of sr.answers) {
          const domanda = domande[ans.questionNumber - 1];
          if (!domanda) continue;
          stmtResp.run(uuid(), esameId, user.id, domanda.id,
            ans.studentAnswer, ans.isCorrect ? 1 : 0, ans.isCorrect ? 1 : 0);
          totalInserted++;
        }
      }
    });
    insertResults(results);
    fs.unlinkSync(req.file.path);
    logger.info('Socrative results uploaded', { esame_id: esameId, answers: totalInserted });
    res.json({ success: true, students: results.length, answers: totalInserted });
  } catch (err) {
    logger.error('Upload results error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Correct an exam - compare answers, grade, generate esiti
router.post('/correggi/:esame_id', requireProfessore, async (req, res) => {
  try {
    const { esame_id } = req.params;
    const domande = db.prepare('SELECT * FROM domande WHERE esame_id = ? AND attiva = 1 ORDER BY numero').all(esame_id);
    const students = db.prepare('SELECT DISTINCT studente_id FROM risposte_studenti WHERE esame_id = ?').all(esame_id);
    const claudeAi = require('../services/claude-ai');
    let corretti = 0;

    for (const { studente_id } of students) {
      let punteggio = 0;
      const catScores = {};
      const catTotals = {};

      for (const d of domande) {
        if (!catScores[d.categoria]) { catScores[d.categoria] = 0; catTotals[d.categoria] = 0; }
        catTotals[d.categoria]++;
        const r = db.prepare('SELECT * FROM risposte_studenti WHERE esame_id=? AND studente_id=? AND domanda_id=?')
          .get(esame_id, studente_id, d.id);
        if (!r) continue;

        let correct = false;
        if (d.tipo === 'scelta_multipla') {
          correct = r.risposta_data === d.risposta_corretta_it;
        } else {
          try {
            const grade = await claudeAi.gradeOpenAnswer(d.testo_it, r.risposta_data, d.risposta_corretta_it, '');
            correct = grade.isCorrect;
            db.prepare('UPDATE risposte_studenti SET analisi_ai=? WHERE id=?').run(JSON.stringify(grade), r.id);
          } catch (e) { logger.error('AI grade failed', { error: e.message }); }
        }
        if (correct) { punteggio++; catScores[d.categoria]++; }
        db.prepare('UPDATE risposte_studenti SET is_corretta=?, punteggio=? WHERE id=?')
          .run(correct ? 1 : 0, correct ? 1 : 0, r.id);
      }

      const perc = Math.round((punteggio / domande.length) * 100);
      const tipo = perc >= 70 ? 'positivo' : perc >= 50 ? 'retake' : 'negativo';
      const analisi = {};
      for (const cat of Object.keys(catTotals)) {
        analisi[cat] = { correct: catScores[cat], total: catTotals[cat], pct: Math.round((catScores[cat]/catTotals[cat])*100) };
      }

      db.prepare(`INSERT INTO esiti (id, esame_id, studente_id, punteggio_totale, punteggio_percentuale, superato, tipo_esito, analisi_per_categoria)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(uuid(), esame_id, studente_id, punteggio, perc, perc >= 70 ? 1 : 0, tipo, JSON.stringify(analisi));
      corretti++;
    }

    logger.info('Exam corrected', { esame_id, students: corretti });
    res.json({ success: true, corretti });
  } catch (err) {
    logger.error('Correction error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
