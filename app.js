// --- ÉTAT DE L'APPLICATION ---
const state = {
    selectedIngredients: new Set(),
    excludedIngredients: new Set(),
    recipeCount: 0
};

// --- ÉLÉMENTS DU DOM ---
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
    // IDs pour l'affichage de la recette
    dishName: document.getElementById('dishName'),
    dishDescription: document.getElementById('dishDescription'),
    ingredientsList: document.getElementById('ingredientsList'),
    stepsList: document.getElementById('stepsList'),
    chefTip: document.getElementById('chefTip')
};

// --- GESTION DES INGRÉDIENTS ---

function renderIngredients() {
    if (elements.selectedContainer) {
        elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(i => `
            <span class="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                ${i} <button onclick="removeTag('${i}', 'sel')" class="font-bold hover:text-gray-200">×</button>
            </span>`).join('');
    }
    if (elements.excludedContainer) {
        elements.excludedContainer.innerHTML = Array.from(state.excludedIngredients).map(i => `
            <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                ${i} <button onclick="removeTag('${i}', 'ex')" class="font-bold hover:text-gray-200">×</button>
            </span>`).join('');
    }
}

window.removeTag = (val, type) => {
    if (type === 'sel') state.selectedIngredients.delete(val);
    else state.excludedIngredients.delete(val);
    renderIngredients();
};

const handleInput = (e, type) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        const val = e.target.value.trim().toLowerCase();
        if (type === 'sel') state.selectedIngredients.add(val);
        else state.excludedIngredients.add(val);
        e.target.value = '';
        renderIngredients();
    }
};

// --- NAVIGATION ET AFFICHAGE ---

function showLoading() {
    elements.welcome?.classList.add('hidden');
    elements.result?.classList.add('hidden');
    elements.loading?.classList.remove('hidden');
}

function showWelcome() {
    elements.loading?.classList.add('hidden');
    elements.result?.classList.add('hidden');
    elements.welcome?.classList.remove('hidden');
}

function showResult() {
    elements.loading?.classList.add('hidden');
    elements.welcome?.classList.add('hidden');
    elements.result?.classList.remove('hidden');
    elements.result?.scrollIntoView({ behavior: 'smooth' });
}

// --- GÉNÉRATION DE LA RECETTE ---

async function generateRecipe() {
    const ingredients = Array.from(state.selectedIngredients).join(', ') || 'choix libre';
    const exclus = Array.from(state.excludedIngredients).join(', ') || 'aucun';

    // Prompt optimisé pour le format JSON
    const prompt = `Génère une recette de cuisine délicieuse. 
    Ingrédients à utiliser : ${ingredients}. 
    Ingrédients à bannir : ${exclus}.
    Réponds EXCLUSIVEMENT sous ce format JSON :
    {
      "nom": "nom du plat",
      "description": "brève description",
      "ingredients": ["ingrédient 1", "ingrédient 2"],
      "etapes": ["étape 1", "étape 2"],
      "conseil": "astuce du chef"
    }`;

    showLoading();

    try {
        const res = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!res.ok) throw new Error("Erreur réseau ou sécurité");

        const data = await res.json();
        const recipe = JSON.parse(data.recipe);

        // Remplissage des données
        if (elements.dishName) elements.dishName.textContent = recipe.nom;
        if (elements.dishDescription) elements.dishDescription.textContent = recipe.description;
        if (elements.chefTip) elements.chefTip.textContent = recipe.conseil;
        
        if (elements.ingredientsList) {
            elements.ingredientsList.innerHTML = recipe.ingredients.map(i => `<li class="p-2 border-b">✔ ${i}</li>`).join('');
        }
        
        if (elements.stepsList) {
            elements.stepsList.innerHTML = recipe.etapes.map((s, i) => `
                <div class="p-3 bg-white rounded shadow-sm border-l-4 border-indigo-500 mb-2">
                    <b>${i+1}.</b> ${s}
                </div>`).join('');
        }

        state.recipeCount++;
        if (elements.recipeCount) elements.recipeCount.textContent = state.recipeCount;
        
        showResult();

    } catch (err) {
        console.error(err);
        alert("L'IA a rencontré un problème de sécurité avec ces ingrédients. Essayez d'en retirer certains.");
        showWelcome();
    }
}

// --- INITIALISATION DES ÉVÉNEMENTS ---

// Inputs
if (elements.ingredientInput) elements.ingredientInput.onkeypress = (e) => handleInput(e, 'sel');
if (elements.excludeInput) elements.excludeInput.onkeypress = (e) => handleInput(e, 'ex');

// Boutons
if (elements.generateBtn) elements.generateBtn.onclick = generateRecipe;
if (elements.newDishBtn) elements.newDishBtn.onclick = generateRecipe;

// Quick Add (Boutons d'ajout rapide)
document.querySelectorAll('.quick-add').forEach(btn => {
    btn.onclick = () => {
        // On récupère le texte après l'émoji (ex: "🍎 Pomme" -> "pomme")
        const txt = btn.textContent.trim().split(' ').pop().toLowerCase();
        state.selectedIngredients.add(txt);
        renderIngredients();
    };
});

// Lancement initial
renderIngredients();
