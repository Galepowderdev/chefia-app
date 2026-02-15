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
    loading: document.getElementById('loading'),
    welcome: document.getElementById('welcome'),
    result: document.getElementById('result'),
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList'),
    recipeCount: document.getElementById('recipeCount'),
    uniqueCount: document.getElementById('uniqueCount')
};

// Gestion des ingrédients
document.querySelectorAll('.quick-add').forEach(btn => {
    btn.onclick = () => {
        const txt = btn.textContent.trim().split(' ').pop().toLowerCase();
        state.selectedIngredients.add(txt);
        renderIngredients();
    };
});

function handleInput(e, type) {
    if (e.key === 'Enter' && e.target.value.trim()) {
        const val = e.target.value.trim().toLowerCase();
        if (type === 'sel') state.selectedIngredients.add(val);
        else state.excludedIngredients.add(val);
        e.target.value = '';
        renderIngredients();
    }
}
elements.ingredientInput.onkeypress = (e) => handleInput(e, 'sel');
elements.excludeInput.onkeypress = (e) => handleInput(e, 'ex');

function renderIngredients() {
    elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(i => `
        <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            ${i} <button onclick="removeIng('${i}', 'sel')">×</button>
        </span>`).join('');
    elements.excludedContainer.innerHTML = Array.from(state.excludedIngredients).map(i => `
        <span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            ${i} <button onclick="removeIng('${i}', 'ex')">×</button>
        </span>`).join('');
}

window.removeIng = (i, t) => {
    if (t === 'sel') state.selectedIngredients.delete(i);
    else state.excludedIngredients.delete(i);
    renderIngredients();
};

// Génération
async function generateRecipe() {
    // RÉCUPÉRATION DES FILTRES DEPUIS INDEX.HTML
    const cuisine = document.getElementById('cuisineType')?.value || 'Libre';
    const time = document.getElementById('timeLimit')?.value || '45';
    const diff = document.getElementById('difficulty')?.value || 'Facile';

    const prompt = `Génère une recette. Format STRICT : NOM:, DESCRIPTION:, CUISINE:, TEMPS:, PORTIONS: 4, DIFFICULTÉ:, INGRÉDIENTS: (avec -), ÉTAPES: (avec 1.), NUTRITION:, CONSEIL:.
    Cuisine: ${cuisine}, Temps: ${time}min, Difficulté: ${diff}.
    Inclus: ${Array.from(state.selectedIngredients).join(', ')}.
    Exclus: ${Array.from(state.excludedIngredients).join(', ')}.`;

    showLoading();

    try {
        const res = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur serveur");

        displayRecipe(parseRecipe(data.recipe));
    } catch (err) {
        alert("Erreur : " + err.message);
        showWelcome();
    }
}

function parseRecipe(text) {
    const lines = text.replace(/\*\*/g, '').split('\n').map(l => l.trim()).filter(l => l);
    const r = { name: 'Recette', description: '', time: '', ingredients: [], steps: [], nutrition: {}, tip: '' };
    let sec = '';

    lines.forEach(l => {
        const u = l.toUpperCase();
        if (u.startsWith('NOM:')) r.name = l.substring(4).trim();
        else if (u.startsWith('DESCRIPTION:')) r.description = l.substring(12).trim();
        else if (u.includes('INGRÉDIENTS')) sec = 'ing';
        else if (u.includes('ÉTAPES')) sec = 'step';
        else if (u.includes('NUTRITION')) sec = 'nut';
        else if (u.startsWith('CONSEIL:')) r.tip = l.substring(8).trim();
        else if (sec === 'ing' && (l.startsWith('-') || l.startsWith('•') || l.startsWith('*'))) r.ingredients.push(l.substring(1).trim());
        else if (sec === 'step' && /^\d/.test(l)) r.steps.push(l.replace(/^\d+[\.\)]\s*/, ''));
        else if (sec === 'nut' && l.includes(':')) {
            const p = l.split(':');
            r.nutrition[p[0].trim()] = p[1].trim();
        }
    });
    return r;
}

function displayRecipe(r) {
    document.getElementById('dishName').textContent = r.name;
    document.getElementById('dishDescription').textContent = r.description;
    document.getElementById('prepTime').textContent = r.time || '30 min';
    document.getElementById('chefTip').textContent = r.tip || 'Bon appétit !';
    
    document.getElementById('ingredientsList').innerHTML = r.ingredients.map(i => `<li class="p-2 bg-gray-50 rounded">✔ ${i}</li>`).join('');
    document.getElementById('stepsList').innerHTML = r.steps.map((s, i) => `
        <div class="flex gap-4 p-4 border rounded-xl shadow-sm">
            <b class="text-blue-500">${i+1}</b><p>${s}</p>
        </div>`).join('');

    addToHistory(r);
    showResult();
}

function addToHistory(r) {
    state.dishHistory.unshift({ name: r.name, timestamp: new Date().toLocaleTimeString() });
    state.recipeCount++;
    elements.recipeCount.textContent = state.recipeCount;
    elements.historySection.classList.remove('hidden');
    elements.historyList.innerHTML = state.dishHistory.map(d => `<div class="p-3 border-b text-sm"><b>${d.name}</b> (${d.timestamp})</div>`).join('');
}

function showLoading() { elements.welcome.classList.add('hidden'); elements.result.classList.add('hidden'); elements.loading.classList.remove('hidden'); }
function showWelcome() { elements.loading.classList.add('hidden'); elements.result.classList.add('hidden'); elements.welcome.classList.remove('hidden'); }
function showResult() { elements.loading.classList.add('hidden'); elements.welcome.classList.add('hidden'); elements.result.classList.remove('hidden'); elements.result.scrollIntoView(); }

elements.generateBtn.onclick = generateRecipe;
elements.newDishBtn.onclick = generateRecipe;
