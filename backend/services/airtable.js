const BASE_ID = 'appj4DEH3RYFqct1Q';
const API_URL = 'https://api.airtable.com/v0';

async function fetchStudents(tableId) {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error('AIRTABLE_PAT not set');

  try {
    const response = await fetch(
      `${API_URL}/${BASE_ID}/${encodeURIComponent(tableId)}`,
      { headers: { Authorization: `Bearer ${pat}` } }
    );
    if (!response.ok) throw new Error(`Airtable API error: ${response.status}`);
    const data = await response.json();
    return data.records || [];
  } catch (err) {
    console.error('fetchStudents error:', err);
    throw err;
  }
}

async function syncStudentsToLocal(db) {
  try {
    const records = await fetchStudents('Iscrizioni Corsi');
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, nome, cognome, email, telefono, indirizzo_spedizione, ruolo)
      VALUES (?, ?, ?, ?, ?, ?, 'studente')
    `);
    const insertMany = db.transaction((students) => {
      for (const s of students) {
        stmt.run(s.id, s.nome || '', s.cognome || '', s.email || '', s.telefono || '', s.indirizzo || '');
      }
    });
    const students = records.map(r => ({
      id: r.id,
      nome: r.fields.Nome || r.fields.nome || '',
      cognome: r.fields.Cognome || r.fields.cognome || '',
      email: r.fields.Email || r.fields.email || '',
      telefono: r.fields.Telefono || r.fields.telefono || '',
      indirizzo: r.fields['Indirizzo Spedizione'] || r.fields.indirizzo_spedizione || ''
    }));
    insertMany(students);
    return students.length;
  } catch (err) {
    console.error('syncStudentsToLocal error:', err);
    throw err;
  }
}

async function searchStudent(email) {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error('AIRTABLE_PAT not set');

  try {
    const filterByFormula = `{email} = '${email.replace(/'/g, "''")}'`;
    const response = await fetch(
      `${API_URL}/${BASE_ID}/Iscrizioni%20Corsi?filterByFormula=${encodeURIComponent(filterByFormula)}`,
      { headers: { Authorization: `Bearer ${pat}` } }
    );
    if (!response.ok) throw new Error(`Airtable search error: ${response.status}`);
    const data = await response.json();
    return data.records[0] || null;
  } catch (err) {
    console.error('searchStudent error:', err);
    throw err;
  }
}

module.exports = {
  fetchStudents,
  syncStudentsToLocal,
  searchStudent
};
