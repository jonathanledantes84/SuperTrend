// lib/ai.js - Lite Gemini AI proxy for popup (no full React dep)
// Uses @google/generative-ai if avail, else simple fetch to API
// Key from storage.gemini_api_key (opt-in)

async function chat(prompt, context = 'Asistente SuperTrend: analiza trading, SuperTrend, Bybit.') {
  const key = await storage.get('gemini_api_key');
  if (!key) throw new Error('Gemini API key needed in Settings');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: context + '\n\n' + prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    });
    const data = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    throw new Error('AI response invalid');
  } catch (e) {
    throw new Error('AI error: ' + e.message);
  }
}

export { chat };

