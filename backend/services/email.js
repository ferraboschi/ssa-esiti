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

  const CERTIFIED_GROUP_LINK = 'https://chat.whatsapp.com/SSACertifiedSommeliers';

  return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #635BFF; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🍶 Sake Sommelier Association</h1>
      </div>
      <div style="padding: 30px; background: white; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #30D158; margin: 0 0 16px;">Complimenti, ${student.nome}!</h2>
        <p style="font-size: 16px; margin: 0 0 20px;">Hai superato l'esame SSA con un punteggio di <strong>${(score * 100).toFixed(1)}%</strong></p>

        <h3 style="margin: 20px 0 10px; font-size: 15px;">Risultati per Categoria</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${Object.entries(categoryScores).map(([cat, s]) =>
            `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${cat}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: ${(typeof s === 'number' ? s : 0) >= 0.7 ? '#30D158' : '#FF453A'};">${(typeof s === 'number' ? s * 100 : 0).toFixed(1)}%</td></tr>`
          ).join('')}
        </table>

        ${wrongAnswers && wrongAnswers.length > 0 ? `
        <h3 style="margin: 20px 0 10px; font-size: 15px;">Aree di Miglioramento</h3>
        <ul style="padding-left: 20px; margin: 0 0 20px;">
          ${wrongAnswers.slice(0, 5).map(w =>
            `<li style="margin-bottom: 8px;"><strong>${w.question}</strong><br><span style="color: #FF453A;">Tua risposta: "${w.studentAnswer}"</span> — <span style="color: #30D158;">Corretta: "${w.correctAnswer}"</span></li>`
          ).join('')}
        </ul>
        ` : ''}

        <div style="background: #F4F1FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px; color: #635BFF; font-size: 15px;">🎉 Sei ora un Sake Sommelier Certificato!</h3>
          <p style="margin: 0 0 12px; font-size: 14px;">Unisciti al gruppo esclusivo dei Sake Sommelier certificati per restare aggiornato su eventi, degustazioni e opportunità:</p>
          <a href="${CERTIFIED_GROUP_LINK}" style="display: inline-block; padding: 10px 24px; background: #635BFF; color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">Unisciti al Gruppo Certificati</a>
        </div>

        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">Sake Sommelier Association<br>corsi@sakesommelierassociation.it</p>
      </div>
    </div>
  `;
}

function buildEsitoNegativoHTML(data) {
  const { student, score, categoryScores, wrongAnswers } = data;

  return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #635BFF; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🍶 Sake Sommelier Association</h1>
      </div>
      <div style="padding: 30px; background: white; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 16px;">Risultati Esame, ${student.nome}</h2>
        <p style="font-size: 16px; margin: 0 0 20px;">Il tuo punteggio: <strong>${(score * 100).toFixed(1)}%</strong></p>

        <h3 style="margin: 20px 0 10px; font-size: 15px;">Risultati per Categoria</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${Object.entries(categoryScores).map(([cat, s]) =>
            `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${cat}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: ${(typeof s === 'number' ? s : 0) >= 0.7 ? '#30D158' : '#FF453A'};">${(typeof s === 'number' ? s * 100 : 0).toFixed(1)}%</td></tr>`
          ).join('')}
        </table>

        <h3 style="margin: 20px 0 10px; font-size: 15px;">Domande da Ripassare</h3>
        <ul style="padding-left: 20px; margin: 0 0 20px;">
          ${wrongAnswers.map(w =>
            `<li style="margin-bottom: 8px;"><strong>${w.question}</strong><br><span style="color: #FF453A;">Tua risposta: "${w.studentAnswer}"</span> — <span style="color: #30D158;">Corretta: "${w.correctAnswer}"</span></li>`
          ).join('')}
        </ul>

        <div style="background: #FFF3CD; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">Non preoccuparti! Puoi ripetere l'esame <strong>gratuitamente</strong>. Contattaci per fissare il prossimo tentativo.</p>
        </div>

        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">Sake Sommelier Association<br>corsi@sakesommelierassociation.it</p>
      </div>
    </div>
  `;
}

function buildRetakeHTML(data) {
  const { student, score, categoryScores, weakAreas } = data;

  return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #635BFF; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🍶 Sake Sommelier Association</h1>
      </div>
      <div style="padding: 30px; background: white; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 16px;">Risultati Esame, ${student.nome}</h2>
        <p style="font-size: 16px; margin: 0 0 20px;">Hai superato con riserva. Punteggio: <strong>${(score * 100).toFixed(1)}%</strong></p>

        <h3 style="margin: 20px 0 10px; font-size: 15px;">Risultati per Categoria</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${Object.entries(categoryScores).map(([cat, s]) =>
            `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${cat}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: ${(typeof s === 'number' ? s : 0) >= 0.7 ? '#30D158' : '#FF453A'};">${(typeof s === 'number' ? s * 100 : 0).toFixed(1)}%</td></tr>`
          ).join('')}
        </table>

        <div style="background: #FFF3CD; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px; color: #B36D00; font-size: 15px;">Aree da Rafforzare</h3>
          <p style="margin: 0 0 12px; font-size: 14px;">Concentrati su questi argomenti per la certificazione completa:</p>
          <ul style="padding-left: 20px; margin: 0;">
            ${weakAreas.map(area => `<li style="margin-bottom: 4px;">${area}</li>`).join('')}
          </ul>
        </div>

        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">Sake Sommelier Association<br>corsi@sakesommelierassociation.it</p>
      </div>
    </div>
  `;
}

module.exports = {
  sendEsitoEmail,
  buildEsitoPositivoHTML,
  buildEsitoNegativoHTML,
  buildRetakeHTML
};
