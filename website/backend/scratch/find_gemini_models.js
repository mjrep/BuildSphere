const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  // The JS SDK doesn't expose listModels directly, so let's try several common identifiers
  const candidates = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-preview-04-17',
    'gemini-2.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-lite',
  ];

  for (const name of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent('Say the word OK only.');
      const text = result.response.text().trim();
      console.log(`✅ ${name}: "${text}"`);
    } catch (err) {
      const code = err.message?.includes('429') ? '429 QUOTA'
                 : err.message?.includes('503') ? '503 BUSY'
                 : err.message?.includes('404') ? '404 NOT FOUND'
                 : 'ERROR';
      console.log(`❌ ${name}: ${code}`);
    }
  }
}

listModels();
