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
if(elements.ingredientInput) elements.ingredientInput.onkeypress = (e) => handleInput(e, 'sel');
if(elements.excludeInput) elements.excludeInput.onkeypress = (e) => handleInput(e, 'ex');

function renderIngredients() {
    elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(i => `
        <span class="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
            ${i} <button onclick="removeIng('${i}', 'sel')" class="font-bold">×</button>
        </span>`).join('');
    elements.excludedContainer.innerHTML = Array.from(state.excludedIngredients).map(i => `
        <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
            ${i} <button onclick="removeIng('${i}', 'ex')" class="font-bold">×</button>
        </span>`).join('');
}

window.removeIng = (i, t) => {
    if (t === 'sel') state.selectedIngredients.delete(i);
    else state.excludedIngredients.delete(i);
    renderIngredients();
};

async function generateRecipe() {
    const cuisine = document.getElementById('cuisineType')?.value || 'Libre';
    const time = document.getElementById('timeLimit')?.value || '45';
    const diff = document.getElementById('difficulty')?.value || 'Facile';

    const prompt = `Génère une recette de cuisine délicieuse.
    Format de réponse souhaité :
    NOM: [Nom de la recette]
    DESCRIPTION: [Description courte]
    INGRÉDIENTS:
    - [Ingrédient 1]
    - [Ingrédient 2]
    ÉTAPES:
    1. [Étape 1]
    2. [Étape 2]
    CONSEIL: [Astuce du chef]
    
    Contraintes : Cuisine ${cuisine}, max ${time} min, difficulté ${diff}.
    Ingrédients à utiliser : ${Array.from(state.selectedIngredients).join(', ') || 'Libre'}.
    Ingrédients à éviter : ${Array.from(state.excludedIngredients).join(', ') || 'Aucun'}.`;

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
        alert("Oups ! " + err.message);
        showWelcome();
    }
}

function parseRecipe(text) {
    const clean = text.replace(/\*\*/g, '');
    const r = { name: 'Recette Maison', description: '', ingredients: [], steps: [], tip: '' };
    
    const parts = clean.split('\n');
    let currentSection = '';

    parts.forEach(line => {
        const l = line.trim();
        if (!l) return;

        if (l.toUpperCase().startsWith('NOM:')) r.name = l.split(':')[1].trim();
        else if (l.toUpperCase().startsWith('DESCRIPTION:')) r.description = l.split(':')[1].trim();
        else if (l.toUpperCase().includes('INGRÉDIENTS')) currentSection = 'ing';
        else if (l.toUpperCase().includes('ÉTAPES')) currentSection = 'step';
        else if (l.toUpperCase().startsWith('CONSEIL:')) r.tip = l.split(':')[1].trim();
        else if (currentSection === 'ing' && (l.startsWith('-') || l.startsWith('*') || l.startsWith('•'))) {
            r.ingredients.push(l.substring(1).trim());
        } else if (currentSection === 'step' && /^\d/.test(l)) {
            r.steps.push(l.replace(/^\d+[\.\)]\s*/, ''));
        }
    });

    return r;
}

function displayRecipe(r) {
    document.getElementById('dishName').textContent = r.name;
    document.getElementById('dishDescription').textContent = r.description;
    document.getElementById('chefTip').textContent = r.tip || 'Bon appétit !';
    
    document.getElementById('ingredientsList').innerHTML = r.ingredients.map(i => `
        <li class="p-2 border-b border-gray-100 last:border-0">✔ ${i}</li>
    `).join('');
    
    document.getElementById('stepsList').innerHTML = r.steps.map((s, i) => `
        <div class="flex gap-4 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <span class="font-bold text-purple-600">${i+1}.</span>
            <p class="text-gray-700">${s}</p>
        </div>
    `).join('');

    updateHistory(r.name);
    showResult();
}

function updateHistory(name) {
    state.recipeCount++;
    state.dishHistory.unshift({ name, time: new Date().toLocaleTimeString() });
    if (elements.recipeCount) elements.recipeCount.textContent = state.recipeCount;
    if (elements.historyList) {
        elements.historySection.classList.remove('hidden');
        elements.historyList.innerHTML = state.dishHistory.map(h => `
            <div class="p-2 border-b text-sm"><b>${h.name}</b> <span class="text-gray-400">(${h.time})</span></div>
        `).join('');
    }
}

function showLoading() { elements.welcome.classList.add('hidden'); elements.result.classList.add('hidden'); elements.loading.classList.remove('hidden'); }
function showWelcome() { elements.loading.classList.add('hidden'); elements.result.classList.add('hidden'); elements.welcome.classList.remove('hidden'); }
function showResult() { elements.loading.classList.add('hidden'); elements.welcome.classList.add('hidden'); elements.result.classList.remove('hidden'); elements.result.scrollIntoView(); }

elements.generateBtn.onclick = generateRecipe;
elements.newDishBtn.onclick = generateRecipe;

renderIngredients();
