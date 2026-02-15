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
    const { prompt } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) throw new Error('Clé API non configurée dans Netlify');

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      const req = https.request(options, (res) => {
        let str = '';
        res.on('data', (chunk) => str += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(str);
            // On extrait le texte proprement
            const recipeText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            
            if (!recipeText) {
              resolve({
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "L'IA a renvoyé une réponse vide", details: data })
              });
            } else {
              resolve({
                statusCode: 200,
                headers,
                body: JSON.stringify({ recipe: recipeText })
              });
            }
          } catch (e) {
            resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "Erreur de lecture de l'IA" }) });
          }
        });
      });

      req.on('error', (e) => resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }));
      req.write(requestBody);
      req.end();
    });

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
