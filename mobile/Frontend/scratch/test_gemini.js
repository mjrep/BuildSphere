const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyBo-gdnRzFAC6TrP_zPJFtxpyznbQ8m6wk';
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
  for (const modelName of models) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hi');
      console.log(`✅ ${modelName} works:`, result.response.text());
      return; // Stop at first working one
    } catch (err) {
      console.log(`❌ ${modelName} failed:`, err.message);
    }
  }
}

test();
