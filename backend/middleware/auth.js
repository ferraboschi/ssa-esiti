const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../config/env');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const apiKey = req.headers['x-api-key'];

  if (apiKey) {
    try {
      const keyRecord = db.prepare(`
        SELECT ak.*, u.id, u.email, u.ruolo FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.chiave = ? AND ak.attiva = 1
      `).get(apiKey);

      if (keyRecord) {
        req.user = { id: keyRecord.id, email: keyRecord.email, ruolo: keyRecord.ruolo };
        return next();
      }
    } catch (err) {
      console.error('API key auth error:', err);
    }
  }

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function requireProfessore(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user.ruolo !== 'professore') {
      return res.status(403).json({ error: 'Professore role required' });
    }
    next();
  });
}

module.exports = { authenticateToken, requireProfessore };
