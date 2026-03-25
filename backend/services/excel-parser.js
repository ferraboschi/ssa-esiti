const XLSX = require('xlsx');

const CATEGORIES = [
  'STORIA',
  'PRODUZIONE',
  'INGREDIENTI',
  'COCKTAIL',
  'ETICHETTE',
  'FINITURE E ANALISI',
  'INDUSTRIA E ICONE DEL SAKE',
  'MISUNDERSTANDING',
  'SAKE & FOOD PAIRING',
  'SERVIZIO',
  'TASTING'
];

function parseExamQuestions(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const questions = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) break;

      const question = {
        index: i,
        category: row[1],
        questionText: row[2],
        correctAnswer: row[3],
        wrongAnswers: [row[4], row[5], row[6]].filter(Boolean),
        allOptions: [row[3], row[4], row[5], row[6]].filter(Boolean)
      };

      if (CATEGORIES.includes(question.category)) {
        questions.push(question);
      }
    }

    return questions;
  } catch (err) {
    console.error('parseExamQuestions error:', err);
    throw err;
  }
}

function parseSocrativeResults(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const results = rows.map(row => ({
      studentName: row['Student Name'] || row['Nome Studente'],
      studentEmail: row['Email'] || row['Email Studente'],
      totalQuestions: row['Number of Questions'] || row['Numero Domande'],
      correctAnswers: row['Number Correct'] || row['Risposte Corrette'],
      score: row['Score (%)'] || row['Punteggio (%)'],
      timeSpent: row['Time Spent'] || row['Tempo Impiegato'],
      answers: parseStudentAnswers(row)
    }));

    return results;
  } catch (err) {
    console.error('parseSocrativeResults error:', err);
    throw err;
  }
}

function parseStudentAnswers(row) {
  const answers = [];
  let qIndex = 1;

  for (const [key, value] of Object.entries(row)) {
    if (key.match(/^Q\d+|^Domanda\d+/)) {
      answers.push({
        questionNumber: qIndex,
        studentAnswer: value,
        isCorrect: row[`${key} - is_correct`] === 'TRUE' || row[`${key} - Corretto`] === true
      });
      qIndex++;
    }
  }

  return answers;
}

module.exports = {
  parseExamQuestions,
  parseSocrativeResults,
  CATEGORIES
};
