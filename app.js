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
    recipeCount: document.getElementById('recipeCount'),
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList')
};

function renderIngredients() {
    elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(i => `
        <span class="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
            ${i} <button onclick="removeTag('${i}', 'sel')">×</button>
        </span>`).join('');
    elements.excludedContainer.innerHTML = Array.from(state.excludedIngredients).map(i => `
        <span class="bg-rose-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
            ${i} <button onclick="removeTag('${i}', 'ex')">×</button>
        </span>`).join('');
}

window.removeTag = (val, type) => {
    if (type === 'sel') state.selectedIngredients.delete(val);
    else state.excludedIngredients.delete(val);
    renderIngredients();
};

const handleInput = (e, type) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        state[type === 'sel' ? 'selectedIngredients' : 'excludedIngredients'].add(e.target.value.trim().toLowerCase());
        e.target.value = '';
        renderIngredients();
    }
};

if(elements.ingredientInput) elements.ingredientInput.onkeypress = (e) => handleInput(e, 'sel');
if(elements.excludeInput) elements.excludeInput.onkeypress = (e) => handleInput(e, 'ex');

document.querySelectorAll('.quick-add').forEach(btn => {
    btn.onclick = () => {
        const txt = btn.textContent.trim().split(' ').pop().toLowerCase();
        state.selectedIngredients.add(txt);
        renderIngredients();
    };
});

async function generateRecipe() {
    const prompt = `Donne-moi une recette de cuisine.
    Ingrédients disponibles : ${Array.from(state.selectedIngredients).join(', ') || 'Libre'}.
    Ingrédients à éviter : ${Array.from(state.excludedIngredients).join(', ') || 'Aucun'}.
    
    Réponds exactement avec ce plan :
    NOM DU PLAT : [Nom]
    DESCRIPTION : [Description]
    LISTE DES INGRÉDIENTS :
    - [Ingrédient]
    ÉTAPES DE PRÉPARATION :
    1. [Étape]
    CONSEIL DU CHEF : [Astuce]`;

    showLoading();

    try {
        const res = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const recipe = parseRecipe(data.recipe);
        displayRecipe(recipe);
    } catch (err) {
        alert("Erreur : " + err.message);
        showWelcome();
    }
}

function parseRecipe(text) {
    const clean = text.replace(/\*\*/g, ''); 
    const r = { name: 'Recette ChefIA', description: '', ingredients: [], steps: [], tip: '' };
    const lines = clean.split('\n').map(l => l.trim()).filter(l => l);
    let section = '';

    lines.forEach(l => {
        const up = l.toUpperCase();
        if (up.startsWith('NOM DU PLAT')) r.name = l.split(':')[1]?.trim() || l;
        else if (up.startsWith('DESCRIPTION')) r.description = l.split(':')[1]?.trim() || l;
        else if (up.includes('INGRÉDIENTS')) section = 'ing';
        else if (up.includes('PRÉPARATION')) section = 'step';
        else if (up.startsWith('CONSEIL')) r.tip = l.split(':')[1]?.trim() || l;
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
        <div class="p-3 bg-white rounded shadow-sm border-l-4 border-indigo-500 mb-2">
            <b>${i+1}.</b> ${s}
        </div>`).join('');
    
    state.recipeCount++;
    if(elements.recipeCount) elements.recipeCount.textContent = state.recipeCount;
    showResult();
}

function showLoading() { elements.welcome.classList.add('hidden'); elements.result.classList.add('hidden'); elements.loading.classList.remove('hidden'); }
function showWelcome() { elements.loading.classList.add('hidden'); elements.result.classList.add('hidden'); elements.welcome.classList.remove('hidden'); }
function showResult() { elements.loading.classList.add('hidden'); elements.welcome.classList.add('hidden'); elements.result.classList.remove('hidden'); elements.result.scrollIntoView(); }

elements.generateBtn.onclick = generateRecipe;
elements.newDishBtn.onclick = generateRecipe;
