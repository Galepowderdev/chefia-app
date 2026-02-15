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

    console.log('Appel API Gemini avec clé:', apiKey ? 'Clé présente (AIza...)' : 'Clé absente!');

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
          console.log('Status Code:', res.statusCode);
          console.log('Response Headers:', JSON.stringify(res.headers));
          
          try {
            const parsed = JSON.parse(data);
            
            // Vérifier si c'est une erreur HTTP
            if (res.statusCode !== 200) {
              console.error('Erreur API (status ' + res.statusCode + '):', data);
              reject(new Error(`API Gemini error (${res.statusCode}): ${parsed.error?.message || data.substring(0, 200)}`));
              return;
            }
            
            resolve(parsed);
          } catch (e) {
            console.error('Erreur parsing:', e);
            console.error('Raw response:', data.substring(0, 500));
            reject(new Error('Erreur de parsing de la réponse: ' + e.message));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });

    // Log pour debugging
    console.log('Réponse Gemini:', JSON.stringify(response, null, 2));

    // Vérifier s'il y a une erreur dans la réponse
    if (response.error) {
      throw new Error(`Erreur API Gemini: ${response.error.message || JSON.stringify(response.error)}`);
    }

    // Extraire le texte de différentes façons possibles
    let recipeText = null;

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      
      // Cas 1: Structure normale
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        recipeText = candidate.content.parts[0].text;
      }
      // Cas 2: Structure alternative
      else if (candidate.text) {
        recipeText = candidate.text;
      }
      // Cas 3: Output direct
      else if (candidate.output) {
        recipeText = candidate.output;
      }
    }
    // Cas 4: Réponse directe
    else if (response.text) {
      recipeText = response.text;
    }

    if (recipeText) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          recipe: recipeText
        })
      };
    } else {
      // Retourner la structure complète pour debugging
      throw new Error(`Structure de réponse inattendue. Réponse complète: ${JSON.stringify(response).substring(0, 500)}`);
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
