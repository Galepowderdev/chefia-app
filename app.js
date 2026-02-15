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
    uniqueCount: document.getElementById('uniqueCount')
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
    elements.selectedContainer.innerHTML = state.selectedIngredients.size === 0 ? '<span class="text-gray-400 text-sm">Ajoutez vos ingrédients...</span>' : '';
    state.selectedIngredients.forEach(ing => {
        elements.selectedContainer.appendChild(createTag(ing, 'green', () => { state.selectedIngredients.delete(ing); renderIngredients(); }));
    });

    elements.excludedContainer.innerHTML = state.excludedIngredients.size === 0 ? '<span class="text-gray-400 text-sm">Aucune restriction</span>' : '';
    state.excludedIngredients.forEach(ing => {
        elements.excludedContainer.appendChild(createTag(ing, 'red', () => { state.excludedIngredients.delete(ing); renderIngredients(); }));
    });
}

function createTag(text, color, onRemove) {
    const tag = document.createElement('div');
    const colorClass = color === 'green' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500';
    tag.className = `inline-flex items-center gap-2 px-4 py-2 rounded-full ${colorClass} text-white cursor-pointer shadow-md font-medium text-sm`;
    tag.innerHTML = `<span>${text}</span><span class="hover:bg-white/30 rounded-full w-5 h-5 flex items-center justify-center">×</span>`;
    tag.onclick = onRemove;
    return tag;
}

// --- GÉNÉRATION ---
async function generateRecipe() {
    showLoading();
    try {
        // On récupère les valeurs des selects du HTML
        const cuisine = document.getElementById('cuisineType')?.value || 'Libre';
        const time = document.getElementById('timeLimit')?.value || '45';
        const diff = document.getElementById('difficulty')?.value || 'Intermédiaire';

        const prompt = `NOM:, DESCRIPTION:, CUISINE:, TEMPS:, PORTIONS:, DIFFICULTÉ:, INGRÉDIENTS: (avec •), ÉTAPES: (avec 1.), NUTRITION:, CONSEIL:. Cuisine: ${cuisine}, Temps: ${time}min, Difficulté: ${diff}. Ingrédients: ${Array.from(state.selectedIngredients).join(', ')}. Exclus: ${Array.from(state.excludedIngredients).join(', ')}.`;

        const response = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        
        const parsed = parseRecipe(data.recipe);
        displayRecipe(parsed);
        updateStats();
    } catch (error) {
        alert('Erreur: ' + error.message);
        showWelcome();
    }
}

function parseRecipe(text) {
    const clean = text.replace(/\*\*/g, '');
    const lines = clean.split('\n').map(l => l.trim()).filter(l => l);
    const r = { name: '', description: '', cuisine: '', time: '', servings: '', difficulty: '', ingredients: [], steps: [], nutrition: {}, tip: '' };
    let section = '';

    lines.forEach(l => {
        if (l.startsWith('NOM:')) r.name = l.replace('NOM:', '').trim();
        else if (l.startsWith('DESCRIPTION:')) r.description = l.replace('DESCRIPTION:', '').trim();
        else if (l.startsWith('CUISINE:')) r.cuisine = l.replace('CUISINE:', '').trim();
        else if (l.startsWith('TEMPS:')) r.time = l.replace('TEMPS:', '').trim();
        else if (l.startsWith('PORTIONS:')) r.servings = l.replace('PORTIONS:', '').trim();
        else if (l.startsWith('DIFFICULTÉ:')) r.difficulty = l.replace('DIFFICULTÉ:', '').trim();
        else if (l.includes('INGRÉDIENTS')) section = 'ing';
        else if (l.includes('ÉTAPES')) section = 'step';
        else if (l.includes('NUTRITION')) section = 'nut';
        else if (l.startsWith('CONSEIL:')) r.tip = l.replace('CONSEIL:', '').trim();
        else {
            if (section === 'ing' && (l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))) r.ingredients.push(l.replace(/^[•\-*]\s*/, ''));
            else if (section === 'step' && /^\d/.test(l)) r.steps.push(l.replace(/^\d+[\.):]\s*/, ''));
            else if (section === 'nut' && l.includes(':')) {
                const parts = l.split(':');
                r.nutrition[parts[0].trim()] = parts[1].trim();
            }
        }
    });
    return r;
}

function displayRecipe(r) {
    document.getElementById('dishName').textContent = r.name || 'Recette Mystère';
    document.getElementById('dishDescription').textContent = r.description;
    document.getElementById('prepTime').textContent = r.time || '30 min';
    document.getElementById('chefTip').textContent = r.tip || 'Régalez-vous !';
    
    document.getElementById('ingredientsList').innerHTML = r.ingredients.map(i => `<li class="p-3 bg-gray-50 rounded-lg">✓ ${i}</li>`).join('');
    document.getElementById('stepsList').innerHTML = r.steps.map((s, i) => `
        <div class="flex gap-4 p-4 bg-purple-50 rounded-xl">
            <div class="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0">${i+1}</div>
            <p>${s}</p>
        </div>`).join('');

    addToHistory(r);
    showResult();
}

function addToHistory(r) {
    state.dishHistory.unshift({ name: r.name, cuisine: r.cuisine, time: r.time, timestamp: new Date().toLocaleTimeString() });
    state.uniqueDishes.add(r.name);
    const historyList = document.getElementById('historyList');
    if(historyList) {
        elements.historySection.classList.remove('hidden');
        historyList.innerHTML = state.dishHistory.map(d => `<div class="p-4 border rounded-xl mb-2"><b>${d.name}</b> - ${d.timestamp}</div>`).join('');
    }
}

function updateStats() {
    state.recipeCount++;
    elements.recipeCount.textContent = state.recipeCount;
    elements.uniqueCount.textContent = state.uniqueDishes.size;
}

function showLoading() { elements.welcome.classList.add('hidden'); elements.result.classList.add('hidden'); elements.loading.classList.remove('hidden'); }
function showWelcome() { elements.loading.classList.add('hidden'); elements.result.classList.add('hidden'); elements.welcome.classList.remove('hidden'); }
function showResult() { elements.loading.classList.add('hidden'); elements.welcome.classList.add('hidden'); elements.result.classList.remove('hidden'); elements.result.scrollIntoView({ behavior: 'smooth' }); }

elements.generateBtn.addEventListener('click', generateRecipe);
elements.newDishBtn.addEventListener('click', generateRecipe);
renderIngredients();
