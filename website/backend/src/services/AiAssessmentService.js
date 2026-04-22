const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const CACHE_DIR = path.join(__dirname, '../../cache');
const CACHE_FILE = path.join(CACHE_DIR, 'ai_reports.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Key rotation counter - Randomize on startup to distribute load across multiple projects/keys
let currentKeyIndex = Math.floor(Math.random() * 2); 

/**
 * Service for AI-powered EVM project assessment via Google Gemini.
 */
class AiAssessmentService {

  /**
   * Load cache from file system.
   */
  static _loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[AI Cache] Load failed:', err.message);
    }
    return {};
  }

  /**
   * Save cache to file system.
   */
  static _saveCache(data) {
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[AI Cache] Save failed:', err.message);
    }
  }

  /**
   * Support multiple API keys separated by commas for rotation.
   */
  static getApiKey(forceNext = false) {
    const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
    if (!keys.length) return null;
    
    if (forceNext) {
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    } else {
      // Ensure current index is within bounds if keys changed
      currentKeyIndex = currentKeyIndex % keys.length;
    }
    
    return keys[currentKeyIndex];
  }

  /**
   * Generate a unique hash for the project data to detect progress updates.
   */
  static generateProgressHash(evmData) {
    const progressData = {
      status: evmData.project_status,
      phases: (evmData.phases || []).map(p => ({
        id: p.phase_id,
        completion: p.phase_completion_percentage,
        milestones: (p.milestones || []).map(m => ({
          id: m.milestone_id,
          completion: m.completion_percentage
        }))
      }))
    };
    return crypto.createHash('md5').update(JSON.stringify(progressData)).digest('hex');
  }

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
   * Generate a WPM-EVM report using Gemini with exhaustive matrix fallback.
   */
  static async generateEvmReport(evmData) {
    const projectId = evmData.project_id;
    const currentHash = this.generateProgressHash(evmData);

    // 1. Check Persistent Cache
    const cache = this._loadCache();
    const cached = cache[projectId];
    if (cached && cached.hash === currentHash) {
      console.log(`[AI Cache] Hit for project ${projectId}`);
      return cached.data;
    }

    const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
    if (!keys.length) throw new Error('GEMINI_API_KEY is not configured in .env');

    // Matrix to explore - Based on user's AI Studio dashboard
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2-flash-lite', 'gemini-3-flash'];
    const errors = [];

    // Exhaustive search through Matrix[Model][Key]
    for (let mIdx = 0; mIdx < models.length; mIdx++) {
      const selectedModel = models[mIdx];
      
      for (let kIdx = 0; kIdx < keys.length; kIdx++) {
        // Start from current global index and rotate
        const actualKeyIdx = (currentKeyIndex + kIdx) % keys.length;
        const apiKey = keys[actualKeyIdx];
        
        try {
          console.log(`[AI Request] Trying Model #${mIdx + 1} (${selectedModel}) with Key #${actualKeyIdx + 1}...`);
          
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: selectedModel });
          const prompt = this.buildPrompt(evmData);
          
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();

          const cleanJson = responseText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim();

          const parsedData = JSON.parse(cleanJson);

          // SUCCESS: Update Persistent Cache
          cache[projectId] = {
            hash: currentHash,
            data: parsedData,
            timestamp: Date.now()
          };
          this._saveCache(cache);

          // Update global key index to keep load balanced for next time
          currentKeyIndex = (actualKeyIdx + 1) % keys.length;
          
          return parsedData;

        } catch (error) {
          const errorMsg = error.message || String(error);
          const statusCode = error.status || error.statusCode || (error.response ? error.response.status : null);
          
          const is429 = statusCode === 429 || errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota');
          const is404 = statusCode === 404 || errorMsg.includes('404') || errorMsg.toLowerCase().includes('not found');
          const is503 = statusCode === 503 || errorMsg.includes('503') || errorMsg.toLowerCase().includes('overloaded') || errorMsg.toLowerCase().includes('busy');

          const errorType = is429 ? 'RATE_LIMIT' : (is404 ? 'NOT_FOUND' : (is503 ? 'BUSY' : 'ERROR'));
          console.warn(`[AI Attempt Failed] Model: ${selectedModel}, Key: #${actualKeyIdx + 1}, Type: ${errorType}, Msg: ${errorMsg.slice(0, 50)}...`);
          
          errors.push({ model: selectedModel, keyIndex: actualKeyIdx + 1, type: errorType, message: errorMsg });

          // If it's a 404, this MODEL is bad. Break the inner loop and try the next model.
          if (is404) {
            console.log(`[AI Fallback] Model ${selectedModel} is not available. Skipping...`);
            break; 
          }

          // If it's a 429 (RPM), wait a bit and move to the NEXT KEY
          if (is429) {
            const isRpm = errorMsg.toLowerCase().includes('rpm') || !errorMsg.toLowerCase().includes('daily');
            const waitTime = isRpm ? 10000 : 1000; // 10s wait for RPM, 1s for daily/other
            console.log(`[AI Backoff] Waiting ${waitTime/1000}s for quota reset...`);
            await new Promise(r => setTimeout(r, waitTime));
            continue; // Next key
          }

          // For other errors (503/Busy), just move to next key immediately
          continue; 
        }
      }
    }

    // If we reached here, everything failed
    console.error(`[AI Exhausted] All models and keys failed.`);
    const summary = errors.map(e => `[Key ${e.keyIndex} ${e.model}]: ${e.type}`).join(' | ');
    throw new Error(`AI assessment failed after trying all options. Summary: ${summary}. Please check your API keys or wait a minute.`);
  }
}

module.exports = AiAssessmentService;
