const https = require('https');

const API_KEY = 'AIzaSyBo-gdnRzFAC6TrP_zPJFtxpyznbQ8m6wk';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        console.log('Available models:');
        parsed.models.forEach(m => console.log(`- ${m.name}`));
      } else {
        console.log('No models found:', JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.log('Error parsing response:', e.message);
      console.log('Raw data:', data);
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
