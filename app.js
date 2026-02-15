// État de l'application
const state = {
    selectedIngredients: new Set(),
    excludedIngredients: new Set(),
    dishHistory: [],
    recipeCount: 0,
    uniqueDishes: new Set()
};

// Éléments DOM
const elements = {
    ingredientInput: document.getElementById('ingredientInput'),
    excludeInput: document.getElementById('excludeInput'),
    selectedContainer: document.getElementById('selectedIngredients'),
    excludedContainer: document.getElementById('excludedIngredients'),
    generateBtn: document.getElementById('generateBtn'),
    newDishBtn: document.getElementById('newDishBtn'),
    saveBtn: document.getElementById('saveBtn'),
    clearHistory: document.getElementById('clearHistory'),
    loading: document.getElementById('loading'),
    welcome: document.getElementById('welcome'),
    result: document.getElementById('result'),
    historySection: document.getElementById('historySection'),
    recipeCount: document.getElementById('recipeCount'),
    uniqueCount: document.getElementById('uniqueCount')
};

// Ajout rapide d'ingrédients
document.querySelectorAll('.quick-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const ingredient = e.target.textContent.trim().split(' ')[1].toLowerCase();
        if (!state.selectedIngredients.has(ingredient)) {
            state.selectedIngredients.add(ingredient);
            renderIngredients();
        }
    });
});

// Gestion des inputs
elements.ingredientInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        const ingredients = e.target.value.trim().toLowerCase().split(',').map(i => i.trim());
        ingredients.forEach(ingredient => {
            if (ingredient && !state.selectedIngredients.has(ingredient)) {
                state.selectedIngredients.add(ingredient);
            }
        });
        renderIngredients();
        e.target.value = '';
    }
});

elements.excludeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        const ingredients = e.target.value.trim().toLowerCase().split(',').map(i => i.trim());
        ingredients.forEach(ingredient => {
            if (ingredient && !state.excludedIngredients.has(ingredient)) {
                state.excludedIngredients.add(ingredient);
            }
        });
        renderIngredients();
        e.target.value = '';
    }
});

// Rendu des ingrédients
function renderIngredients() {
    // Ingrédients sélectionnés
    elements.selectedContainer.innerHTML = '';
    const emptyInclude = document.createElement('span');
    emptyInclude.className = 'text-gray-400 text-sm self-center';
    emptyInclude.id = 'emptyInclude';
    emptyInclude.textContent = 'Ajoutez vos ingrédients...';
    
    if (state.selectedIngredients.size === 0) {
        elements.selectedContainer.appendChild(emptyInclude);
    } else {
        state.selectedIngredients.forEach(ing => {
            const tag = createIngredientTag(ing, 'green', () => {
                state.selectedIngredients.delete(ing);
                renderIngredients();
            });
            elements.selectedContainer.appendChild(tag);
        });
    }

    // Ingrédients exclus
    elements.excludedContainer.innerHTML = '';
    const emptyExclude = document.createElement('span');
    emptyExclude.className = 'text-gray-400 text-sm self-center';
    emptyExclude.id = 'emptyExclude';
    emptyExclude.textContent = 'Aucune restriction';
    
    if (state.excludedIngredients.size === 0) {
        elements.excludedContainer.appendChild(emptyExclude);
    } else {
        state.excludedIngredients.forEach(ing => {
            const tag = createIngredientTag(ing, 'red', () => {
                state.excludedIngredients.delete(ing);
                renderIngredients();
            });
            elements.excludedContainer.appendChild(tag);
        });
    }
}

// Création d'un tag d'ingrédient
function createIngredientTag(text, color, onRemove) {
    const tag = document.createElement('div');
    const colors = {
        green: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
        red: 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
    };
    
    tag.className = `ingredient-tag inline-flex items-center gap-2 px-4 py-2 rounded-full ${colors[color]} cursor-pointer shadow-md font-medium text-sm`;
    tag.innerHTML = `
        <span>${text}</span>
        <span class="hover:bg-white/30 rounded-full w-5 h-5 flex items-center justify-center text-xs">×</span>
    `;
    tag.onclick = onRemove;
    return tag;
}

// Construction du prompt
function buildPrompt() {
    const cuisine = document.getElementById('cuisineType').value;
    const timeLimit = document.getElementById('timeLimit').value;
    const difficulty = document.getElementById('difficulty').value;
    
    const historyText = state.dishHistory.length > 0 
        ? `\n\nRECETTES DÉJÀ SUGGÉRÉES (NE JAMAIS RÉPÉTER): ${state.dishHistory.map(h => h.name).join(', ')}`
        : '';

    const selectedIngs = Array.from(state.selectedIngredients);
    const excludedIngs = Array.from(state.excludedIngredients);

    return `Tu es un chef étoilé innovant et créatif. Crée UNE recette complète et détaillée selon ces critères:

INGRÉDIENTS DISPONIBLES: ${selectedIngs.length > 0 ? selectedIngs.join(', ') : 'aucun spécifié - sois créatif'}
INGRÉDIENTS À ÉVITER ABSOLUMENT: ${excludedIngs.length > 0 ? excludedIngs.join(', ') : 'aucun'}
${cuisine ? `TYPE DE CUISINE: ${cuisine}` : 'TYPE DE CUISINE: Varie entre différentes cuisines du monde'}
${timeLimit ? `TEMPS MAXIMUM: ${timeLimit} minutes` : ''}
${difficulty ? `NIVEAU: ${difficulty}` : ''}${historyText}

RÈGLES IMPORTANTES:
- Crée une recette TOTALEMENT DIFFÉRENTE des recettes déjà suggérées
- Utilise intelligemment les ingrédients disponibles
- N'utilise JAMAIS les ingrédients à éviter
- Sois créatif et original

FORMATE TA RÉPONSE EXACTEMENT COMME CET EXEMPLE (respecte ce format STRICTEMENT):

NOM: Poulet Croustillant aux Herbes Provençales
DESCRIPTION: Un poulet juteux mariné dans des herbes fraîches, rôti à la perfection avec une peau dorée et croustillante. Servi avec des légumes de saison grillés et une sauce au citron.
CUISINE: Française
TEMPS: 45 minutes
PORTIONS: 4 personnes
DIFFICULTÉ: Intermédiaire

INGRÉDIENTS:
• 4 cuisses de poulet (environ 800g)
• 3 cuillères à soupe d'huile d'olive
• 2 gousses d'ail hachées
• 1 cuillère à soupe de thym frais
• 1 cuillère à soupe de romarin frais
• Le jus d'un citron
• Sel et poivre au goût
• 500g de légumes de saison

ÉTAPES:
1. Préchauffez le four à 200°C. Mélangez l'huile d'olive, l'ail, les herbes, le jus de citron, le sel et le poivre dans un bol.
2. Massez les cuisses de poulet avec la marinade et laissez reposer 15 minutes à température ambiante.
3. Placez le poulet sur une plaque de cuisson et enfournez pendant 35-40 minutes jusqu'à ce que la peau soit dorée et croustillante.
4. Pendant ce temps, coupez les légumes en morceaux et faites-les griller à la poêle avec un peu d'huile.
5. Laissez reposer le poulet 5 minutes avant de servir avec les légumes grillés et un filet de citron.

NUTRITION (par portion):
Calories: 420 kcal
Protéines: 35g
Glucides: 12g
Lipides: 28g

CONSEIL: Pour une peau encore plus croustillante, séchez bien le poulet avec du papier absorbant avant de le mariner et augmentez la température du four à 220°C les 5 dernières minutes.

MAINTENANT GÉNÈRE TA PROPRE RECETTE EN SUIVANT EXACTEMENT CE FORMAT. COMMENCE PAR "NOM:" SANS AUCUN TEXTE AVANT.`;
}

// Génération de la recette
async function generateRecipe() {
    showLoading();
    
    try {
        console.log('🚀 Début de la génération de recette...');
        
        // Appel à la fonction serverless Netlify
        const response = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: buildPrompt() })
        });

        console.log('📡 Réponse HTTP status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Erreur HTTP:', errorData);
            throw new Error(errorData.details || 'Erreur lors de la génération de la recette');
        }

        const data = await response.json();
        
        console.log('📦 Données reçues:', data);
        console.log('📦 Type de data.recipe:', typeof data.recipe);
        console.log('📦 Longueur de data.recipe:', data.recipe ? data.recipe.length : 0);
        
        if (data.debug) {
            console.log('🔍 Debug info:', data.debug);
        }
        
        if (!data.recipe || data.recipe.trim().length === 0) {
            console.error('❌ Aucune recette dans la réponse:', data);
            throw new Error('La réponse ne contient pas de recette valide');
        }
        
        console.log('✅ Recette reçue, début du parsing...');
        console.log('📝 Premiers 500 caractères:', data.recipe.substring(0, 500));
        
        const parsedRecipe = parseRecipe(data.recipe);
        console.log('✅ Recette parsée:', parsedRecipe);
        
        displayRecipe(parsedRecipe);
        updateStats();
        
        console.log('✅ Génération terminée avec succès!');
    } catch (error) {
        console.error('💥 ERREUR COMPLÈTE:', error);
        console.error('💥 Stack:', error.stack);
        alert(`Erreur: ${error.message}\n\nConsultez la console (F12) pour plus de détails.`);
        showWelcome();
    }
}

// Parse la recette avec meilleure gestion
function parseRecipe(text) {
    console.log('🔍 DÉBUT DU PARSING');
    console.log('📝 Texte brut (longueur: ' + text.length + ')');
    console.log('📝 Premiers 800 caractères:', text.substring(0, 800));
    
    // Nettoyer le texte
    text = text.trim();
    
    // Supprimer les balises markdown si présentes
    text = text.replace(/```[a-z]*\n/g, '').replace(/```/g, '');
    
    const lines = text.split('\n').filter(l => l.trim());
    console.log('📋 Nombre de lignes:', lines.length);
    
    const recipe = {
        name: '',
        description: '',
        cuisine: '',
        time: '',
        servings: '',
        difficulty: '',
        ingredients: [],
        steps: [],
        nutrition: {},
        tip: ''
    };

    let section = '';
    let descriptionLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Ignorer les lignes vides
        if (!trimmed) continue;
        
        console.log(`Ligne ${i}: [${section}] "${trimmed.substring(0, 80)}"`);
        
        // Détecter les sections principales
        if (trimmed.match(/^NOM\s*:/i) || trimmed.match(/^\*\*NOM\*\*\s*:/i)) {
            recipe.name = trimmed.replace(/\*?\*?NOM\*?\*?\s*:\s*/i, '').trim();
            console.log('  ✓ NOM trouvé:', recipe.name);
        } 
        else if (trimmed.match(/^DESCRIPTION\s*:/i) || trimmed.match(/^\*\*DESCRIPTION\*\*\s*:/i)) {
            recipe.description = trimmed.replace(/\*?\*?DESCRIPTION\*?\*?\s*:\s*/i, '').trim();
            section = 'description';
            console.log('  ✓ DESCRIPTION trouvée');
        }
        else if (trimmed.match(/^CUISINE\s*:/i) || trimmed.match(/^\*\*CUISINE\*\*\s*:/i)) {
            recipe.cuisine = trimmed.replace(/\*?\*?CUISINE\*?\*?\s*:\s*/i, '').trim();
            section = '';
            console.log('  ✓ CUISINE trouvée:', recipe.cuisine);
        }
        else if (trimmed.match(/^TEMPS\s*:/i) || trimmed.match(/^\*\*TEMPS\*\*\s*:/i)) {
            recipe.time = trimmed.replace(/\*?\*?TEMPS\*?\*?\s*:\s*/i, '').trim();
            section = '';
            console.log('  ✓ TEMPS trouvé:', recipe.time);
        }
        else if (trimmed.match(/^PORTIONS?\s*:/i) || trimmed.match(/^\*\*PORTIONS?\*\*\s*:/i)) {
            recipe.servings = trimmed.replace(/\*?\*?PORTIONS?\*?\*?\s*:\s*/i, '').trim();
            section = '';
            console.log('  ✓ PORTIONS trouvées:', recipe.servings);
        }
        else if (trimmed.match(/^(DIFFICULTÉ|NIVEAU)\s*:/i) || trimmed.match(/^\*\*(DIFFICULTÉ|NIVEAU)\*\*\s*:/i)) {
            recipe.difficulty = trimmed.replace(/\*?\*?(DIFFICULTÉ|NIVEAU)\*?\*?\s*:\s*/i, '').trim();
            section = '';
            console.log('  ✓ DIFFICULTÉ trouvée:', recipe.difficulty);
        }
        else if (trimmed.match(/^INGRÉDIENTS?\s*:?$/i) || trimmed.match(/^\*\*INGRÉDIENTS?\*\*\s*:?$/i)) {
            section = 'ingredients';
            console.log('  ✓ Section INGRÉDIENTS');
        }
        else if (trimmed.match(/^(ÉTAPES?|PRÉPARATION|INSTRUCTIONS?)\s*:?$/i) || trimmed.match(/^\*\*(ÉTAPES?|PRÉPARATION|INSTRUCTIONS?)\*\*\s*:?$/i)) {
            section = 'steps';
            console.log('  ✓ Section ÉTAPES');
        }
        else if (trimmed.match(/^NUTRITION/i) || trimmed.match(/^Informations? nutritionnelle?s?/i)) {
            section = 'nutrition';
            console.log('  ✓ Section NUTRITION');
        }
        else if (trimmed.match(/^CONSEIL\s*:/i) || trimmed.match(/^\*\*CONSEIL\*\*\s*:/i)) {
            recipe.tip = trimmed.replace(/\*?\*?CONSEIL\*?\*?\s*:\s*/i, '').trim();
            section = 'tip';
            console.log('  ✓ CONSEIL trouvé');
        }
        // Parser le contenu selon la section
        else if (section === 'description' && trimmed.length > 10 && !trimmed.match(/^[A-Z]+\s*:/)) {
            descriptionLines.push(trimmed);
        }
        else if (section === 'ingredients') {
            // Détecter les ingrédients (commencent par •, -, *, ou un nombre)
            if (trimmed.match(/^[•\-*\d]/)) {
                const ingredient = trimmed.replace(/^[•\-*]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim();
                if (ingredient) {
                    recipe.ingredients.push(ingredient);
                    console.log('    + Ingrédient:', ingredient.substring(0, 50));
                }
            }
        }
        else if (section === 'steps') {
            // Détecter les étapes (commencent par un nombre)
            if (trimmed.match(/^\d+[\.):]/)) {
                const step = trimmed.replace(/^\d+[\.):]\s*/, '').trim();
                if (step) {
                    recipe.steps.push(step);
                    console.log('    + Étape:', step.substring(0, 50));
                }
            }
        }
        else if (section === 'nutrition') {
            if (trimmed.includes(':')) {
                const [key, value] = trimmed.split(':').map(s => s.trim());
                if (key && value) {
                    const cleanKey = key.replace(/[•\-*]/g, '').trim();
                    recipe.nutrition[cleanKey] = value;
                    console.log('    + Nutrition:', cleanKey, '=', value);
                }
            }
        }
        else if (section === 'tip' && trimmed && !trimmed.match(/^[A-Z]+\s*:/)) {
            recipe.tip += ' ' + trimmed;
        }
    }
    
    // Ajouter les lignes de description supplémentaires
    if (descriptionLines.length > 0) {
        recipe.description += ' ' + descriptionLines.join(' ');
    }

    // Nettoyer et valider
    recipe.name = recipe.name.trim();
    recipe.description = recipe.description.trim();
    recipe.tip = recipe.tip.trim();

    // Valeurs par défaut si certains champs sont vides
    if (!recipe.name) {
        recipe.name = 'Recette Délicieuse';
        console.warn('⚠️ Nom par défaut utilisé');
    }
    if (!recipe.description) {
        recipe.description = 'Une délicieuse recette créée spécialement pour vous';
        console.warn('⚠️ Description par défaut utilisée');
    }
    if (!recipe.cuisine) recipe.cuisine = 'Fusion';
    if (!recipe.time) recipe.time = '30 minutes';
    if (!recipe.servings) recipe.servings = '4 personnes';
    if (!recipe.difficulty) recipe.difficulty = 'Intermédiaire';
    
    if (recipe.ingredients.length === 0) {
        recipe.ingredients.push('Voir les détails dans la recette complète');
        console.warn('⚠️ Aucun ingrédient trouvé');
    }
    
    if (recipe.steps.length === 0) {
        recipe.steps.push('Suivez les instructions de préparation détaillées');
        console.warn('⚠️ Aucune étape trouvée');
    }
    
    if (Object.keys(recipe.nutrition).length === 0) {
        recipe.nutrition = {
            'Calories': '350 kcal',
            'Protéines': '25g',
            'Glucides': '30g',
            'Lipides': '15g'
        };
        console.warn('⚠️ Nutrition par défaut utilisée');
    }
    
    if (!recipe.tip) {
        recipe.tip = 'Prenez votre temps et amusez-vous en cuisinant !';
        console.warn('⚠️ Conseil par défaut utilisé');
    }

    console.log('✅ PARSING TERMINÉ');
    console.log('📊 Résumé:', {
        name: recipe.name,
        ingredients: recipe.ingredients.length,
        steps: recipe.steps.length,
        nutritionKeys: Object.keys(recipe.nutrition).length
    });

    return recipe;
}

// Affichage de la recette
function displayRecipe(recipe) {
    console.log('🎨 Affichage de la recette:', recipe.name);
    
    document.getElementById('dishName').textContent = recipe.name;
    document.getElementById('dishDescription').textContent = recipe.description;
    document.getElementById('cuisineBadge').textContent = recipe.cuisine;
    document.getElementById('difficultyBadge').textContent = recipe.difficulty;
    document.getElementById('prepTime').textContent = recipe.time;
    document.getElementById('servings').textContent = recipe.servings;
    document.getElementById('difficulty2').textContent = recipe.difficulty;

    // Ingrédients
    const ingredientsList = document.getElementById('ingredientsList');
    ingredientsList.innerHTML = recipe.ingredients.map(ing => 
        `<li class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <span class="text-purple-500 font-bold">✓</span>
            <span class="text-gray-700">${ing}</span>
        </li>`
    ).join('');

    // Nutrition
    const nutritionInfo = document.getElementById('nutritionInfo');
    nutritionInfo.innerHTML = Object.entries(recipe.nutrition).map(([key, value]) => 
        `<div class="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700 font-medium">${key}</span>
            <span class="text-gray-900 font-bold">${value}</span>
        </div>`
    ).join('');

    // Étapes
    const stepsList = document.getElementById('stepsList');
    stepsList.innerHTML = recipe.steps.map((step, i) => 
        `<div class="flex gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl hover:shadow-md transition">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                ${i + 1}
            </div>
            <p class="text-gray-700 flex-1 self-center">${step}</p>
        </div>`
    ).join('');

    // Conseil
    document.getElementById('chefTip').textContent = recipe.tip;

    // Ajouter à l'historique
    addToHistory(recipe);
    
    showResult();
    console.log('✅ Affichage terminé');
}

// Ajouter à l'historique
function addToHistory(recipe) {
    state.dishHistory.unshift({
        name: recipe.name,
        cuisine: recipe.cuisine,
        time: recipe.time,
        timestamp: new Date().toLocaleString('fr-FR')
    });

    if (state.dishHistory.length > 20) {
        state.dishHistory.pop();
    }

    state.uniqueDishes.add(recipe.name);
    renderHistory();
}

// Afficher l'historique
function renderHistory() {
    if (state.dishHistory.length === 0) return;

    elements.historySection.classList.remove('hidden');
    const historyList = document.getElementById('historyList');
    
    historyList.innerHTML = state.dishHistory.map((dish, i) => 
        `<div class="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition cursor-pointer border border-gray-200">
            <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-400 text-white rounded-full flex items-center justify-center font-bold">
                ${state.dishHistory.length - i}
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-gray-800">${dish.name}</h4>
                <div class="flex gap-3 text-xs text-gray-500 mt-1">
                    <span>🌍 ${dish.cuisine}</span>
                    <span>⏱️ ${dish.time}</span>
                    <span>🕐 ${dish.timestamp}</span>
                </div>
            </div>
        </div>`
    ).join('');
}

// Mise à jour des stats
function updateStats() {
    state.recipeCount++;
    elements.recipeCount.textContent = state.recipeCount;
    elements.uniqueCount.textContent = state.uniqueDishes.size;
}

// Navigation
function showLoading() {
    elements.welcome.classList.add('hidden');
    elements.result.classList.add('hidden');
    elements.loading.classList.remove('hidden');
}

function showWelcome() {
    elements.loading.classList.add('hidden');
    elements.result.classList.add('hidden');
    elements.welcome.classList.remove('hidden');
}

function showResult() {
    elements.loading.classList.add('hidden');
    elements.welcome.classList.add('hidden');
    elements.result.classList.remove('hidden');
    elements.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Event listeners
elements.generateBtn.addEventListener('click', generateRecipe);
elements.newDishBtn.addEventListener('click', generateRecipe);

elements.saveBtn.addEventListener('click', () => {
    alert('Fonctionnalité de sauvegarde à venir ! 💾');
});

elements.clearHistory.addEventListener('click', () => {
    if (confirm('Voulez-vous vraiment effacer tout l\'historique ?')) {
        state.dishHistory = [];
        elements.historySection.classList.add('hidden');
    }
});

// Initialisation
renderIngredients();
console.log('✅ Application initialisée');
