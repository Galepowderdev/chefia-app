// État
const state = {
    selectedIngredients: new Set(),
    excludedIngredients: new Set(),
    dishHistory: [],
    recipeCount: 0,
    uniqueDishes: new Set()
};

// Éléments
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

// --- GÉNÉRATION ---
async function generateRecipe() {
    const cuisine = document.getElementById('cuisine-type')?.value || 'Maison';
    const time = document.getElementById('prep-time')?.value || '45';
    const diff = document.getElementById('difficulty-level')?.value || 'Facile';

    const prompt = `Génère une recette de cuisine.
    Type: ${cuisine}, Temps: ${time}min, Difficulté: ${diff}.
    Inclus: ${Array.from(state.selectedIngredients).join(', ')}.
    Exclus: ${Array.from(state.excludedIngredients).join(', ')}.
    Format STRICT: NOM:, DESCRIPTION:, CUISINE:, TEMPS:, PORTIONS:, DIFFICULTÉ:, INGRÉDIENTS: (avec -), ÉTAPES: (avec 1.), NUTRITION:, CONSEIL:.`;

    showLoading();

    try {
        const res = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || data.error || "Erreur API");

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Réponse vide de l'IA");

        const recipe = parseRecipe(text);
        displayRecipe(recipe);
        addToHistory(recipe);
        showResult();
    } catch (err) {
        alert("Erreur de génération : " + err.message);
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
        else if (sec === 'ing' && (l.startsWith('-') || l.startsWith('*'))) r.ingredients.push(l.substring(1).trim());
        else if (sec === 'step' && /^\d/.test(l)) r.steps.push(l.replace(/^\d+[\.\)]\s*/, ''));
        else if (sec === 'nut' && l.includes(':')) {
            const [k, v] = l.split(':');
            r.nutrition[k.trim()] = v.trim();
        }
    });
    return r;
}

function displayRecipe(r) {
    document.getElementById('recipeName').textContent = r.name;
    document.getElementById('recipeDescription').textContent = r.description;
    document.getElementById('recipeTime').textContent = r.time || '30 min';
    document.getElementById('recipeTip').textContent = r.tip || 'Régalez-vous !';
    document.getElementById('ingredientsList').innerHTML = r.ingredients.map(i => `<li class="p-2 bg-gray-50 rounded">✔ ${i}</li>`).join('');
    document.getElementById('stepsList').innerHTML = r.steps.map((s, i) => `<div class="flex gap-4 p-4 border rounded-xl shadow-sm"><b class="text-blue-500">${i+1}</b><p>${s}</p></div>`).join('');
    document.getElementById('nutritionGrid').innerHTML = Object.entries(r.nutrition).map(([k,v]) => `<div class="bg-gray-50 p-2 rounded text-center"><div class="text-xs uppercase">${k}</div><b>${v}</b></div>`).join('');
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

elements.generateBtn.onclick = generateRecipe;
elements.newDishBtn.onclick = generateRecipe;
elements.clearHistory.onclick = () => { state.dishHistory = []; elements.historySection.classList.add('hidden'); };

renderIngredients();
