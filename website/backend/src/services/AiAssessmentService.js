const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Service for AI-powered EVM project assessment via Google Gemini.
 */
class AiAssessmentService {

  static buildPrompt(evmData) {
    return `
You are an expert Construction Project Manager and AI Progress Assessor specializing in Earned Value Management (EVM).

Carefully analyze the following WPM-EVM data for a construction project:

\`\`\`json
${JSON.stringify(evmData, null, 2)}
\`\`\`

Using the WPM-EVM framework, please evaluate:
1. **Time Performance**: Compare elapsed_project_time_days against planned_duration_days. Calculate the Schedule Performance Index (SPI = actual_progress / planned_progress).
2. **Cost Performance**: Compare the budget_at_completion against the contract_price to determine financial risk.
3. **Milestone Health**: Review each phase and milestone's weight_percentage and completion_percentage. Identify if high-weight phases are lagging.
4. **Overall Status**: Determine one of: "Ahead of Schedule", "On Schedule", or "Delayed".

Provide your analysis as a strict JSON object (no markdown, no code fences, no extra text) using the following snake_case keys:
{
  "project_status": "Ahead of Schedule | On Schedule | Delayed",
  "schedule_performance_index": 0.00,
  "executive_summary": "A 2-3 sentence narrative for non-technical management...",
  "risk_level": "Low | Medium | High",
  "suggested_actions": ["Action 1", "Action 2", "Action 3"],
  "milestone_flags": [
    {
      "phase_name": "Phase Name",
      "milestone_name": "Milestone Name",
      "flag": "At Risk | Critical | On Track",
      "reason": "Brief reason..."
    }
  ]
}
`.trim();
  }

  /**
   * Generate a WPM-EVM report using Gemini.
   * @param {Object} evmData - The JSON bundle from EvmService.getProjectEvmData()
   */
  static async generateEvmReport(evmData, retries = 3) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = this.buildPrompt(evmData);
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Strip any accidental markdown code block wrappers
      const cleanJson = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

      return JSON.parse(cleanJson);
    } catch (error) {
      const is503 = error.message?.includes('503');
      if (is503 && retries > 0) {
        const waitMs = (4 - retries) * 3000; // 3s, 6s, 9s
        console.log(`Gemini busy (503). Retrying in ${waitMs / 1000}s... (${retries} retries left)`);
        await new Promise(r => setTimeout(r, waitMs));
        return this.generateEvmReport(evmData, retries - 1);
      }
      console.error('Gemini API Error:', error.message);
      throw new Error(`AI assessment failed: ${error.message}`);
    }
  }
}

module.exports = AiAssessmentService;
