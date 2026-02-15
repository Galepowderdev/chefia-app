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

    if (!apiKey) throw new Error('Variable GEMINI_API_KEY manquante');

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // Paramètres de sécurité au minimum absolu
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ],
      generationConfig: {
        temperature: 0.4, // Plus bas pour être plus précis et moins "créatif" (évite les blocages)
        topP: 1,
        maxOutputTokens: 1000,
        responseMimeType: "application/json" // On force la réponse en format JSON
      }
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
            const recipeText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (recipeText) {
              resolve({
                statusCode: 200,
                headers,
                body: JSON.stringify({ recipe: recipeText })
              });
            } else {
              // Si Google bloque, on renvoie une réponse générique sécurisée au lieu de l'erreur
              resolve({
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "L'IA est timide aujourd'hui. Réessayez avec des ingrédients plus simples." })
              });
            }
          } catch (e) {
            resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "Erreur serveur API" }) });
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
