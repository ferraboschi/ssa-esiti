require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const { v4: uuid } = require('uuid');
const db = require('../config/database');
const { parseExamQuestions } = require('../services/excel-parser');

const EXCEL_FILE = '/sessions/zen-epic-fermat/mnt/uploads/nuovo esame certificatoCATEGORIE.xlsx';
const EXAM_NAME = 'Nihonshu Certificato';
const COURSE_NAME = 'Nihonshu Fundamentals';

async function importQuestions() {
  try {
    console.log('Starting question import...\n');

    // 1. Parse Excel file
    console.log(`[1/5] Parsing Excel file: ${EXCEL_FILE}`);
    const questions = parseExamQuestions(EXCEL_FILE);
    console.log(`✓ Parsed ${questions.length} questions\n`);

    // 2. Find or create course
    console.log('[2/5] Finding or creating course...');
    let course = db.prepare('SELECT id FROM corsi WHERE nome = ?').get(COURSE_NAME);
    if (!course) {
      const courseId = uuid();
      db.prepare('INSERT INTO corsi (id, nome, tipo, descrizione) VALUES (?, ?, ?, ?)').run(
        courseId,
        COURSE_NAME,
        'nihonshu',
        'Japanese sake sommelier certification course'
      );
      course = { id: courseId };
      console.log(`✓ Created course: ${COURSE_NAME}`);
    } else {
      console.log(`✓ Found existing course: ${COURSE_NAME}`);
    }
    console.log();

    // 3. Find or create exam
    console.log('[3/5] Finding or creating exam...');
    let exam = db.prepare('SELECT id FROM esami WHERE nome = ? AND corso_id = ?').get(EXAM_NAME, course.id);
    if (!exam) {
      const examId = uuid();
      db.prepare(
        'INSERT INTO esami (id, corso_id, nome, tipo, data_esame, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
      ).run(examId, course.id, EXAM_NAME, 'esame', new Date().toISOString());
      exam = { id: examId };
      console.log(`✓ Created exam: ${EXAM_NAME}`);
    } else {
      console.log(`✓ Found existing exam: ${EXAM_NAME}`);
    }
    console.log();

    // 4. Delete existing questions for this exam (to allow re-import)
    console.log('[4/5] Clearing existing questions...');
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM domande WHERE esame_id = ?').get(exam.id);
    if (existingCount.count > 0) {
      db.prepare('DELETE FROM domande WHERE esame_id = ?').run(exam.id);
      console.log(`✓ Removed ${existingCount.count} existing questions`);
    } else {
      console.log('✓ No existing questions to remove');
    }
    console.log();

    // 5. Insert new questions
    console.log('[5/5] Inserting questions...');
    const insertStmt = db.prepare(`
      INSERT INTO domande (
        id, esame_id, numero, categoria, testo_it, tipo,
        risposta_corretta_it, opzioni_it, punti, attiva, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    let successCount = 0;
    let errorCount = 0;

    const insertMany = db.transaction((questionsToInsert) => {
      for (const q of questionsToInsert) {
        try {
          insertStmt.run(
            uuid(),                                      // id
            exam.id,                                     // esame_id
            q.index,                                     // numero
            q.category,                                  // categoria
            q.questionText,                              // testo_it
            'scelta_multipla',                           // tipo (all are multiple choice)
            q.correctAnswer,                             // risposta_corretta_it
            JSON.stringify(q.allOptions),                // opzioni_it
            1,                                           // punti
            1                                            // attiva
          );
          successCount++;
          if (successCount % 10 === 0) {
            process.stdout.write(`\r  Inserted: ${successCount}/${questions.length}`);
          }
        } catch (err) {
          errorCount++;
          console.error(`\n  ✗ Error inserting question ${q.index} (${q.category}): ${err.message}`);
        }
      }
    });

    insertMany(questions);
    console.log(`\r  ✓ Inserted: ${successCount}/${questions.length}`);

    if (errorCount > 0) {
      console.log(`  ⚠ ${errorCount} questions failed to insert`);
    }
    console.log();

    console.log('═'.repeat(50));
    console.log('IMPORT SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Course: ${COURSE_NAME}`);
    console.log(`Exam: ${EXAM_NAME}`);
    console.log(`Total questions imported: ${successCount}`);
    console.log(`Questions with errors: ${errorCount}`);
    console.log('═'.repeat(50));
    console.log('\n✓ Import completed successfully!\n');

    process.exit(0);
  } catch (err) {
    console.error('\n✗ Fatal error during import:');
    console.error(err);
    process.exit(1);
  }
}

importQuestions();
