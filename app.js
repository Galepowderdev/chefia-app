const state = {
    selectedIngredients: new Set(),
    excludedIngredients: new Set(),
    dishHistory: [],
    recipeCount: 0
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
    recipeCount: document.getElementById('recipeCount')
};

// --- GESTION DES TAGS ---
function renderIngredients() {
    elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(i => `
        <span class="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            ${i} <button onclick="removeTag('${i}', 'sel')">×</button>
        </span>`).join('');
    elements.excludedContainer.innerHTML = Array.from(state.excludedIngredients).map(i => `
        <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            ${i} <button onclick="removeTag('${i}', 'ex')">×</button>
        </span>`).join('');
}

window.removeTag = (val, type) => {
    if (type === 'sel') state.selectedIngredients.delete(val);
    else state.excludedIngredients.delete(val);
    renderIngredients();
};

const handleAdd = (e, type) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        const val = e.target.value.trim().toLowerCase();
        if (type === 'sel') state.selectedIngredients.add(val);
        else state.excludedIngredients.add(val);
        e.target.value = '';
        renderIngredients();
    }
};

elements.ingredientInput.onkeypress = (e) => handleAdd(e, 'sel');
elements.excludeInput.onkeypress = (e) => handleAdd(e, 'ex');

document.querySelectorAll('.quick-add').forEach(btn => {
    btn.onclick = () => {
        const txt = btn.textContent.trim().split(' ').pop().toLowerCase();
        state.selectedIngredients.add(txt);
        renderIngredients();
    };
});

// --- GÉNÉRATION ---
async function generateRecipe() {
    const cuisine = document.getElementById('cuisineType')?.value || 'Maison';
    const time = document.getElementById('timeLimit')?.value || '45';

    const prompt = `Crée une recette simple.
    Inclus: ${Array.from(state.selectedIngredients).join(', ') || 'Libre'}.
    Bannis: ${Array.from(state.excludedIngredients).join(', ') || 'Aucun'}.
    Style: ${cuisine}, Temps: ${time}min.
    
    Réponds exactement avec ce plan:
    NOM: [Le nom]
    DESCRIPTION: [Le texte]
    INGRÉDIENTS:
    - [Ingrédient]
    ÉTAPES:
    1. [Étape]
    CONSEIL: [Astuce]`;

    showLoading();

    try {
        const res = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur serveur");

        const recipe = parseRecipe(data.recipe);
        displayRecipe(recipe);
    } catch (err) {
        alert("Erreur : " + err.message);
        showWelcome();
    }
}

function parseRecipe(text) {
    const clean = text.replace(/\*\*/g, '');
    const r = { name: 'Ma Recette', description: '', ingredients: [], steps: [], tip: '' };
    const lines = clean.split('\n');
    let section = '';

    lines.forEach(line => {
        const l = line.trim();
        if (!l) return;
        const up = l.toUpperCase();

        if (up.startsWith('NOM:')) r.name = l.split(':')[1].trim();
        else if (up.startsWith('DESCRIPTION:')) r.description = l.split(':')[1].trim();
        else if (up.includes('INGRÉDIENTS')) section = 'ing';
        else if (up.includes('ÉTAPES')) section = 'step';
        else if (up.startsWith('CONSEIL:')) r.tip = l.split(':')[1].trim();
        else if (section === 'ing' && (l.startsWith('-') || l.startsWith('*'))) r.ingredients.push(l.substring(1).trim());
        else if (section === 'step' && /^\d/.test(l)) r.steps.push(l.replace(/^\d+[\.\)]\s*/, ''));
    });
    return r;
}

function displayRecipe(r) {
    document.getElementById('dishName').textContent = r.name;
    document.getElementById('dishDescription').textContent = r.description;
    document.getElementById('chefTip').textContent = r.tip || 'Bon appétit !';
    document.getElementById('ingredientsList').innerHTML = r.ingredients.map(i => `<li class="p-2 border-b">✔ ${i}</li>`).join('');
    document.getElementById('stepsList').innerHTML = r.steps.map((s, i) => `
        <div class="mb-4 p-3 bg-white rounded shadow-sm border-l-4 border-purple-500">
            <strong>${i+1}.</strong> ${s}
        </div>`).join('');
    
    state.recipeCount++;
    elements.recipeCount.textContent = state.recipeCount;
    showResult();
}

function showLoading() { elements.welcome.classList.add('hidden'); elements.result.classList.add('hidden'); elements.loading.classList.remove('hidden'); }
function showWelcome() { elements.loading.classList.add('hidden'); elements.result.classList.add('hidden'); elements.welcome.classList.remove('hidden'); }
function showResult() { elements.loading.classList.add('hidden'); elements.welcome.classList.add('hidden'); elements.result.classList.remove('hidden'); elements.result.scrollIntoView(); }

elements.generateBtn.onclick = generateRecipe;
elements.newDishBtn.onclick = generateRecipe;
renderIngredients();
