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

RÈGLES:
- Recette DIFFÉRENTE des recettes déjà suggérées
- Créatif avec les ingrédients
- Utilise les ingrédients disponibles
- N'utilise JAMAIS les ingrédients à éviter

FORMATE TA RÉPONSE EXACTEMENT COMME CET EXEMPLE (remplace juste les valeurs entre crochets):

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

    return { prompt };
}

// Génération de la recette
async function generateRecipe() {
    const prompt = createPrompt(); // Votre fonction qui crée le texte du prompt
    showLoading();

    try {
        const response = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        const result = await response.json();
        console.log("Réponse reçue de l'API:", result);

        // Vérification si l'API a renvoyé une erreur
        if (result.error) {
            throw new Error(result.error.message || "Erreur API Google");
        }

        // Extraction du texte avec sécurité totale
        let recipeText = "";
        if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
            recipeText = result.candidates[0].content.parts[0].text;
        } else {
            console.error("Structure reçue bizarre:", result);
            throw new Error("L'IA n'a pas pu générer de texte. Vérifiez votre clé API.");
        }

        const recipe = parseRecipe(recipeText);
        displayRecipe(recipe);
        showResult();

    } catch (error) {
        console.error("Détails de l'erreur:", error);
        alert("Désolé, une erreur est survenue : " + error.message);
        showWelcome();
    }
}

function parseRecipe(text) {
    // Nettoyage des caractères spéciaux Markdown
    const cleanText = text.replace(/\*\*/g, '').replace(/###/g, '').trim();
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const recipe = {
        name: 'Recette du Chef',
        description: '',
        cuisine: 'Maison',
        time: '30 min',
        servings: '2 pers.',
        difficulty: 'Facile',
        ingredients: [],
        steps: [],
        nutrition: {},
        tip: ''
    };

    let section = '';
    
    lines.forEach(line => {
        const up = line.toUpperCase();
        
        // Extraction des champs avec séparateur ":"
        if (up.startsWith('NOM:')) recipe.name = line.substring(4).trim();
        else if (up.startsWith('DESCRIPTION:')) recipe.description = line.substring(12).trim();
        else if (up.startsWith('CUISINE:')) recipe.cuisine = line.substring(8).trim();
        else if (up.startsWith('TEMPS:')) recipe.time = line.substring(6).trim();
        else if (up.startsWith('PORTIONS:')) recipe.servings = line.substring(9).trim();
        else if (up.startsWith('DIFFICULTÉ:')) recipe.difficulty = line.substring(11).trim();
        
        // Détection de début de listes
        else if (up.includes('INGRÉDIENTS')) section = 'ingredients';
        else if (up.includes('ÉTAPES') || up.includes('PRÉPARATION')) section = 'steps';
        else if (up.includes('NUTRITION')) section = 'nutrition';
        else if (up.includes('CONSEIL')) section = 'tip';
        
        // Remplissage selon la section active
        else {
            if (section === 'ingredients' && (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d/.test(line))) {
                recipe.ingredients.push(line.replace(/^[-•*\d.]+\s*/, ''));
            } else if (section === 'steps' && (line.startsWith('-') || /^\d/.test(line))) {
                recipe.steps.push(line.replace(/^[-•*\d.]+\s*/, ''));
            } else if (section === 'nutrition' && line.includes(':')) {
                const [k, v] = line.split(':');
                recipe.nutrition[k.trim()] = v.trim();
            } else if (section === 'tip') {
                recipe.tip = (recipe.tip + ' ' + line).trim();
            }
        }
    });

    // Fallback : Si aucune étape n'a été trouvée, on essaie de prendre les lignes simples
    if (recipe.steps.length === 0 && section === 'steps') {
        recipe.steps = lines.filter(l => !l.includes(':') && l.length > 20).slice(0, 5);
    }

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
