# 🍳 ChefIA - Assistant Culinaire Intelligent

Application web qui génère des recettes personnalisées infinies grâce à l'IA Google Gemini.

## 🚀 Déploiement sur Netlify (100% GRATUIT - SANS CARTE BANCAIRE!)

### Étape 1 : Obtenir une clé API Google Gemini (GRATUIT !)

1. Allez sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "**Create API Key**"
4. Sélectionnez "**Create API key in new project**" (ou choisissez un projet existant)
5. **Copiez la clé** (format : AIza...)

💡 **100% GRATUIT** : 
- ✅ Pas de carte bancaire nécessaire
- ✅ 60 requêtes par minute gratuites
- ✅ 1500 requêtes par jour gratuites
- ✅ Pour toujours !

### Étape 2 : Préparer le projet

1. Créez un compte GitHub gratuit sur [github.com](https://github.com)
2. Créez un nouveau repository (dépôt)
3. Uploadez tous les fichiers de ce projet :
   - index.html
   - app.js
   - netlify.toml
   - netlify/functions/generate-recipe.js

### Étape 3 : Déployer sur Netlify

1. Créez un compte gratuit sur [netlify.com](https://netlify.com)
2. Cliquez sur "Add new site" → "Import an existing project"
3. Connectez votre compte GitHub
4. Sélectionnez votre repository
5. Cliquez sur "Deploy site"

### Étape 4 : Configurer la clé API (CRUCIAL !)

1. Dans Netlify, allez dans : **Site settings** → **Environment variables**
2. Cliquez sur "Add a variable"
3. Créez une variable :
   - **Key** : `GEMINI_API_KEY`
   - **Value** : Collez votre clé API Google Gemini (AIza...)
4. Cliquez sur "Save"
5. Allez dans **Deploys** → Cliquez sur "Trigger deploy" → "Clear cache and deploy site"

### ✅ C'est terminé !

Votre application est maintenant en ligne ! Netlify vous donne une URL gratuite comme : `https://votre-app.netlify.app`

---

## 🎯 Alternatives GRATUITES à Netlify

### Option 2 : Vercel
1. Compte gratuit sur [vercel.com](https://vercel.com)
2. Importez votre projet GitHub
3. Ajoutez la variable d'environnement `GEMINI_API_KEY`
4. Déployez !

### Option 3 : Cloudflare Pages + Workers
1. Compte gratuit sur [cloudflare.com](https://cloudflare.com)
2. Créez une Cloudflare Page
3. Utilisez Cloudflare Workers pour l'API
4. **Limites généreuses** : 100,000 requêtes/jour gratuites !

---

## 📊 Coûts : 0€ POUR TOUJOURS !

### API Google Gemini
- **100% GRATUIT** sans carte bancaire
- 60 requêtes par minute
- 1500 requêtes par jour
- **Illimité dans le temps !**

### Hébergement
- **Netlify** : 100% gratuit (100GB bande passante/mois)
- **Vercel** : 100% gratuit (100GB bande passante/mois)
- **Cloudflare** : 100% gratuit (bande passante illimitée)

### 🎉 TOTAL : 0€ - Vraiment gratuit !

---

## 🛠️ Structure du Projet

```
chefIA/
├── index.html              # Page principale
├── app.js                  # Logique frontend
├── netlify.toml           # Configuration Netlify
└── netlify/
    └── functions/
        └── generate-recipe.js  # Fonction serverless (API Google Gemini)
```

---

## 🔐 Sécurité

✅ **Votre clé API est protégée** :
- Elle est stockée côté serveur (Netlify)
- Jamais exposée dans le code frontend
- Jamais visible dans le navigateur de l'utilisateur

---

## 📝 Notes Importantes

1. **Ne commitez JAMAIS votre clé API** dans GitHub
2. Utilisez toujours les variables d'environnement
3. Les quotas gratuits de Google Gemini sont très généreux
4. Pas besoin de carte bancaire, jamais !

---

## 💡 Fonctionnalités

✨ Recettes personnalisées infinies
🎯 Filtres avancés (cuisine, temps, difficulté)
🚫 Gestion des allergies et restrictions
📊 Informations nutritionnelles
💾 Historique des recettes
📱 Design responsive et moderne
🆓 100% GRATUIT - pas de coûts cachés !

---

## 🆘 Support

En cas de problème :
1. Vérifiez que votre clé API Gemini est bien configurée dans Netlify
2. Consultez les logs dans Netlify (Functions → Logs)
3. Vérifiez que la clé commence bien par "AIza"

---

## 📄 Licence

MIT - Utilisez librement ce projet !
