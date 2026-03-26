const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./config/env');
const logger = require('./services/logger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path}`, { status: res.statusCode, duration });
  });
  next();
});

// Health / debug endpoint (no auth required)
app.get('/api/health', (req, res) => {
  try {
    const db = require('./config/database');
    const counts = {
      corsi: db.prepare('SELECT COUNT(*) as n FROM corsi').get().n,
      esami: db.prepare('SELECT COUNT(*) as n FROM esami').get().n,
      domande: db.prepare('SELECT COUNT(*) as n FROM domande').get().n,
      users: db.prepare('SELECT COUNT(*) as n FROM users').get().n,
      esiti: db.prepare('SELECT COUNT(*) as n FROM esiti').get().n,
    };
    res.json({ status: 'ok', counts, db_path: require('./config/env').DB_PATH });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Manual seed trigger (requires admin token)
app.post('/api/admin/seed', (req, res) => {
  try {
    const { authenticateToken } = require('./middleware/auth');
    // inline auth check
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, require('./config/env').JWT_SECRET);
    if (decoded.ruolo !== 'professore') return res.status(403).json({ error: 'Not admin' });

    const db = require('./config/database');
    const fs = require('fs');
    const path = require('path');
    const { v4: uuid } = require('uuid');

    const results = { corsi: 0, esami: 0, domande: 0 };

    // Seed questions if none exist
    const questionCount = db.prepare('SELECT COUNT(*) as cnt FROM domande').get().cnt;
    if (questionCount === 0) {
      const questionsPath = path.join(__dirname, 'data', 'nihonshu-questions.json');
      if (!fs.existsSync(questionsPath)) {
        return res.status(500).json({ error: 'Questions file not found at ' + questionsPath });
      }
      const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
      const corso = db.prepare("SELECT id FROM corsi WHERE tipo = 'nihonshu' LIMIT 1").get();
      if (!corso) return res.status(500).json({ error: 'No nihonshu course found' });

      // Check if exam already exists
      let esame = db.prepare("SELECT id FROM esami WHERE nome = 'Esame Certificato Nihonshu'").get();
      if (!esame) {
        const esameId = uuid();
        db.prepare('INSERT INTO esami (id, corso_id, nome, tipo) VALUES (?, ?, ?, ?)')
          .run(esameId, corso.id, 'Esame Certificato Nihonshu', 'esame');
        esame = { id: esameId };
        results.esami = 1;
      }

      const stmt = db.prepare(`INSERT INTO domande (id, esame_id, numero, categoria, testo_it, tipo, risposta_corretta_it, opzioni_it, punti, attiva) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);
      const insertAll = db.transaction((qs) => {
        for (const q of qs) {
          stmt.run(uuid(), esame.id, q.numero, q.categoria, q.testo_it, q.tipo, q.risposta_corretta_it, q.opzioni_it, q.punti);
        }
      });
      insertAll(questions);
      results.domande = questions.length;
    } else {
      results.domande_existing = questionCount;
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/esami', require('./routes/esami'));
app.use('/api/risposte', require('./routes/risposte'));
app.use('/api/esiti', require('./routes/esiti'));
app.use('/api/users', require('./routes/users'));
app.use('/api/corsi', require('./routes/corsi'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/domande', require('./routes/domande'));
app.use('/api/api-keys', require('./routes/api-keys'));
app.use('/api/knowledge-base', require('./routes/knowledge-base'));
app.use('/api/email', require('./routes/email-send'));
app.use('/api/notifiche', require('./routes/notifiche'));
app.use('/api/airtable', require('./routes/airtable-sync'));
app.use('/api/export', require('./routes/export'));

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});
