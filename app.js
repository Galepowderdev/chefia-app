async function generateRecipe() {
    // Utilisation des IDs RÉELS de votre HTML (vus dans index.html)
    const cuisine = document.getElementById('cuisine-type')?.value || 'Libre';
    const time = document.getElementById('prep-time')?.value || '45';
    const difficulty = document.getElementById('difficulty-level')?.value || 'Facile';

    const prompt = `Génère une recette de cuisine unique.
    Type: ${cuisine}, Temps: ${time}min, Difficulté: ${difficulty}.
    Ingrédients inclus: ${Array.from(state.selectedIngredients).join(', ') || 'Tous'}.
    Ingrédients exclus: ${Array.from(state.excludedIngredients).join(', ') || 'Aucun'}.
    Format STRICT: NOM:, DESCRIPTION:, CUISINE:, TEMPS:, PORTIONS:, DIFFICULTÉ:, INGRÉDIENTS: (liste avec -), ÉTAPES: (liste avec 1.), NUTRITION:, CONSEIL:.`;

    showLoading();

    try {
        const response = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (!response.ok) {
            // Ici on évite le [object Object] en extrayant le texte de l'erreur
            const errorMsg = data.error?.message || data.error || "Erreur inconnue";
            throw new Error(errorMsg);
        }

        const recipeText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!recipeText) throw new Error("L'IA n'a pas renvoyé de texte.");

        const recipe = parseRecipe(recipeText);
        displayRecipe(recipe);
        addToHistory(recipe);
        showResult();

    } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur : " + error.message); // Affiche maintenant le texte de l'erreur
        showWelcome();
    }
}

function parseRecipe(text) {
    // Nettoie les étoiles et sépare par ligne
    const cleanText = text.replace(/\*\*/g, '');
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);
    
    const r = { 
        name: 'Recette', description: '', cuisine: '', time: '', 
        servings: '', difficulty: '', ingredients: [], steps: [], 
        nutrition: {}, tip: '' 
    };

    let section = '';
    lines.forEach(l => {
        const u = l.toUpperCase();
        if (u.startsWith('NOM:')) r.name = l.substring(4).trim();
        else if (u.startsWith('DESCRIPTION:')) r.description = l.substring(12).trim();
        else if (u.includes('INGRÉDIENTS')) section = 'ing';
        else if (u.includes('ÉTAPES')) section = 'step';
        else if (u.includes('NUTRITION')) section = 'nut';
        else if (u.startsWith('CONSEIL:')) r.tip = l.substring(8).trim();
        else {
            if (section === 'ing' && (l.startsWith('-') || l.startsWith('*'))) r.ingredients.push(l.substring(1).trim());
            else if (section === 'step' && /^\d/.test(l)) r.steps.push(l.replace(/^\d+[\.\)]\s*/, ''));
            else if (section === 'nut' && l.includes(':')) {
                const p = l.split(':');
                r.nutrition[p[0].trim()] = p[1].trim();
            }
        }
    });
    return r;
}
