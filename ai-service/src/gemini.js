import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const ensureKey = () => {
  if (!process.env.GEMINI_API_KEY) throw Object.assign(new Error('GEMINI_API_KEY is not configured on the server'), { status: 503 });
};

export async function generateText(prompt) {
  ensureKey();
  const model = genAI.getGenerativeModel({ model: modelName });
  return (await model.generateContent(prompt)).response.text();
}

export async function generateJSON(prompt) {
  ensureKey();
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const text = (await model.generateContent(prompt)).response.text().replace(/^```json|```$/g, '').trim();
  return JSON.parse(text);
}
