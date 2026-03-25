const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

async function callClaude(messages, systemPrompt) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY not set');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    console.error('Claude API error:', err);
    throw err;
  }
}

async function gradeOpenAnswer(question, studentAnswer, correctAnswer, knowledgeBase) {
  const systemPrompt = `You are a sake sommelier exam grader. Grade answers strictly but fairly.
You have this knowledge base context: ${knowledgeBase || 'General sake knowledge'}`;

  const messages = [{
    role: 'user',
    content: `Question: ${question}\nStudent answer: ${studentAnswer}\nCorrect answer: ${correctAnswer}\n\nGrade this answer. Respond in JSON: {"score": 0-1, "feedback": "...", "isCorrect": true/false}`
  }];

  const result = await callClaude(messages, systemPrompt);
  return JSON.parse(result);
}

async function analyzeComprehension(studentAnswers, categories) {
  const systemPrompt = `You are a sake education expert. Analyze student comprehension across categories.
Categories: ${categories.join(', ')}
Assess depth of understanding, not just correct/incorrect answers.`;

  const messages = [{
    role: 'user',
    content: `Student answers by category:\n${JSON.stringify(studentAnswers, null, 2)}\n\nProvide JSON: {"comprehensionLevel": "advanced|intermediate|basic", "perCategory": {...}, "analysis": "..."}`
  }];

  const result = await callClaude(messages, systemPrompt);
  return JSON.parse(result);
}

async function generateEmailContent(esito, studentData, wrongAnswers, language = 'IT') {
  const langMap = { IT: 'Italian', EN: 'English', JP: '日本語' };
  const systemPrompt = `You are a professional exam results communicator for sake sommelier certification.
Generate warm, encouraging email content in ${langMap[language] || 'Italian'}.`;

  const messages = [{
    role: 'user',
    content: `Generate email for: ${JSON.stringify({
      esito,
      student: studentData,
      wrongAnswers,
      language
    })}\n\nRespond with plain HTML body (no wrapper tags).`
  }];

  return await callClaude(messages, systemPrompt);
}

module.exports = {
  gradeOpenAnswer,
  analyzeComprehension,
  generateEmailContent
};
