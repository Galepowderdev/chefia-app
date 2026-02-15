const https = require('https');

exports.handler = async (event, context) => {
  // LOG DE TEST - Doit apparaître dans Netlify
  console.log("--- FONCTION DÉMARRÉE ---");

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const data = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("ERREUR: Clé API manquante");
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Clé API non configurée" }) };
    }

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: data.prompt }] }]
    });

    return new Promise((resolve) => {
      // Utilisation du modèle gemini-1.5-flash (le plus compatible actuellement)
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          console.log("Réponse API reçue, status:", res.statusCode);
          resolve({
            statusCode: res.statusCode,
            headers,
            body: responseData
          });
        });
      });

      req.on('error', (e) => {
        console.error("Erreur Requête:", e.message);
        resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
      });

      req.write(requestBody);
      req.end();
    });

  } catch (error) {
    console.error("Erreur Try/Catch:", error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
