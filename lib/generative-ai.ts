import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

console.log('DEBUG: Checking Gemini API Key...');
if (!API_KEY) {
  console.error(
    'CRITICAL ERROR: Gemini API Key is missing! Expo did not load it from the .env file.'
  );
} else {
  console.log(`DEBUG: Gemini API Key found (starts with: ${API_KEY.substring(0, 6)}...)`);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Helper to retry AI calls if they fail due to 503 (High Demand)
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (
      retries > 0 &&
      (error.message?.includes('503') || error.message?.includes('Service Unavailable'))
    ) {
      console.log(`DEBUG: AI Busy (503). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((res) => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const getBuildsphereAI = async (prompt: string) => {
  try {
    console.log('DEBUG: getBuildsphereAI using model: gemini-2.5-flash');
    return await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    });
  } catch (error) {
    console.error('Gemini Error:', error);
    throw error;
  }
};

export const analyzeBuildsphereImage = async (
  prompt: string,
  base64Image: string,
  mimeType: string
) => {
  console.log(`DEBUG: generative-ai.ts -> analyzeImage called with mimeType: ${mimeType}`);
  try {
    const modelName = 'gemini-2.5-flash';
    console.log(`DEBUG: analyzeBuildsphereImage explicitly using modelName variable: ${modelName}`);

    return await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log('DEBUG: Sending request to Google Gemini API...');
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]);

      console.log('DEBUG: Waiting for response...');
      const response = await result.response;
      const text = response.text();
      console.log('DEBUG: Response received successfully.');
      return text;
    });
  } catch (error: any) {
    console.error('DEBUG: Internal Gemini Error:', error);
    if (error.message?.includes('404')) {
      console.log(
        'DEBUG: 404 detected. This API key might not have access to gemini-2.5-flash yet.'
      );
    }
    throw error;
  }
};

export const countGlassPanels = async (base64Image: string, mimeType: string) => {
  console.log('DEBUG: countGlassPanels called');
  try {
    const modelName = 'gemini-2.5-flash';

    return await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `
                You are a specialized construction site analyzer. 
                Count every single glass panel, window, or glass sheet visible in this photo.
                
                Return ONLY a valid JSON object with this exact structure:
                {
                    "count": number,
                    "explanation": "brief sentence explaining what was counted",
                    "confidence": "high|medium|low"
                }
                Do not include any other text or markdown formatting.
            `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      console.log('DEBUG: AI raw response:', text);

      const cleanedText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanedText);
    });
  } catch (error) {
    console.error('DEBUG: countGlassPanels error:', error);
    throw error;
  }
};

export default genAI;
