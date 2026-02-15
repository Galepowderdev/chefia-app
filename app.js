const state = { selectedIngredients: new Set(), excludedIngredients: new Set(), recipeCount: 0 };

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

function renderIngredients() {
    elements.selectedContainer.innerHTML = Array.from(state.selectedIngredients).map(i => `
        <span class="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">${i} 
        <button onclick="window.removeTag('${i}', 'sel')">×</button></span>`).join('');
    elements.excludedContainer.innerHTML = Array.from(state.excludedIngredients).map(i => `
        <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">${i} 
        <button onclick="window.removeTag('${i}', 'ex')">×</button></span>`).join('');
}

window.removeTag = (val, type) => {
    if (type === 'sel') state.selectedIngredients.delete(val);
    else state.excludedIngredients.delete(val);
    renderIngredients();
};

async function generateRecipe() {
    if (state.selectedIngredients.size === 0) {
        alert("Ajoute au moins un ingrédient !");
        return;
    }

    const prompt = `En tant que Chef cuisinier expert, crée une recette précise.
    Ingrédients : ${Array.from(state.selectedIngredients).join(', ')}.
    Exclure : ${Array.from(state.excludedIngredients).join(', ')}.
    
    Réponds EXCLUSIVEMENT sous ce format JSON :
    {
      "nom": "Nom précis de la recette",
      "description": "Description alléchante",
      "ingredients": ["Quantité + Ingrédient 1", "Quantité + Ingrédient 2"],
      "etapes": ["Etape 1 détaillée", "Etape 2 détaillée"],
      "nutrition": { "cal": "Nombre kcal", "prot": "Nombre g", "glu": "Nombre g" },
      "conseil": "Astuce de pro"
    }`;

    elements.welcome.classList.add('hidden');
    elements.result.classList.add('hidden');
    elements.loading.classList.remove('hidden');

    try {
        const res = await fetch('/.netlify/functions/generate-recipe', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });
        
        const data = await res.json();
        const r = JSON.parse(data.recipe);

        // Remplissage des champs
        elements.dishName.textContent = r.nom;
        
        // Affichage Description + Valeurs Nutritionnelles
        elements.dishDescription.innerHTML = `
            <p class="mb-4">${r.description}</p>
            <div class="flex flex-wrap gap-3 bg-indigo-50 p-4 rounded-2xl justify-center text-indigo-800 font-bold border border-indigo-100">
                <div class="flex flex-col"> <span class="text-xs text-indigo-400 uppercase">Énergie</span> <span>🔥 ${r.nutrition.cal}</span> </div>
                <div class="w-[1px] bg-indigo-200"></div>
                <div class="flex flex-col"> <span class="text-xs text-indigo-400 uppercase">Protéines</span> <span>💪 ${r.nutrition.prot}</span> </div>
                <div class="w-[1px] bg-indigo-200"></div>
                <div class="flex flex-col"> <span class="text-xs text-indigo-400 uppercase">Glucides</span> <span>🍞 ${r.nutrition.glu}</span> </div>
            </div>`;

        elements.ingredientsList.innerHTML = r.ingredients.map(i => `<li class="p-3 border-b border-indigo-50 flex items-center gap-2"><span class="text-indigo-500">◈</span> ${i}</li>`).join('');
        elements.stepsList.innerHTML = r.etapes.map((s, i) => `<div class="p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 flex gap-3">
            <span class="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">${i+1}</span>
            <p class="text-gray-700">${s}</p></div>`).join('');
        elements.chefTip.innerHTML = `<strong>💡 Conseil du Chef :</strong> ${r.conseil}`;

        state.recipeCount++;
        elements.recipeCount.textContent = state.recipeCount;

        elements.loading.classList.add('hidden');
        elements.result.classList.remove('hidden');
        elements.result.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        console.error(err);
        alert("L'IA a eu un petit vertige. Réessaie !");
        elements.loading.classList.add('hidden');
        elements.welcome.classList.remove('hidden');
    }
}

// Boutons
elements.generateBtn.onclick = generateRecipe;
elements.newDishBtn.onclick = generateRecipe;

elements.ingredientInput.onkeypress = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        state.selectedIngredients.add(e.target.value.trim().toLowerCase());
        e.target.value = '';
        renderIngredients();
    }
};

document.querySelectorAll('.quick-add').forEach(btn => {
    btn.onclick = () => {
        const text = btn.innerText.split(' ').pop().toLowerCase();
        state.selectedIngredients.add(text);
        renderIngredients();
    };
});
