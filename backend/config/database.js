const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { DB_PATH } = require('./env');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Migration: add last_used column to api_keys if missing
try {
  const cols = db.prepare("PRAGMA table_info(api_keys)").all();
  if (!cols.find(c => c.name === 'last_used')) {
    db.exec('ALTER TABLE api_keys ADD COLUMN last_used DATETIME');
  }
} catch (e) { /* table may not exist yet */ }

try {
  if (db.prepare('SELECT COUNT(*) FROM corsi').get()['COUNT(*)'] === 0) {
    db.prepare('INSERT INTO corsi (id, nome, tipo, descrizione) VALUES (?, ?, ?, ?)').run(
      uuid(), 'Nihonshu Fundamentals', 'nihonshu', 'Introduction to Japanese sake'
    );
    db.prepare('INSERT INTO corsi (id, nome, tipo, descrizione) VALUES (?, ?, ?, ?)').run(
      uuid(), 'Shochu Essentials', 'shochu', 'Introduction to shochu spirits'
    );
  }

  // Admin account
  if (!db.prepare('SELECT COUNT(*) FROM users WHERE email = ?').get('admin')['COUNT(*)']) {
    const hash = bcrypt.hashSync('sakecompany2026', 10);
    db.prepare('INSERT INTO users (id, email, nome, cognome, ruolo, password_hash) VALUES (?, ?, ?, ?, ?, ?)')
      .run(uuid(), 'admin', 'Admin', 'SSA', 'professore', hash);
  }
  // Lorenzo account
  if (!db.prepare('SELECT COUNT(*) FROM users WHERE email = ?').get('lorenzo@ef-ti.com')['COUNT(*)']) {
    const hash = bcrypt.hashSync('sakecompany2026', 10);
    db.prepare('INSERT INTO users (id, email, nome, cognome, ruolo, password_hash) VALUES (?, ?, ?, ?, ?, ?)')
      .run(uuid(), 'lorenzo@ef-ti.com', 'Lorenzo', 'Maiko', 'professore', hash);
  }
} catch (err) {
  console.error('Seed error:', err.message);
}

module.exports = db;
