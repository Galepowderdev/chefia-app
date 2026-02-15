const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const data = JSON.parse(event.body);
    const { prompt } = data;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) throw new Error('Clé API manquante dans Netlify');

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2500 }
    });

    // On utilise "gemini-pro" qui est le nom le plus stable et compatible v1
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1/models/gemini-pro:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      const req = https.request(options, (res) => {
        let str = '';
        res.on('data', (chunk) => str += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data: str }));
      });
      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });

    const parsedData = JSON.parse(response.data);

    if (response.statusCode !== 200) {
      throw new Error(parsedData.error?.message || 'Erreur API Google');
    }

    const recipeText = parsedData.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ recipe: recipeText })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur', details: error.message })
    };
  }
};
