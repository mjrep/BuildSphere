import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const debuggerHost = Constants.expoConfig?.hostUri;
const machineIp = debuggerHost?.split(':').shift() || '172.20.10.2';

const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('503') || error.message?.includes('429'))) {
      await new Promise((res) => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const countGlassPanels = async (base64Image: string, mimeType: string) => {
  console.log('DEBUG: High-Precision Coordinate Detection Mode Engaged');
  try {
    return await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Using Bounding Box Detection Prompt for maximum accuracy
      const prompt = `
                You are a high-precision object detection system for BuildSphere construction audits.
                
                OBJECTIVE: Detect every INDIVIDUAL glass panel in the image.
                
                DETECTION RULES:
                1. Look for the physical frame of each glass pane.
                2. For mullioned/grid windows, count the large functional sections, NOT the decorative tiny internal squares.
                3. Return the bounding box for EACH panel in [ymin, xmin, ymax, xmax] format.
                
                Return ONLY JSON:
                {
                    "panels": [
                        {"label": "glass_panel", "box_2d": [ymin, xmin, ymax, xmax]},
                        ...
                    ],
                    "count": <total number of detected boxes>,
                    "explanation": "Summarize how you separated panels from reflections."
                }
            `;

      // Strip data URI prefix if present
      const cleanBase64 = base64Image.includes('base64,') 
        ? base64Image.split('base64,')[1] 
        : base64Image;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: cleanBase64, mimeType: mimeType } },
      ]);

      const response = await result.response;
      let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(text);
      
      // Ensure count is actually based on the length of panels array if not provided correctly
      if (parsed.panels && !parsed.count) {
        parsed.count = parsed.panels.length;
      }
      
      return parsed;
    });
  } catch (error: any) {
    console.error('DETECTION_ERROR:', error);
    if (error.message?.includes('429')) {
      throw new Error('QUOTA_LIMIT: Please wait 30 seconds.');
    }
    throw new Error(`AI_UNAVAILABLE: ${error.message}`);
  }
};

export const hybridGlassAudit = async (base64Image: string, mimeType: string, photoUri?: string) => {
  console.log('DEBUG: Hybrid AI Audit Commencing (Local YOLO + Gemini)');
  
  // Dynamic API URL based on host machine IP
  const API_URL = `http://${machineIp}:8000/detect-panels`;
  console.log(`DEBUG: Calling Local CV Service at ${API_URL}...`);

  try {
    let count = 0;
    let summary = '';
    let annotatedImage = null;
    let rawDetections = null;

    if (!photoUri) {
        throw new Error('Photo URI is required for local CV Service.');
    }

    const formData = new FormData();
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    
    formData.append('file', {
      uri: photoUri,
      name: filename,
      type: mimeType,
    } as any);

    // Fetch with a manual timeout to give better feedback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const cvResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!cvResponse.ok) {
        const errText = await cvResponse.text();
        console.error('CV_API_ERROR:', cvResponse.status, errText);
        throw new Error(`CV Service Error (${cvResponse.status}): ${errText.substring(0, 100)}`);
    }

    const cvData = await cvResponse.json();
    count = cvData.total_valid_panels || 0;
    summary = cvData.summary_text || `Site Audit Complete. CV API detected ${count} valid panels.`;
    annotatedImage = cvData.annotated_image_base64;
    rawDetections = cvData.detections;
    
    console.log(`DEBUG: CV Service returned ${count} panels and summary.`);

    return {
      count,
      summary,
      annotatedImage,
      rawDetections
    };

  } catch (error: any) {
    if (error.name === 'AbortError') {
        console.warn('⚠️ CV Service Timed Out. Entering Gemini Fallback Mode...');
    } else {
        console.error('❌ HYBRID_AUDIT_CONNECTION_ERROR:', error.message);
    }
    
    // FALLBACK: If local CV service is down or times out, use Gemini directly
    console.log('🚀 [FALLBACK] Starting direct Gemini 2.5 Vision analysis...');
    try {
        const result = await countGlassPanels(base64Image, mimeType);
        console.log('✅ [FALLBACK] Gemini analysis successful:', result.count, 'panels found.');
        
        return {
            count: result.count || 0,
            summary: `(Cloud AI Fallback) ${result.explanation || ''}`,
            annotatedImage: null,
            rawDetections: result.panels
        };
    } catch (fallbackError: any) {
        console.error('❌ [FALLBACK_FAILED]:', fallbackError.message);
        
        const finalError = error.name === 'AbortError' 
            ? `CV Service timed out at ${API_URL} AND Gemini fallback also failed: ${fallbackError.message}`
            : `Hybrid Audit Failed: ${error.message}. Fallback also failed: ${fallbackError.message}`;
            
        throw new Error(finalError);
    }
  }
};



export const getBuildsphereAI = async (p: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(p);
  return result.response.text();
};

export const analyzeBuildsphereImage = async (p: string, b: string, m: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([p, { inlineData: { data: b, mimeType: m } }]);
  return result.response.text();
};

export default genAI;

