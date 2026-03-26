require('dotenv').config();

// Determine DB path: use /data on Render if disk mounted, else ./data locally
const fs = require('fs');
let dbPath;
if (process.env.DB_PATH) {
  dbPath = process.env.DB_PATH;
} else if (process.env.RENDER && fs.existsSync('/data')) {
  dbPath = '/data/esiti.db';
} else {
  dbPath = './data/esiti.db';
}

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  AIRTABLE_PAT: process.env.AIRTABLE_PAT,
  CORSI_API_URL: process.env.CORSI_API_BASE || 'https://corsi.sakesommelierassociation.it/api',
  DB_PATH: dbPath,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SHOPIFY_STORE: process.env.SHOPIFY_STORE || 'sakesommelierassociation',
  SHOPIFY_CLIENT_ID: process.env.SHOPIFY_CLIENT_ID,
  SHOPIFY_CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET,
  SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT) || 587,
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS,
    FROM: process.env.SMTP_FROM || 'noreply@sakesommelierassociation.it'
  }
};
