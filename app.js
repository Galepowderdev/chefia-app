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

    const prompt = `Tu es un chef étoilé innovant et créatif. Crée UNE recette complète et détaillée selon ces critères:

INGRÉDIENTS DISPONIBLES: ${selectedIngs.length > 0 ? selectedIngs.join(', ') : 'aucun spécifié - sois créatif'}
INGRÉDIENTS À ÉVITER ABSOLUMENT: ${excludedIngs.length > 0 ? excludedIngs.join(', ') : 'aucun'}
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

IMPORTANT: Tu DOIS respecter EXACTEMENT ce format (ne rajoute RIEN avant ou après, pas de texte d'introduction):

NOM: [Nom créatif du plat]
DESCRIPTION: [Description en 2-3 phrases]
CUISINE: [Type de cuisine]
TEMPS: [X minutes]
PORTIONS: [X personnes]
DIFFICULTÉ: [Débutant/Intermédiaire/Avancé]

INGRÉDIENTS:
• [ingrédient 1 avec quantité]
• [ingrédient 2 avec quantité]
• [ingrédient 3 avec quantité]
• [etc... minimum 8 ingrédients]

ÉTAPES:
1. [Étape détaillée]
2. [Étape détaillée]
3. [Étape détaillée]
[minimum 5 étapes]

NUTRITION (par portion):
Calories: [X] kcal
Protéines: [X]g
Glucides: [X]g
Lipides: [X]g

CONSEIL: [Conseil de chef]

COMMENCE DIRECTEMENT PAR "NOM:" SANS AUCUN TEXTE AVANT.`;

    return { prompt };
}

// Génération de la recette
async function generateRecipe() {
    showLoading();
    
    try {
        // Appel à la fonction serverless Netlify
        const response = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(buildPrompt())
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la génération de la recette');
        }

        const data = await response.json();
        
        console.log('Réponse complète de l\'API:', data);
        
        displayRecipe(parseRecipe(data.recipe));
        updateStats();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la génération de la recette. Veuillez réessayer.');
        showWelcome();
    }
}

// Parse la recette
function parseRecipe(text) {
    console.log('Texte brut reçu:', text.substring(0, 500));
    
    const lines = text.split('\n').filter(l => l.trim());
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
    
    lines.forEach(line => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('NOM:') || trimmed.startsWith('**NOM:**')) {
            recipe.name = trimmed.replace(/\*?\*?NOM:\*?\*?/, '').trim();
        } else if (trimmed.startsWith('DESCRIPTION:') || trimmed.startsWith('**DESCRIPTION:**')) {
            recipe.description = trimmed.replace(/\*?\*?DESCRIPTION:\*?\*?/, '').trim();
        } else if (trimmed.startsWith('CUISINE:') || trimmed.startsWith('**CUISINE:**')) {
            recipe.cuisine = trimmed.replace(/\*?\*?CUISINE:\*?\*?/, '').trim();
        } else if (trimmed.startsWith('TEMPS:') || trimmed.startsWith('**TEMPS:**')) {
            recipe.time = trimmed.replace(/\*?\*?TEMPS:\*?\*?/, '').trim();
        } else if (trimmed.startsWith('PORTIONS:') || trimmed.startsWith('**PORTIONS:**')) {
            recipe.servings = trimmed.replace(/\*?\*?PORTIONS:\*?\*?/, '').trim();
        } else if (trimmed.startsWith('DIFFICULTÉ:') || trimmed.startsWith('NIVEAU:') || trimmed.startsWith('**DIFFICULTÉ:**') || trimmed.startsWith('**NIVEAU:**')) {
            recipe.difficulty = trimmed.replace(/\*?\*?(DIFFICULTÉ|NIVEAU):\*?\*?/, '').trim();
        } else if (trimmed === 'INGRÉDIENTS:' || trimmed === '**INGRÉDIENTS:**' || trimmed.includes('INGRÉDIENTS')) {
            section = 'ingredients';
        } else if (trimmed === 'ÉTAPES:' || trimmed === '**ÉTAPES:**' || trimmed === 'PRÉPARATION:' || trimmed.includes('ÉTAPES')) {
            section = 'steps';
        } else if (trimmed.startsWith('NUTRITION') || trimmed.includes('nutritionnelle')) {
            section = 'nutrition';
        } else if (trimmed.startsWith('CONSEIL:') || trimmed.startsWith('**CONSEIL:**')) {
            recipe.tip = trimmed.replace(/\*?\*?CONSEIL:\*?\*?/, '').trim();
            section = 'tip';
        } else if (section === 'ingredients' && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+/.test(trimmed))) {
            recipe.ingredients.push(trimmed.replace(/^[•\-*]\s*/, '').trim());
        } else if (section === 'steps' && /^\d+[\.):]/.test(trimmed)) {
            recipe.steps.push(trimmed.replace(/^\d+[\.):]\s*/, '').trim());
        } else if (section === 'nutrition') {
            if (trimmed.includes(':')) {
                const [key, value] = trimmed.split(':').map(s => s.trim());
                if (key && value) {
                    recipe.nutrition[key.replace(/\*/g, '')] = value;
                }
            }
        } else if (section === 'tip' && trimmed && !trimmed.includes('CONSEIL')) {
            recipe.tip += ' ' + trimmed;
        } else if (section === '' && recipe.description && trimmed.length > 20 && !trimmed.includes(':')) {
            // Ajouter à la description si on est au début et que c'est du texte long
            recipe.description += ' ' + trimmed;
        }
    });

    // Valeurs par défaut si certains champs sont vides
    if (!recipe.name) recipe.name = 'Recette Mystère';
    if (!recipe.description) recipe.description = 'Une délicieuse recette créée par notre chef IA';
    if (!recipe.cuisine) recipe.cuisine = 'Fusion';
    if (!recipe.time) recipe.time = '30 minutes';
    if (!recipe.servings) recipe.servings = '4 personnes';
    if (!recipe.difficulty) recipe.difficulty = 'Intermédiaire';
    if (recipe.ingredients.length === 0) recipe.ingredients.push('Consultez la recette complète ci-dessous');
    if (recipe.steps.length === 0) recipe.steps.push('Suivez les instructions de préparation');
    if (Object.keys(recipe.nutrition).length === 0) {
        recipe.nutrition = {
            'Calories': '350 kcal',
            'Protéines': '25g',
            'Glucides': '30g',
            'Lipides': '15g'
        };
    }
    if (!recipe.tip) recipe.tip = 'Prenez votre temps et amusez-vous en cuisinant !';

    console.log('Recette parsée:', JSON.stringify(recipe, null, 2));
    return recipe;
}

// Affichage de la recette
function displayRecipe(recipe) {
    document.getElementById('dishName').textContent = recipe.name;
    document.getElementById('dishDescription').textContent = recipe.description;
    document.getElementById('cuisineBadge').textContent = recipe.cuisine || 'Fusion';
    document.getElementById('difficultyBadge').textContent = recipe.difficulty || 'Tous niveaux';
    document.getElementById('prepTime').textContent = recipe.time || '30 min';
    document.getElementById('servings').textContent = recipe.servings || '4 personnes';
    document.getElementById('difficulty2').textContent = recipe.difficulty || 'Intermédiaire';

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
