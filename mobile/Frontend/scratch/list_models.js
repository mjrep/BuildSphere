const fetch = require('node-fetch');

const API_KEY = 'AIzaSyBo-gdnRzFAC6TrP_zPJFtxpyznbQ8m6wk';

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
      console.log('Available models:');
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log('No models found:', data);
    }
  } catch (err) {
    console.log('Error listing models:', err.message);
  }
}

listModels();
