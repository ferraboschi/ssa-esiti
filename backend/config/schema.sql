CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  telefono TEXT,
  indirizzo_spedizione TEXT,
  ruolo TEXT CHECK(ruolo IN ('studente', 'professore')) DEFAULT 'studente',
  lingua TEXT CHECK(lingua IN ('it', 'en', 'jp')) DEFAULT 'it',
  password_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS corsi (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  tipo TEXT CHECK(tipo IN ('nihonshu', 'shochu')) NOT NULL,
  descrizione TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS esami (
  id TEXT PRIMARY KEY,
  corso_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT CHECK(tipo IN ('feedback', 'test_esame', 'esame')) NOT NULL,
  data_esame DATETIME,
  citta TEXT,
  socrative_activity_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(corso_id) REFERENCES corsi(id)
);

CREATE TABLE IF NOT EXISTS domande (
  id TEXT PRIMARY KEY,
  esame_id TEXT NOT NULL,
  numero INTEGER NOT NULL,
  categoria TEXT,
  testo_it TEXT,
  testo_en TEXT,
  testo_jp TEXT,
  tipo TEXT CHECK(tipo IN ('scelta_multipla', 'risposta_aperta')) NOT NULL,
  risposta_corretta_it TEXT,
  risposta_corretta_en TEXT,
  risposta_corretta_jp TEXT,
  opzioni_it JSON,
  opzioni_en JSON,
  opzioni_jp JSON,
  punti REAL DEFAULT 1,
  attiva INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(esame_id) REFERENCES esami(id)
);

CREATE TABLE IF NOT EXISTS risposte_studenti (
  id TEXT PRIMARY KEY,
  esame_id TEXT NOT NULL,
  studente_id TEXT NOT NULL,
  domanda_id TEXT NOT NULL,
  risposta_data TEXT,
  is_corretta INTEGER,
  punteggio REAL,
  analisi_ai TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(esame_id) REFERENCES esami(id),
  FOREIGN KEY(studente_id) REFERENCES users(id),
  FOREIGN KEY(domanda_id) REFERENCES domande(id)
);

CREATE TABLE IF NOT EXISTS esiti (
  id TEXT PRIMARY KEY,
  esame_id TEXT NOT NULL,
  studente_id TEXT NOT NULL,
  punteggio_totale REAL,
  punteggio_percentuale REAL,
  superato INTEGER,
  tipo_esito TEXT CHECK(tipo_esito IN ('positivo', 'negativo', 'retake')),
  analisi_per_categoria JSON,
  livello_comprensione TEXT,
  note_ai TEXT,
  email_inviata INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(esame_id) REFERENCES esami(id),
  FOREIGN KEY(studente_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY,
  categoria TEXT,
  titolo TEXT NOT NULL,
  contenuto TEXT,
  lingua TEXT CHECK(lingua IN ('it', 'en', 'jp')) DEFAULT 'it',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chiave TEXT UNIQUE NOT NULL,
  nome TEXT,
  attiva INTEGER DEFAULT 1,
  last_used DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS log_attivita (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  azione TEXT NOT NULL,
  dettagli TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS shopify_tokens (
  id TEXT PRIMARY KEY,
  store TEXT NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risposte_studente ON risposte_studenti(studente_id);
CREATE INDEX IF NOT EXISTS idx_esiti_studente ON esiti(studente_id);
CREATE INDEX IF NOT EXISTS idx_domande_esame ON domande(esame_id);
