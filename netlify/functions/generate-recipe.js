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
    
    if (!apiKey) throw new Error('API Key manquante');

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3500, // Augmenté pour éviter les recettes coupées
      }
    });

    const response = await new Promise((resolve, reject) => {
      // Utilisation du modèle stable 1.5-flash
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });

    const parsedData = JSON.parse(response.data);
    const recipeText = parsedData.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ recipe: recipeText })
    };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
