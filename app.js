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
    uniqueCount: document.getElementById('uniqueCount'),
    historyList: document.getElementById('historyList')
};

// --- GESTION DES INGRÉDIENTS ---

document.querySelectorAll('.quick-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const text = e.target.textContent.trim();
        const ingredient = text.includes(' ') ? text.split(' ')[1].toLowerCase() : text.toLowerCase();
        if (!state.selectedIngredients.has(ingredient)) {
            state.selectedIngredients.add(ingredient);
            renderIngredients();
        }
    });
});

elements.ingredientInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        state.selectedIngredients.add(e.target.value.trim().toLowerCase());
        e.target.value = '';
        renderIngredients();
    }
});

elements.excludeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        state.excludedIngredients.add(e.target.value.trim().toLowerCase());
        e.target.value = '';
        renderIngredients();
    }
});

function renderIngredients() {
    elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(ing => `
        <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            ${ing}
            <button onclick="removeIngredient('${ing}', 'selected')" class="hover:text-green-900">×</button>
        </span>
    `).join('');

    elements.excludedContainer.innerHTML = Array.from(state.excludedIngredients).map(ing => `
        <span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            ${ing}
            <button onclick="removeIngredient('${ing}', 'excluded')" class="hover:text-red-900">×</button>
        </span>
    `).join('');
}

function removeIngredient(ing, type) {
    if (type === 'selected') state.selectedIngredients.delete(ing);
    else state.excludedIngredients.delete(ing);
    renderIngredients();
}

// --- GÉNÉRATION DE LA RECETTE ---

async function generateRecipe() {
    const cuisine = document.getElementById('cuisineType').value;
    const time = document.getElementById('maxTime').value;
    const difficulty = document.getElementById('difficulty').value;

    // Construction du prompt (anciennement createPrompt)
    const prompt = `Génère une recette de cuisine unique et créative.
    Type de cuisine: ${cuisine}
    Temps max: ${time} min
    Difficulté: ${difficulty}
    Ingrédients à inclure: ${Array.from(state.selectedIngredients).join(', ') || 'Libre choix'}
    Ingrédients à bannir: ${Array.from(state.excludedIngredients).join(', ') || 'Aucun'}

    Tu DOIS strictement utiliser ce format :
    NOM: [Nom de la recette]
    DESCRIPTION: [Description courte]
    CUISINE: ${cuisine}
    TEMPS: [Durée estimée]
    PORTIONS: [Nombre de personnes]
    DIFFICULTÉ: ${difficulty}

    INGRÉDIENTS:
    - [Liste d'ingrédients]

    ÉTAPES:
    1. [Étape 1]
    2. [Étape 2]

    NUTRITION:
    Calories: [X] kcal
    Protéines: [X]g
    Glucides: [X]g
    Lipides: [X]g

    CONSEIL: [Astuce du chef]`;

    showLoading();

    try {
        const response = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        const result = await response.json();
        
        // Extraction du texte
        let recipeText = "";
        if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
            recipeText = result.candidates[0].content.parts[0].text;
        } else if (result.recipe) { // Support pour l'ancienne version
            recipeText = result.recipe;
        } else {
            throw new Error("Impossible de lire la réponse de l'IA");
        }

        const recipe = parseRecipe(recipeText);
        displayRecipe(recipe);
        addToHistory(recipe);
        updateStats();
        showResult();

    } catch (error) {
        console.error("Erreur complète:", error);
        alert("Erreur: " + error.message);
        showWelcome();
    }
}

function parseRecipe(text) {
    const cleanText = text.replace(/\*\*/g, '').replace(/###/g, '').trim();
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const recipe = {
        name: 'Recette du Chef', description: '', cuisine: '', time: '', servings: '',
        difficulty: '', ingredients: [], steps: [], nutrition: {}, tip: ''
    };

    let section = '';
    lines.forEach(line => {
        const up = line.toUpperCase();
        if (up.startsWith('NOM:')) recipe.name = line.substring(4).trim();
        else if (up.startsWith('DESCRIPTION:')) recipe.description = line.substring(12).trim();
        else if (up.startsWith('CUISINE:')) recipe.cuisine = line.substring(8).trim();
        else if (up.startsWith('TEMPS:')) recipe.time = line.substring(6).trim();
        else if (up.startsWith('PORTIONS:')) recipe.servings = line.substring(9).trim();
        else if (up.startsWith('DIFFICULTÉ:')) recipe.difficulty = line.substring(11).trim();
        else if (up.includes('INGRÉDIENTS')) section = 'ingredients';
        else if (up.includes('ÉTAPES') || up.includes('PRÉPARATION')) section = 'steps';
        else if (up.includes('NUTRITION')) section = 'nutrition';
        else if (up.startsWith('CONSEIL:')) { recipe.tip = line.substring(8).trim(); section = 'tip'; }
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

    if (recipe.ingredients.length === 0) recipe.ingredients = ["Détails dans la préparation"];
    if (recipe.steps.length === 0) recipe.steps = ["Suivre les instructions générales"];
    return recipe;
}

function displayRecipe(recipe) {
    document.getElementById('recipeName').textContent = recipe.name;
    document.getElementById('recipeDescription').textContent = recipe.description;
    document.getElementById('recipeCuisine').textContent = recipe.cuisine;
    document.getElementById('recipeTime').textContent = recipe.time;
    document.getElementById('recipeServings').textContent = recipe.servings;
    document.getElementById('recipeDifficulty').textContent = recipe.difficulty;
    document.getElementById('recipeTip').textContent = recipe.tip;

    document.getElementById('ingredientsList').innerHTML = recipe.ingredients
        .map(ing => `<li class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-gray-700">
            <span class="text-green-500">✔</span> ${ing}</li>`).join('');

    document.getElementById('stepsList').innerHTML = recipe.steps
        .map((step, i) => `
            <div class="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <span class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">${i + 1}</span>
                <p class="text-gray-700 leading-relaxed">${step}</p>
            </div>`).join('');

    const nutritionContainer = document.getElementById('nutritionGrid');
    nutritionContainer.innerHTML = Object.entries(recipe.nutrition)
        .map(([label, value]) => `
            <div class="bg-gray-50 p-3 rounded-xl text-center">
                <div class="text-xs text-gray-500 uppercase font-bold mb-1">${label}</div>
                <div class="text-gray-800 font-bold">${value}</div>
            </div>`).join('');
}

// --- HISTORIQUE ET STATS ---

function addToHistory(recipe) {
    const dish = {
        name: recipe.name,
        time: recipe.time,
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now()
    };
    state.dishHistory.unshift(dish);
    state.uniqueDishes.add(recipe.name);
    if (state.dishHistory.length > 20) state.dishHistory.pop();
    renderHistory();
}

function renderHistory() {
    elements.historySection.classList.remove('hidden');
    elements.historyList.innerHTML = state.dishHistory.map(dish => `
        <div class="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-50 transition">🍲</div>
                <div>
                    <h4 class="font-bold text-gray-800">${dish.name}</h4>
                    <div class="flex gap-3 text-xs text-gray-500">
                        <span>⏱️ ${dish.time}</span>
                        <span>🕐 ${dish.timestamp}</span>
                    </div>
                </div>
            </div>
        </div>`
    ).join('');
}

function updateStats() {
    state.recipeCount++;
    elements.recipeCount.textContent = state.recipeCount;
    elements.uniqueCount.textContent = state.uniqueDishes.size;
}

// --- NAVIGATION ---

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

// Event Listeners
elements.generateBtn.addEventListener('click', generateRecipe);
elements.newDishBtn.addEventListener('click', generateRecipe);
elements.saveBtn.addEventListener('click', () => alert('Fonctionnalité de sauvegarde à venir ! 💾'));
elements.clearHistory.addEventListener('click', () => {
    if (confirm('Effacer l\'historique ?')) {
        state.dishHistory = [];
        elements.historySection.classList.add('hidden');
    }
});

// Init
renderIngredients();
