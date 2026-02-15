const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { prompt } = data;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API Key Google Gemini non configurée');
    }

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        // CORRECTION : Utilisation du modèle gemini-1.5-flash (stable)
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (res.statusCode !== 200) {
              reject(new Error(parsed.error?.message || `Erreur API ${res.statusCode}`));
              return;
            }
            resolve(parsed);
          } catch (e) { reject(new Error('Erreur de parsing JSON')); }
        });
      });

      req.on('error', (error) => { reject(error); });
      req.write(requestBody);
      req.end();
    });

    // Extraction du texte de la recette
    if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ recipe: response.candidates[0].content.parts[0].text })
      };
    } else {
      throw new Error('Structure de réponse vide ou invalide');
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur génération', details: error.message })
    };
  }
};
