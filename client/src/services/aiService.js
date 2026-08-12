import api from './api.js';

// All AI calls go through Node.js /api/ai which proxies to Python or returns mocks
const post = async (endpoint, body) => {
  const { data } = await api.post(`/ai${endpoint}`, body);
  return data;
};

export const aiService = {
  ocr:          (image_base64)                  => post('/ocr',           { image_base64 }),
  diagram:      (image_base64)                  => post('/diagram',       { image_base64 }),
  equation:     (equation)                      => post('/equation',      { equation }),
  mindmap:      (summary)                       => post('/mindmap',       { summary }),
  summarize:    (text)                          => post('/summarize',     { text }),
  translate:    (text, target_language = 'hi') => post('/translate',     { text, target_language }),
  quiz:         (content, numQuestions = 5)     => post('/quiz',          { content, numQuestions }),
  gesture:      (image_base64)                  => post('/gesture',       { image_base64 }),
  faceRecognize:(image_base64)                  => post('/face/recognize',{ image_base64 }),
  faceRegister: (name, student_id, images)      => post('/face/register', { name, student_id, images }),
  tts:          (text, language = 'en')         => post('/tts',           { text, language }),
  health:       ()                              => api.get('/ai/health').then(r => r.data),
};
