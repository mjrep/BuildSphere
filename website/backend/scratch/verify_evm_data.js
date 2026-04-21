const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });
const EvmService = require('../src/services/EvmService');

// Quick wrapper to test independent of Express
async function testEvm() {
  console.log('Testing EVM Payload Generation...');
  
  // Pick an ongoing project ID (e.g. PRJ-2026-0004 -> id 9 based on earlier logs)
  const projectId = 9; 

  try {
    const payload = await EvmService.getProjectEvmData(projectId);
    console.log('\n--- EVM Payload Output ---');
    console.log(JSON.stringify(payload, null, 2));
    console.log('--------------------------');
    console.log('\nStrict format check:');
    console.log(`Payload keys:`, Object.keys(payload));
    console.log(`Timeline keys:`, Object.keys(payload.timeline_metrics));
    console.log(`Financial keys:`, Object.keys(payload.financial_metrics));
    console.log(`Phase keys:`, Object.keys(payload.phases[0]));
    
  } catch (err) {
    console.error('Error during EVM test:', err);
  }
}

testEvm();
