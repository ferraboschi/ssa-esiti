require('dotenv').config();

// Determine DB path: use /data on Render, ./data locally
const dbPath = process.env.RENDER
  ? '/data/esiti.db'
  : (process.env.DB_PATH || './data/esiti.db');

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  AIRTABLE_PAT: process.env.AIRTABLE_PAT,
  CORSI_API_URL: process.env.CORSI_API_BASE || 'https://corsi.sakesommelierassociation.it/api',
  DB_PATH: dbPath,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT) || 587,
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS,
    FROM: process.env.SMTP_FROM || 'noreply@sakesommelierassociation.it'
  }
};
