const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' });
const EvmService = require('../src/services/EvmService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testLightPrompt() {
  console.log('=== Light Prompt Test ===\n');
  
  const evmData = await EvmService.getProjectEvmData(9);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Minimal prompt to check the model handles our data under current load
  const prompt = `Given these project metrics, respond with a single JSON object (no markdown):
{
  "project_status": "On Schedule | Delayed | Ahead",
  "executive_summary": "2 sentence summary",
  "risk_level": "Low | Medium | High"
}

Metrics:
- Planned Duration: ${evmData.timeline_metrics.planned_duration_days} days
- Elapsed: ${evmData.timeline_metrics.elapsed_project_time_days} days
- Execution Phase Completion: 88%
- Procurement Phase Completion: 100%
- Budget (BAC): PHP ${evmData.financial_metrics.budget_at_completion.toLocaleString()}`;

  console.log('Sending lightweight prompt to Gemini 2.5 Flash...');
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    console.log('\n✅ SUCCESS! AI Response:');
    console.log(JSON.parse(clean));
  } catch (err) {
    const code = err.message?.includes('503') ? '503 BUSY' : err.message?.includes('429') ? '429 QUOTA' : 'OTHER';
    console.log(`❌ Failed with code: ${code}`);
    console.log(err.message?.slice(0, 200));
  }
}

testLightPrompt();
