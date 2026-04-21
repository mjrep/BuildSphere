const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' });
const EvmService = require('../src/services/EvmService');
const AiAssessmentService = require('../src/services/AiAssessmentService');

async function testAiAssessment() {
  console.log('=== AI Assessment Test ===\n');
  
  const projectId = 9; // PRJ-2026-0004
  
  console.log('Step 1: Fetching EVM data bundle...');
  const evmData = await EvmService.getProjectEvmData(projectId);
  console.log(`  Project: ${evmData.project_code} / ${evmData.project_name}`);
  console.log(`  Duration: ${evmData.timeline_metrics.planned_duration_days} days planned, ${evmData.timeline_metrics.elapsed_project_time_days} elapsed`);
  console.log(`  BAC: PHP ${evmData.financial_metrics.budget_at_completion.toLocaleString()}`);
  
  console.log('\nStep 2: Sending to Gemini for analysis...');
  const analysis = await AiAssessmentService.generateEvmReport(evmData);
  
  console.log('\n=== AI Response ===');
  console.log(JSON.stringify(analysis, null, 2));
  
  console.log('\n=== Key Takeaways ===');
  console.log(`Status: ${analysis.project_status}`);
  console.log(`SPI:    ${analysis.schedule_performance_index}`);
  console.log(`Risk:   ${analysis.risk_level}`);
  console.log(`\nExecutive Summary:\n  ${analysis.executive_summary}`);
}

testAiAssessment().catch(console.error);
