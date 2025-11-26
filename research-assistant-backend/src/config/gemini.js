import { GoogleGenerativeAI } from '@google/generative-ai';
import config from './index.js';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Get the Gemini 2.5 Pro model
// This model has a large context window (1M+ tokens) - perfect for long PDFs
export const geminiModel = genAI.getGenerativeModel({ 
  model: config.gemini.model,
  generationConfig: {
    temperature: 0.3,      // Lower = more focused, less creative
    topP: 0.8,             // Nucleus sampling
    topK: 40,              // Limit vocabulary choices
    maxOutputTokens: 8192, // Max response length
  },
});

// Export for direct access if needed
export { genAI };
export default geminiModel;