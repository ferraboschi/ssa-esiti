const nodemailer = require('nodemailer');
const env = require('../config/env');

const FROM_ADDRESS = 'corsi@sakesommelierassociation.it';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP.HOST,
      port: env.SMTP.PORT,
      secure: false,
      auth: {
        user: env.SMTP.USER,
        pass: env.SMTP.PASS
      }
    });
  }
  return transporter;
}

async function sendEsitoEmail(to, subject, htmlContent) {
  try {
    const info = await getTransporter().sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html: htmlContent
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('sendEsitoEmail error:', err);
    throw err;
  }
}

function buildEsitoPositivoHTML(data) {
  const { student, score, categoryScores, wrongAnswers, language } = data;
  const isCertified = score >= 0.8;

  return `
    <h2>Congratulations, ${student.nome}!</h2>
    <p>You have successfully passed the SSA Sommelier exam with a score of <strong>${(score * 100).toFixed(1)}%</strong></p>

    <h3>Category Breakdown</h3>
    <ul>
      ${Object.entries(categoryScores).map(([cat, s]) =>
        `<li>${cat}: ${(s * 100).toFixed(1)}%</li>`
      ).join('')}
    </ul>

    ${wrongAnswers && wrongAnswers.length > 0 ? `
    <h3>Areas for Review</h3>
    <ul>
      ${wrongAnswers.slice(0, 3).map(w =>
        `<li><strong>${w.question}</strong> - You answered: "${w.studentAnswer}" | Correct: "${w.correctAnswer}"</li>`
      ).join('')}
    </ul>
    ` : ''}

    ${isCertified ? `<p>You are now certified! Join our exclusive <a href="#">Certified Sommeliers Group</a></p>` : ''}

    <p>Best regards,<br>SSA Education Team</p>
  `;
}

function buildEsitoNegativoHTML(data) {
  const { student, score, categoryScores, wrongAnswers } = data;

  return `
    <h2>Exam Results, ${student.nome}</h2>
    <p>Your exam score: <strong>${(score * 100).toFixed(1)}%</strong></p>

    <h3>Category Breakdown</h3>
    <ul>
      ${Object.entries(categoryScores).map(([cat, s]) =>
        `<li>${cat}: ${(s * 100).toFixed(1)}%</li>`
      ).join('')}
    </ul>

    <h3>Areas to Study</h3>
    <ul>
      ${wrongAnswers.map(w =>
        `<li><strong>${w.question}</strong> - You answered: "${w.studentAnswer}" | Correct: "${w.correctAnswer}"</li>`
      ).join('')}
    </ul>

    <p>Don't worry! You can retake the exam for <strong>free</strong>. Contact us to schedule your next attempt.</p>
    <p>Best regards,<br>SSA Education Team</p>
  `;
}

function buildRetakeHTML(data) {
  const { student, score, categoryScores, weakAreas } = data;

  return `
    <h2>Exam Results, ${student.nome}</h2>
    <p>Congratulations on passing! Your score: <strong>${(score * 100).toFixed(1)}%</strong></p>

    <h3>Category Breakdown</h3>
    <ul>
      ${Object.entries(categoryScores).map(([cat, s]) =>
        `<li>${cat}: ${(s * 100).toFixed(1)}%</li>`
      ).join('')}
    </ul>

    <h3>Areas to Strengthen Before Certification</h3>
    <p>Focus on these topics to achieve full certification:</p>
    <ul>
      ${weakAreas.map(area => `<li>${area}</li>`).join('')}
    </ul>

    <p>Best regards,<br>SSA Education Team</p>
  `;
}

module.exports = {
  sendEsitoEmail,
  buildEsitoPositivoHTML,
  buildEsitoNegativoHTML,
  buildRetakeHTML
};
