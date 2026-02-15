const state = {
    selectedIngredients: new Set(),
    excludedIngredients: new Set(),
    dishHistory: [],
    recipeCount: 0,
    uniqueDishes: new Set()
};

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

[elements.ingredientInput, elements.excludeInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const val = e.target.value.trim().toLowerCase();
            if (e.target.id === 'ingredientInput') state.selectedIngredients.add(val);
            else state.excludedIngredients.add(val);
            e.target.value = '';
            renderIngredients();
        }
    });
});

function renderIngredients() {
    elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(ing => `
        <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            ${ing} <button onclick="removeIng('${ing}', 'sel')" class="font-bold">×</button>
        </span>`).join('');
    elements.excludedContainer.innerHTML = Array.from(state.excludedIngredients).map(ing => `
        <span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            ${ing} <button onclick="removeIng('${ing}', 'ex')" class="font-bold">×</button>
        </span>`).join('');
}

window.removeIng = (ing, type) => {
    if (type === 'sel') state.selectedIngredients.delete(ing);
    else state.excludedIngredients.delete(ing);
    renderIngredients();
};

// --- GÉNÉRATION ---
async function generateRecipe() {
    const cuisine = document.getElementById('cuisine-type')?.value || 'Libre';
    const time = document.getElementById('prep-time')?.value || '45';
    const difficulty = document.getElementById('difficulty-level')?.value || 'Facile';

    const prompt = `Génère une recette. Format STRICT :
    NOM: [nom]
    DESCRIPTION: [description]
    CUISINE: ${cuisine}
    TEMPS: [temps]
    PORTIONS: 4 personnes
    DIFFICULTÉ: ${difficulty}
    INGRÉDIENTS:
    - [ingrédient]
    ÉTAPES:
    1. [étape]
    NUTRITION: Calories: 400, Protéines: 20g, Glucides: 40g, Lipides: 15g
    CONSEIL: [conseil]
    
    Contraintes : Inclure (${Array.from(state.selectedIngredients).join(', ')}), banni (${Array.from(state.excludedIngredients).join(', ')}).`;

    showLoading();

    try {
        const response = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur serveur");

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || data.recipe;
        if (!text) throw new Error("Réponse vide");

        const recipe = parseRecipe(text);
        displayRecipe(recipe);
        addToHistory(recipe);
        showResult();
    } catch (e) {
        alert("Erreur : " + e.message);
        showWelcome();
    }
}

function parseRecipe(text) {
    const lines = text.replace(/\*\*/g, '').split('\n').map(l => l.trim()).filter(l => l);
    const r = { name: '', description: '', cuisine: '', time: '', servings: '', difficulty: '', ingredients: [], steps: [], nutrition: {}, tip: '' };
    let section = '';

    lines.forEach(l => {
        const u = l.toUpperCase();
        if (u.startsWith('NOM:')) r.name = l.substring(4).trim();
        else if (u.startsWith('DESCRIPTION:')) r.description = l.substring(12).trim();
        else if (u.includes('INGRÉDIENTS')) section = 'ing';
        else if (u.includes('ÉTAPES')) section = 'step';
        else if (u.includes('NUTRITION')) section = 'nut';
        else if (u.startsWith('CONSEIL:')) r.tip = l.substring(8).trim();
        else if (section === 'ing' && (l.startsWith('-') || l.startsWith('*'))) r.ingredients.push(l.substring(1).trim());
        else if (section === 'step' && /^\d/.test(l)) r.steps.push(l.replace(/^\d+[\.\)]\s*/, ''));
        else if (section === 'nut' && l.includes(':')) {
            const parts = l.split(':');
            r.nutrition[parts[0].trim()] = parts[1].trim();
        }
    });
    return r;
}

function displayRecipe(r) {
    document.getElementById('recipeName').textContent = r.name;
    document.getElementById('recipeDescription').textContent = r.description;
    document.getElementById('recipeTime').textContent = r.time || '30 min';
    document.getElementById('recipeTip').textContent = r.tip || 'Bon appétit !';
    
    document.getElementById('ingredientsList').innerHTML = r.ingredients.map(i => `<li class="p-2 bg-gray-50 rounded">✔ ${i}</li>`).join('');
    document.getElementById('stepsList').innerHTML = r.steps.map((s, idx) => `
        <div class="flex gap-4 p-4 bg-white border rounded-xl shadow-sm">
            <span class="font-bold text-blue-500">${idx+1}</span><p>${s}</p>
        </div>`).join('');
    
    document.getElementById('nutritionGrid').innerHTML = Object.entries(r.nutrition).map(([k,v]) => `
        <div class="bg-gray-50 p-2 rounded text-center"><div class="text-xs uppercase">${k}</div><div class="font-bold">${v}</div></div>`).join('');
}

function addToHistory(r) {
    state.dishHistory.unshift({ name: r.name, time: r.time, timestamp: new Date().toLocaleTimeString() });
    state.recipeCount++;
    elements.recipeCount.textContent = state.recipeCount;
    elements.historySection.classList.remove('hidden');
    elements.historyList.innerHTML = state.dishHistory.map(d => `<div class="p-3 border-b text-sm"><b>${d.name}</b> (${d.timestamp})</div>`).join('');
}

function showLoading() { elements.welcome.classList.add('hidden'); elements.result.classList.add('hidden'); elements.loading.classList.remove('hidden'); }
function showWelcome() { elements.loading.classList.add('hidden'); elements.result.classList.add('hidden'); elements.welcome.classList.remove('hidden'); }
function showResult() { elements.loading.classList.add('hidden'); elements.welcome.classList.add('hidden'); elements.result.classList.remove('hidden'); elements.result.scrollIntoView(); }

elements.generateBtn.addEventListener('click', generateRecipe);
elements.newDishBtn.addEventListener('click', generateRecipe);
