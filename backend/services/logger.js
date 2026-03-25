const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

function getLogFilePath() {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `${date}.log`);
}

function formatLog(level, message, data) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] ${level}: ${message}${dataStr}\n`;
}

function writeLog(level, message, data) {
  try {
    const logPath = getLogFilePath();
    const logEntry = formatLog(level, message, data);
    fs.appendFileSync(logPath, logEntry);
    if (level === 'ERROR') console.error(logEntry);
  } catch (err) {
    console.error('Logger error:', err);
  }
}

module.exports = {
  info: (message, data) => writeLog('INFO', message, data),
  error: (message, data) => writeLog('ERROR', message, data),
  warn: (message, data) => writeLog('WARN', message, data),
  debug: (message, data) => writeLog('DEBUG', message, data)
};
