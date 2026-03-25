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

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});
