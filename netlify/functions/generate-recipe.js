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
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3000
      }
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        // Utilisation de la version v1beta (plus flexible pour Flash)
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
      // Si Gemini 1.5 Flash échoue, on tente une alternative automatique ou on affiche l'erreur
      throw new Error(parsedData.error?.message || 'Erreur API');
    }

    const recipeText = parsedData.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ recipe: recipeText })
    };
  } catch (error) {
    console.error('Erreur détaillée:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur technique', details: error.message })
    };
  }
};
