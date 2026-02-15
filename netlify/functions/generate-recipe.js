const https = require('https');

exports.handler = async (event, context) => {
  // Autoriser CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { selectedIngredients, excludedIngredients, cuisine, timeLimit, difficulty, history } = data;

    // Construire le prompt (EXACTEMENT LE MÊME)
    const historyText = history && history.length > 0 
      ? `\n\nRECETTES DÉJÀ SUGGÉRÉES (NE JAMAIS RÉPÉTER): ${history.join(', ')}`
      : '';

    const prompt = `Tu es un chef étoilé innovant et créatif. Crée UNE recette complète et détaillée selon ces critères:

INGRÉDIENTS DISPONIBLES: ${selectedIngredients.length > 0 ? selectedIngredients.join(', ') : 'aucun spécifié - sois créatif'}
INGRÉDIENTS À ÉVITER ABSOLUMENT: ${excludedIngredients.length > 0 ? excludedIngredients.join(', ') : 'aucun'}
${cuisine ? `TYPE DE CUISINE: ${cuisine}` : 'TYPE DE CUISINE: Varie entre différentes cuisines du monde'}
${timeLimit ? `TEMPS MAXIMUM: ${timeLimit} minutes` : ''}
${difficulty ? `NIVEAU: ${difficulty}` : ''}${historyText}

RÈGLES STRICTES:
- La recette DOIT être complètement DIFFÉRENTE de toutes les recettes déjà suggérées
- Sois TRÈS créatif et original dans les associations d'ingrédients
- Utilise au moins 50% des ingrédients disponibles si spécifiés
- JAMAIS utiliser les ingrédients à éviter
- Varie les techniques de cuisson et les styles culinaires
- Propose des plats authentiques et réalisables

FORMAT DE RÉPONSE OBLIGATOIRE (respecte exactement cette structure):

NOM: [Nom du plat créatif et appétissant]
DESCRIPTION: [2-3 phrases décrivant le plat et ses saveurs]
CUISINE: [Type de cuisine]
TEMPS: [X minutes]
PORTIONS: [Y personnes]
DIFFICULTÉ: [Débutant/Intermédiaire/Avancé]

INGRÉDIENTS:
• [ingrédient 1 avec quantité précise]
• [ingrédient 2 avec quantité précise]
• [ingrédient 3 avec quantité précise]
[minimum 8 ingrédients avec quantités exactes]

ÉTAPES:
1. [Étape détaillée avec temps si nécessaire]
2. [Étape détaillée avec temps si nécessaire]
3. [Étape détaillée avec temps si nécessaire]
[minimum 5 étapes détaillées]

NUTRITION (par portion):
Calories: [X] kcal
Protéines: [X]g
Glucides: [X]g
Lipides: [X]g

CONSEIL: [Un conseil de chef professionnel pour réussir ce plat]`;

    // Appel à l'API Google Gemini (GRATUIT!)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API Key Google Gemini non configurée');
    }

    const requestBody = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error('Erreur de parsing de la réponse'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts[0]) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          recipe: response.candidates[0].content.parts[0].text
        })
      };
    } else {
      throw new Error('Réponse invalide de l\'API Gemini');
    }

  } catch (error) {
    console.error('Erreur:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur lors de la génération de la recette',
        details: error.message
      })
    };
  }
};
