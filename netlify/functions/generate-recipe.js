const https = require('https');

exports.handler = async (event, context) => {
  // Autoriser CORS
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
    if (!apiKey) throw new Error('API Key Google Gemini non configurée');

    const requestBody = JSON.stringify({
      model: "gemini-1.5-flash",
      safetySettings: [
        { category: "HARM_CATEGORY_DEROGATORY", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_TOXICITY", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_VIOLENCE", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUAL", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_MEDICAL", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS", threshold: "BLOCK_NONE" },
      ],
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
      prompt: [
        {
          user: prompt
        }
      ]
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateMessage?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);

            if (res.statusCode !== 200) {
              reject(new Error(`API Gemini error (${res.statusCode}): ${parsed.error?.message || data.substring(0,200)}`));
              return;
            }

            resolve(parsed);
          } catch (e) {
            reject(new Error('Erreur parsing de la réponse: ' + e.message));
          }
        });
      });

      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });

    // Extraire le texte
    let recipeText = null;

    if (response.candidates && response.candidates[0]?.content?.length) {
      recipeText = response.candidates[0].content[0].text;
    } else if (response.candidates && response.candidates[0]?.text) {
      recipeText = response.candidates[0].text;
    } else if (response.text) {
      recipeText = response.text;
    }

    // Fail-safe : si réponse vide ou bloquée
    if (!recipeText) {
      console.warn('Aucune recette générée, utilisation de la recette de secours.');
      recipeText = `
NOM: Recette Mystère
DESCRIPTION: Une recette générée automatiquement par ChefIA.
CUISINE: Fusion
TEMPS: 30 minutes
PORTIONS: 4 personnes
DIFFICULTÉ: Intermédiaire
INGRÉDIENTS:
• 2 ingrédients génériques
ÉTAPES:
1. Mélanger les ingrédients.
2. Cuire à feu moyen.
NUTRITION:
Calories: 350 kcal
Protéines: 25g
Glucides: 30g
Lipides: 15g
CONSEIL: Prenez votre temps et amusez-vous en cuisinant !
`;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ recipe: recipeText })
    };

  } catch (error) {
    console.error('Erreur:', error);
    // Recette de secours en cas d'erreur
    const fallbackRecipe = {
      recipe: `
NOM: Recette Mystère
DESCRIPTION: Une recette générée automatiquement par ChefIA.
CUISINE: Fusion
TEMPS: 30 minutes
PORTIONS: 4 personnes
DIFFICULTÉ: Intermédiaire
INGRÉDIENTS:
• 2 ingrédients génériques
ÉTAPES:
1. Mélanger les ingrédients.
2. Cuire à feu moyen.
NUTRITION:
Calories: 350 kcal
Protéines: 25g
Glucides: 30g
Lipides: 15g
CONSEIL: Prenez votre temps et amusez-vous en cuisinant !
`
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackRecipe)
    };
  }
};
