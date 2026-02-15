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
    recipeCount: document.getElementById('recipeCount')
};

// Gestion des tags (Ajout/Suppression)
function renderIngredients() {
    elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(i => `
        <span class="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
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

const handleInput = (e, type) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        state[type === 'sel' ? 'selectedIngredients' : 'excludedIngredients'].add(e.target.value.trim().toLowerCase());
        e.target.value = '';
        renderIngredients();
    }
};

elements.ingredientInput.onkeypress = (e) => handleInput(e, 'sel');
elements.excludeInput.onkeypress = (e) => handleInput(e, 'ex');

async function generateRecipe() {
    // LE PROMPT EN FORMAT JSON (Le plus stable au monde)
    const prompt = `Génère une recette de cuisine avec ces ingrédients : ${Array.from(state.selectedIngredients).join(', ') || 'choix libre'}. 
    Exclus : ${Array.from(state.excludedIngredients).join(', ') || 'aucun'}.
    Réponds uniquement par un objet JSON avec ces clés : "nom", "description", "ingredients" (tableau), "etapes" (tableau), "conseil".`;

    showLoading();

    try {
        const res = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // On parse le JSON renvoyé par l'IA
        const recipe = JSON.parse(data.recipe);
        displayRecipe(recipe);
    } catch (err) {
        alert("Note : Si l'IA bloque, essayez de retirer certains ingrédients sensibles (alcool, etc.)");
        showWelcome();
    }
}

function displayRecipe(r) {
    document.getElementById('dishName').textContent = r.nom || 'Recette Maison';
    document.getElementById('dishDescription').textContent = r.description || '';
    document.getElementById('chefTip').textContent = r.conseil || 'Bon appétit !';
    
    document.getElementById('ingredientsList').innerHTML = (r.ingredients || []).map(i => `
        <li class="p-2 border-b">✔ ${i}</li>`).join('');
    
    document.getElementById('stepsList').innerHTML = (r.etapes || []).map((s, i) => `
        <div class="p-3 bg-white rounded shadow-sm border-l-4 border-indigo-500 mb-2">
            <b>${i+1}.</b> ${s}
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
