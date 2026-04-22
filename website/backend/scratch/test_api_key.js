const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' });

async function testApiKey() {
  console.log('Testing API key with gemini-1.5-flash...');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  try {
    const result = await model.generateContent("Hello, are you working?");
    console.log('Response:', result.response.text());
    console.log('✅ API key is working correctly.');
  } catch (error) {
    console.error('❌ API key test failed:', error.message);
  }
}

testApiKey();
