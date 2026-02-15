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

function renderIngredients() {
    elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(i => `
        <span class="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
            ${i} <button onclick="removeTag('${i}', 'sel')">×</button>
        </span>`).join('');
    elements.excludedContainer.innerHTML = Array.from(state.excludedIngredients).map(i => `
        <span class="bg-slate-400 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
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
    // PROMPT ULTRA-SIMPLIFIÉ POUR ÉVITER LES FILTRES
    const prompt = `Crée une recette avec : ${Array.from(state.selectedIngredients).join(', ') || 'ce que tu veux'}. 
    Ne mets pas de : ${Array.from(state.excludedIngredients).join(', ') || 'rien'}.
    
    Structure de réponse simple :
    NOM: [Le nom]
    INFO: [Description]
    LISTE: [Ingrédients avec des -]
    ETAPES: [Etapes avec 1.]
    CONSEIL: [Astuce]`;

    showLoading();

    try {
        const res = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        displayRecipe(parseRecipe(data.recipe));
    } catch (err) {
        alert("Erreur de connexion : " + err.message);
        showWelcome();
    }
}

function parseRecipe(text) {
    // Nettoyage radical du texte
    const clean = text.replace(/\*\*/g, '').replace(/###/g, '');
    const r = { name: 'Recette ChefIA', description: '', ingredients: [], steps: [], tip: '' };
    const lines = clean.split('\n');
    let section = '';

    lines.forEach(l => {
        const line = l.trim();
        if (!line) return;
        const up = line.toUpperCase();

        if (up.startsWith('NOM')) r.name = line.split(':')[1]?.trim() || line;
        else if (up.startsWith('INFO')) r.description = line.split(':')[1]?.trim() || line;
        else if (up.includes('LISTE')) section = 'ing';
        else if (up.includes('ETAPES')) section = 'step';
        else if (up.startsWith('CONSEIL')) r.tip = line.split(':')[1]?.trim() || line;
        else if (section === 'ing' && (line.startsWith('-') || line.startsWith('*'))) {
            r.ingredients.push(line.replace(/^[-*]\s*/, ''));
        } else if (section === 'step' && /^\d/.test(line)) {
            r.steps.push(line.replace(/^\d+[\.\)]\s*/, ''));
        }
    });

    // Sécurité : si le parsing a échoué (IA a changé le format), on met tout dans la description
    if (r.ingredients.length === 0 && r.steps.length === 0) {
        r.description = clean;
    }
    
    return r;
}

function displayRecipe(r) {
    document.getElementById('dishName').textContent = r.name;
    document.getElementById('dishDescription').textContent = r.description;
    document.getElementById('chefTip').textContent = r.tip || 'Bon appétit !';
    
    document.getElementById('ingredientsList').innerHTML = r.ingredients.length > 0 
        ? r.ingredients.map(i => `<li class="p-2 border-b">✔ ${i}</li>`).join('')
        : '<p class="p-2 text-gray-400 text-sm">Voir description</p>';

    document.getElementById('stepsList').innerHTML = r.steps.length > 0
        ? r.steps.map((s, i) => `<div class="p-3 bg-white rounded shadow-sm border-l-4 border-indigo-500 mb-2"><b>${i+1}.</b> ${s}</div>`).join('')
        : '<p class="p-2 text-gray-400 text-sm">La recette complète est affichée ci-dessus.</p>';
    
    state.recipeCount++;
    if(elements.recipeCount) elements.recipeCount.textContent = state.recipeCount;
    showResult();
}

function showLoading() { elements.welcome.classList.add('hidden'); elements.result.classList.add('hidden'); elements.loading.classList.remove('hidden'); }
function showWelcome() { elements.loading.classList.add('hidden'); elements.result.classList.add('hidden'); elements.welcome.classList.remove('hidden'); }
function showResult() { elements.loading.classList.add('hidden'); elements.welcome.classList.add('hidden'); elements.result.classList.remove('hidden'); elements.result.scrollIntoView(); }

elements.generateBtn.onclick = generateRecipe;
elements.newDishBtn.onclick = generateRecipe;
renderIngredients();
