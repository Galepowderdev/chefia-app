const state = {
    selectedIngredients: new Set(),
    excludedIngredients: new Set(),
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
    dishName: document.getElementById('dishName'),
    dishDescription: document.getElementById('dishDescription'),
    ingredientsList: document.getElementById('ingredientsList'),
    stepsList: document.getElementById('stepsList'),
    chefTip: document.getElementById('chefTip')
};

// --- FONCTIONS INTERFACE ---
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

// --- GÉNÉRATION ---
async function generateRecipe() {
    const prompt = `Fais une recette simple avec : ${Array.from(state.selectedIngredients).join(', ')}. 
    Format: NOM: [nom] / INFO: [desc] / LISTE: [- ing] / ETAPES: [1. pas] / CONSEIL: [astuce]`;

    toggleView('loading');

    try {
        const res = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });
        const data = await res.json();

        let recipeData;
        if (data.safetyBlock) {
            // MODE SECOURS : Si l'IA bloque, on crée une recette par défaut
            recipeData = {
                name: "Pâtes Express du Chef",
                description: "Une recette savoureuse prête en quelques minutes.",
                ingredients: ["200g de pâtes", "Huile d'olive", "Sel et poivre"],
                steps: ["Cuire les pâtes dans l'eau bouillante", "Égoutter", "Assaisonner"],
                tip: "Ajoutez un peu de fromage pour plus de gourmandise !"
            };
        } else {
            recipeData = parseTextRecipe(data.recipe);
        }

        displayRecipe(recipeData);
    } catch (err) {
        alert("Erreur réseau");
        toggleView('welcome');
    }
}

function parseTextRecipe(text) {
    const r = { name: "Recette", description: "", ingredients: [], steps: [], tip: "" };
    const lines = text.replace(/\*\*/g, '').split('\n');
    let section = '';
    
    lines.forEach(l => {
        const line = l.trim();
        if (line.toUpperCase().startsWith('NOM')) r.name = line.split(':')[1]?.trim();
        else if (line.toUpperCase().startsWith('INFO')) r.description = line.split(':')[1]?.trim();
        else if (line.toUpperCase().includes('LISTE')) section = 'ing';
        else if (line.toUpperCase().includes('ETAPES')) section = 'step';
        else if (line.toUpperCase().startsWith('CONSEIL')) r.tip = line.split(':')[1]?.trim();
        else if (section === 'ing' && line.startsWith('-')) r.ingredients.push(line.substring(1).trim());
        else if (section === 'step' && /^\d/.test(line)) r.steps.push(line.replace(/^\d+[\.\)]\s*/, ''));
    });
    return r;
}

function displayRecipe(r) {
    elements.dishName.textContent = r.name;
    elements.dishDescription.textContent = r.description;
    elements.chefTip.textContent = r.tip;
    elements.ingredientsList.innerHTML = r.ingredients.map(i => `<li class="p-2 border-b">✔ ${i}</li>`).join('');
    elements.stepsList.innerHTML = r.steps.map((s, i) => `<div class="p-3 bg-white rounded shadow-sm border-l-4 border-indigo-500 mb-2"><b>${i+1}.</b> ${s}</div>`).join('');
    
    state.recipeCount++;
    elements.recipeCount.textContent = state.recipeCount;
    toggleView('result');
}

function toggleView(view) {
    elements.welcome.classList.toggle('hidden', view !== 'welcome');
    elements.loading.classList.toggle('hidden', view !== 'loading');
    elements.result.classList.toggle('hidden', view !== 'result');
    if(view === 'result') elements.result.scrollIntoView({ behavior: 'smooth' });
}

// --- INITIALISATION ---
elements.ingredientInput.onkeypress = (e) => handleInput(e, 'sel');
elements.excludeInput.onkeypress = (e) => handleInput(e, 'ex');
elements.generateBtn.onclick = generateRecipe;
elements.newDishBtn.onclick = generateRecipe;

document.querySelectorAll('.quick-add').forEach(btn => {
    btn.onclick = () => {
        state.selectedIngredients.add(btn.textContent.trim().split(' ').pop().toLowerCase());
        renderIngredients();
    };
});
