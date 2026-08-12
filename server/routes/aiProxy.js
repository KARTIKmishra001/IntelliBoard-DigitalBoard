const express = require('express');
const http = require('http');
const https = require('https');
const { create, all } = require('mathjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const math = create(all);
const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

// ── Gemini Setup ─────────────────────────────────────────────────────────────
let genAI = null;
let geminiModel = null;
let geminiVision = null;

const initGemini = () => {
  if (!process.env.GEMINI_API_KEY) return;
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel  = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    geminiVision = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Gemini AI ready');
  } catch (e) {
    console.warn('⚠️  Gemini init failed:', e.message);
  }
};
initGemini();

// ── Groq Setup ───────────────────────────────────────────────────────────────
let groqClient = null;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const initGroq = () => {
  if (!process.env.GROQ_API_KEY) return;
  try {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq AI ready');
  } catch (e) {
    console.warn('⚠️  Groq init failed:', e.message);
  }
};
initGroq();

const groqChat = async (prompt) => {
  if (!groqClient) throw new Error('Groq not configured');
  const res = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 1024,
  });
  return res.choices[0]?.message?.content?.trim() || '';
};

// Strip data URL prefix and return raw base64
const stripDataURL = (b64) => b64.replace(/^data:image\/\w+;base64,/, '');

// ── Gemini helpers ────────────────────────────────────────────────────────────

async function geminiOCR(imageBase64) {
  if (!geminiVision) throw new Error('Gemini not configured');
  const raw = stripDataURL(imageBase64);
  const result = await geminiVision.generateContent([
    { inlineData: { mimeType: 'image/png', data: raw } },
    'Extract ALL visible text from this whiteboard image. List each line of text exactly as written, preserving line breaks. If no text is found, respond with "No text detected on whiteboard."'
  ]);
  return result.response.text().trim();
}

async function geminiTranslate(text, targetLang) {
  // Use Groq for translation (faster, more reliable)
  const LANG = { hi:'Hindi', fr:'French', es:'Spanish', de:'German', zh:'Chinese (Simplified)', ar:'Arabic', ja:'Japanese', pt:'Portuguese', ru:'Russian' };
  const langName = LANG[targetLang] || targetLang;
  return groqChat(`Translate the following text to ${langName}. Return ONLY the translated text, nothing else, no explanations:\n\n${text}`);
}

async function geminiMindmap(topic) {
  if (!geminiModel) throw new Error('Gemini not configured');
  const result = await geminiModel.generateContent(
    `Create a comprehensive mind map for the topic: "${topic}".
Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):
{
  "center": "${topic}",
  "branches": [
    {"label": "Branch Name", "color": "#60A5FA", "children": ["subtopic 1", "subtopic 2", "subtopic 3"]},
    {"label": "Branch Name", "color": "#34D399", "children": ["subtopic 1", "subtopic 2"]},
    {"label": "Branch Name", "color": "#F472B6", "children": ["subtopic 1", "subtopic 2", "subtopic 3"]},
    {"label": "Branch Name", "color": "#FBBF24", "children": ["subtopic 1", "subtopic 2"]},
    {"label": "Branch Name", "color": "#A78BFA", "children": ["subtopic 1", "subtopic 2", "subtopic 3"]}
  ]
}
Ensure 5-6 branches with 2-4 relevant children each. Children should be SHORT (2-4 words max).`
  );
  let text = result.response.text().trim();
  // Strip markdown code blocks if present
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
}

async function geminiSummarize(text) {
  // Use Groq for summarization (faster, more reliable)
  return groqChat(`Summarize the following text clearly with bullet points. Be concise and highlight key points:\n\n${text}`);
}

async function geminiEquation(equation) {
  if (!geminiModel) throw new Error('Gemini not configured');
  const result = await geminiModel.generateContent(
    `Solve this math equation step by step: ${equation}
Format the response as:
Equation: [equation]
Steps:
1. [step]
2. [step]
...
Solution: [final answer]`
  );
  return result.response.text().trim();
}

// ── Local equation solver (mathjs fallback) ───────────────────────────────────
function solveLocal(eqStr) {
  try {
    const eq = eqStr.trim().replace(/\^/g, '**');
    let expr = eq.includes('=') ? `(${eq.split('=')[0]}) - (${eq.split('=')[1]})` : eq;
    const compiled = math.compile(expr);
    const vars = [...new Set(expr.replace(/[^a-zA-Z]/g, '').split('').filter(c => !['e','E','i'].includes(c)))];
    if (vars.length === 0) {
      const val = math.evaluate(eq.includes('=') ? expr : eq);
      return `Result: ${math.format(val, { precision: 6 })}`;
    }
    const v = vars[0];
    const sols = [];
    let prev = null;
    const scope = {};
    for (let x = -100; x <= 100; x += 0.05) {
      scope[v] = x;
      try {
        const val = compiled.evaluate(scope);
        if (prev !== null && prev.sign !== Math.sign(val) && isFinite(val)) {
          let lo = x - 0.05, hi = x;
          for (let i = 0; i < 50; i++) {
            const m = (lo + hi) / 2; scope[v] = m;
            Math.sign(compiled.evaluate(scope)) === prev.sign ? lo = m : hi = m;
          }
          const root = +((lo + hi) / 2).toFixed(4);
          if (!sols.some(s => Math.abs(s - root) < 0.001)) sols.push(root);
        }
        prev = { sign: Math.sign(val) };
      } catch { prev = null; }
    }
    if (!sols.length) return `No real solutions found for: ${eqStr}`;
    return `Equation: ${eqStr}\n\nSolution(s):\n${sols.map(s => `  ${v} = ${s}`).join('\n')}`;
  } catch (e) {
    return `Error solving "${eqStr}": ${e.message}`;
  }
}

// ── Mindmap text fallback ─────────────────────────────────────────────────────
function mindmapLocal(topic) {
  return {
    center: topic,
    branches: [
      { label: 'Definition',    color: '#60A5FA', children: ['Core meaning', 'Etymology', 'Key terms'] },
      { label: 'Key Concepts',  color: '#34D399', children: ['Main principles', 'Theories', 'Models'] },
      { label: 'Applications',  color: '#F472B6', children: ['Real-world use', 'Industry cases', 'Examples'] },
      { label: 'Advantages',    color: '#FBBF24', children: ['Benefits', 'Why important', 'Impact'] },
      { label: 'Challenges',    color: '#A78BFA', children: ['Limitations', 'Open problems', 'Risks'] },
    ],
  };
}

// ── Forward to Python ─────────────────────────────────────────────────────────
const forwardToPython = (endpoint, body) => new Promise((resolve, reject) => {
  const payload = JSON.stringify(body);
  const url = new URL(`${PYTHON_URL}/ai${endpoint}`);
  const lib = url.protocol === 'https:' ? https : http;
  const req = lib.request({
    hostname: url.hostname, port: url.port || 80, path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try { res.statusCode < 300 ? resolve(JSON.parse(data)) : reject(new Error(`Python ${res.statusCode}`)); }
      catch { reject(new Error('Bad JSON')); }
    });
  });
  req.on('error', reject);
  req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
  req.write(payload); req.end();
});

// ── Route handlers ────────────────────────────────────────────────────────────

// OCR — Gemini Vision reads whiteboard text
router.post('/ocr', verifyToken, async (req, res) => {
  try {
    const text = await geminiOCR(req.body.image_base64 || '');
    return res.json({ text, confidence: 95, source: 'gemini' });
  } catch {
    try {
      const r = await forwardToPython('/ocr', req.body);
      return res.json(r);
    } catch {
      return res.json({ text: 'OCR unavailable. Gemini API key may be invalid or canvas was empty.', confidence: 0 });
    }
  }
});

// Translate — Groq
router.post('/translate', verifyToken, async (req, res) => {
  const { text, target_language } = req.body;
  if (!text || !text.trim()) return res.json({ translated_text: 'Please enter text to translate.', language: target_language });
  try {
    const translated = await geminiTranslate(text.trim(), target_language || 'hi');
    return res.json({ translated_text: translated, original: text, language: target_language, source: 'groq' });
  } catch (err) {
    try { return res.json(await forwardToPython('/translate', req.body)); } catch {}
    return res.json({ translated_text: `Translation failed: ${err.message}\n\nOriginal: ${text}`, language: target_language });
  }
});

// Mindmap — Gemini generates structured data, client draws it on canvas
router.post('/mindmap', verifyToken, async (req, res) => {
  const topic = req.body.summary || req.body.topic || 'Unknown Topic';
  try {
    const data = await geminiMindmap(topic);
    return res.json({ ...data, source: 'gemini' });
  } catch {
    try { return res.json(await forwardToPython('/mindmap', req.body)); } catch {}
    return res.json(mindmapLocal(topic));
  }
});

// Summarize — Groq
router.post('/summarize', verifyToken, async (req, res) => {
  const text = req.body.text || '';
  if (!text.trim()) return res.json({ summary: 'Please enter some text to summarize.' });
  try {
    const summary = await geminiSummarize(text);
    return res.json({ summary, source: 'groq' });
  } catch (err) {
    try { return res.json(await forwardToPython('/summarize', req.body)); } catch {}
    return res.json({ summary: `Summarization failed: ${err.message}` });
  }
});

// Equation — Gemini first, mathjs fallback
router.post('/equation', verifyToken, async (req, res) => {
  const eq = req.body.equation || 'x^2 - 4 = 0';
  try {
    const sol = await geminiEquation(eq);
    return res.json({ solution: sol, source: 'gemini' });
  } catch {
    try { return res.json(await forwardToPython('/equation', req.body)); } catch {}
    return res.json({ solution: solveLocal(eq), source: 'mathjs' });
  }
});

// Quiz — Gemini
router.post('/quiz', verifyToken, async (req, res) => {
  const { content, numQuestions = 5 } = req.body;
  try {
    const r = await geminiModel.generateContent(
      `Generate ${numQuestions} multiple choice questions about: "${content}".
Return ONLY valid JSON (no markdown):
{"questions":[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}]}`
    );
    let text = r.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    return res.json(JSON.parse(text));
  } catch {
    try { return res.json(await forwardToPython('/quiz', req.body)); } catch {}
    return res.json({ questions: [
      { question: `What is a key concept in "${content}"?`, options: ['A) Fundamentals','B) Applications','C) History','D) Theory'], correct: 'A', explanation: 'Fundamentals form the base.' }
    ]});
  }
});

// Face recognition — Python only
router.post('/face/recognize', verifyToken, async (req, res) => {
  try { return res.json(await forwardToPython('/face/recognize', req.body)); }
  catch { return res.json({ present: false, faces_detected: 0, message: 'Python AI service offline.' }); }
});
router.post('/face/register', verifyToken, async (req, res) => {
  try { return res.json(await forwardToPython('/face/register', req.body)); }
  catch { return res.json({ success: false, message: 'Python AI service offline.' }); }
});
router.post('/gesture', verifyToken, async (req, res) => {
  try { return res.json(await forwardToPython('/gesture', req.body)); }
  catch { return res.json({ gesture_type: 'NONE', landmarks: [] }); }
});
router.post('/tts', verifyToken, async (req, res) => {
  try { return res.json(await forwardToPython('/tts', req.body)); }
  catch { return res.json({ audio_base64: '', error: 'TTS requires Python AI service.' }); }
});

router.get('/health', async (_req, res) => {
  const geminiOk = !!geminiModel;
  const groqOk   = !!groqClient;
  let pythonOk = false;
  try { await forwardToPython('/health', {}); pythonOk = true; } catch {}
  res.json({ ok: true, gemini: geminiOk, groq: groqOk, python: pythonOk, equation: 'mathjs' });
});

module.exports = router;
