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
    const { prompt } = data;

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

    // Log pour debugging détaillé
    console.log('=== RÉPONSE GEMINI COMPLÈTE ===');
    console.log(JSON.stringify(response, null, 2));
    console.log('=== FIN RÉPONSE ===');

    // Vérifier s'il y a une erreur dans la réponse
    if (response.error) {
      console.error('Erreur dans la réponse:', response.error);
      throw new Error(`Erreur API Gemini: ${response.error.message || JSON.stringify(response.error)}`);
    }

    // Extraire le texte de différentes façons possibles
    let recipeText = null;

    // Vérifier la structure des candidats
    if (response.candidates && Array.isArray(response.candidates) && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      console.log('=== CANDIDATE TROUVÉ ===');
      console.log(JSON.stringify(candidate, null, 2));
      
      // Cas 1: Structure normale Gemini (content.parts[0].text)
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
        if (candidate.content.parts[0].text) {
          recipeText = candidate.content.parts[0].text;
          console.log('✓ Texte extrait via content.parts[0].text');
          console.log('Longueur:', recipeText.length);
          console.log('Début:', recipeText.substring(0, 200));
        }
      }
      // Cas 2: Structure alternative directe sur candidate
      else if (candidate.text) {
        recipeText = candidate.text;
        console.log('✓ Texte extrait via candidate.text');
      }
      // Cas 3: Output direct
      else if (candidate.output) {
        recipeText = candidate.output;
        console.log('✓ Texte extrait via candidate.output');
      }
    }
    // Cas 4: Réponse directe au premier niveau
    else if (response.text) {
      recipeText = response.text;
      console.log('✓ Texte extrait via response.text');
    }

    if (recipeText && recipeText.trim().length > 0) {
      console.log('=== RECETTE EXTRAITE ===');
      console.log('Longueur totale:', recipeText.length);
      console.log('Premiers 300 caractères:', recipeText.substring(0, 300));
      console.log('Derniers 100 caractères:', recipeText.substring(recipeText.length - 100));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          recipe: recipeText,
          debug: {
            hasText: true,
            textLength: recipeText.length,
            preview: recipeText.substring(0, 150),
            structure: 'Gemini API standard'
          }
        })
      };
    } else {
      // Retourner la structure complète pour debugging
      console.error('❌ AUCUN TEXTE TROUVÉ - Structure complète:');
      console.error(JSON.stringify(response, null, 2));
      
      throw new Error(`Structure de réponse inattendue. Aucun texte trouvé dans: ${JSON.stringify(response).substring(0, 1000)}`);
    }

  } catch (error) {
    console.error('=== ERREUR COMPLÈTE ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erreur lors de la génération de la recette',
        details: error.message,
        help: 'Vérifiez les logs Netlify pour plus de détails'
      })
    };
  }
};
