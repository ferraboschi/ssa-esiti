// Seed script: imports Nihonshu questions from JSON into the database
// Run: node scripts/seed-questions.js

const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

// Set up env before requiring database
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const db = require('../config/database');

function seedNihonshuQuestions() {
  const dataPath = path.join(__dirname, '../data/nihonshu-questions.json');
  if (!fs.existsSync(dataPath)) {
    console.log('No nihonshu-questions.json found, skipping');
    return 0;
  }

  const questions = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Found ${questions.length} questions to import`);

  // Find or create Nihonshu course
  let corso = db.prepare("SELECT id FROM corsi WHERE tipo = 'nihonshu' LIMIT 1").get();
  if (!corso) {
    const corsoId = uuid();
    db.prepare('INSERT INTO corsi (id, nome, tipo, descrizione) VALUES (?, ?, ?, ?)')
      .run(corsoId, 'Nihonshu Fundamentals', 'nihonshu', 'Corso fondamentale sul sake giapponese');
    corso = { id: corsoId };
    console.log('Created Nihonshu course:', corsoId);
  }

  // Create exam "Esame Certificato Nihonshu"
  let esame = db.prepare("SELECT id FROM esami WHERE nome = 'Esame Certificato Nihonshu' LIMIT 1").get();
  if (!esame) {
    const esameId = uuid();
    db.prepare('INSERT INTO esami (id, corso_id, nome, tipo) VALUES (?, ?, ?, ?)')
      .run(esameId, corso.id, 'Esame Certificato Nihonshu', 'esame');
    esame = { id: esameId };
    console.log('Created exam:', esameId);
  }

  // Check if questions already exist
  const existingCount = db.prepare('SELECT COUNT(*) as cnt FROM domande WHERE esame_id = ?').get(esame.id).cnt;
  if (existingCount > 0) {
    console.log(`Exam already has ${existingCount} questions, skipping import`);
    return existingCount;
  }

  // Insert questions
  const stmt = db.prepare(`
    INSERT INTO domande (id, esame_id, numero, categoria, testo_it, tipo, risposta_corretta_it, opzioni_it, punti, attiva)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const insertAll = db.transaction((qs) => {
    for (const q of qs) {
      stmt.run(
        uuid(), esame.id, q.numero, q.categoria,
        q.testo_it, q.tipo, q.risposta_corretta_it,
        q.opzioni_it, q.punti
      );
    }
  });

  insertAll(questions);
  console.log(`Imported ${questions.length} questions for exam "${esame.id}"`);
  return questions.length;
}

// Run
const count = seedNihonshuQuestions();
console.log(`Done. Total questions seeded: ${count}`);
process.exit(0);
