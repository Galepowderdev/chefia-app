# 🚀 GUIDE DE DÉPLOIEMENT NETLIFY - ChefIA

## ✅ VERSION 100% GRATUITE AVEC GOOGLE GEMINI

### 📋 Ce dont vous avez besoin :
- ✉️ Un compte Google (Gmail)
- 💳 **AUCUNE carte bancaire nécessaire !**
- ⏱️ 10 minutes maximum

---

## 🎯 ÉTAPE 1 : Créer une clé API Google Gemini (100% GRATUIT!)

### 1.1 Accéder à Google AI Studio
1. Allez sur : **https://aistudio.google.com/app/apikey**
2. Connectez-vous avec votre compte Google (Gmail)

### 1.2 Créer la clé API
1. Cliquez sur le bouton bleu "**Get API key**" ou "**Create API key**"
2. Sélectionnez "**Create API key in new project**"
3. **La clé s'affiche immédiatement !** (format : AIza...)
4. **COPIEZ LA CLÉ** et sauvegardez-la dans un fichier texte

💰 **C'EST VRAIMENT GRATUIT** :
- ✅ Pas de carte bancaire demandée
- ✅ 60 requêtes par minute GRATUITES
- ✅ 1500 requêtes par jour GRATUITES
- ✅ Pour toujours ! (pas de période d'essai)

⚡ **Une recette = 1 requête = GRATUIT !**

---

## 🌐 ÉTAPE 2 : Créer un compte GitHub

### 2.1 Inscription GitHub
1. Allez sur : **https://github.com**
2. Cliquez sur "Sign up"
3. Créez votre compte (gratuit)
4. Vérifiez votre email

### 2.2 Créer un repository
1. Une fois connecté, cliquez sur le bouton "+" en haut à droite
2. Sélectionnez "New repository"
3. Nom du repository : `chefia-app`
4. Sélectionnez "Public"
5. Cliquez sur "Create repository"

### 2.3 Uploader les fichiers
1. Sur la page de votre repository, cliquez sur "uploading an existing file"
2. Glissez-déposez TOUS les fichiers :
   - index.html
   - app.js
   - netlify.toml
   - README.md
   - .gitignore
3. **IMPORTANT** : Créez le dossier `netlify/functions/`
   - Cliquez sur "Create new file"
   - Dans le nom, tapez : `netlify/functions/generate-recipe.js`
   - Copiez-collez le contenu du fichier generate-recipe.js
   - Cliquez sur "Commit new file"
4. Sinon uploadez directement avec la structure de dossiers

💡 **ASTUCE** : GitHub permet de glisser-déposer des dossiers entiers !

---

## 🚀 ÉTAPE 3 : Déployer sur Netlify

### 3.1 Créer un compte Netlify
1. Allez sur : **https://app.netlify.com/signup**
2. Cliquez sur "Sign up with GitHub"
3. Autorisez Netlify à accéder à GitHub
4. Vous êtes connecté !

### 3.2 Importer votre projet
1. Sur le dashboard Netlify, cliquez sur "Add new site"
2. Sélectionnez "Import an existing project"
3. Cliquez sur "Deploy with GitHub"
4. Cherchez et sélectionnez votre repository `chefia-app`
5. **NE CHANGEZ RIEN** dans les paramètres de build
6. Cliquez sur "Deploy site"

⏱️ **Attendez 1-2 minutes** pendant le déploiement...

### 3.3 Obtenir votre URL
1. Une fois déployé, vous verrez une URL comme : `https://xyz-abc-123.netlify.app`
2. **NE TESTEZ PAS ENCORE** ! Il manque la clé API

---

## 🔑 ÉTAPE 4 : Configurer la clé API Google Gemini (CRUCIAL !)

### 4.1 Ajouter la variable d'environnement
1. Dans Netlify, cliquez sur votre site
2. Allez dans : **Site configuration** → **Environment variables**
3. Cliquez sur "Add a variable" → "Add a single variable"
4. Remplissez :
   - **Key** : `GEMINI_API_KEY`
   - **Value** : Collez votre clé API Google Gemini (AIza...)
   - **Scopes** : Laissez "All scopes" coché
5. Cliquez sur "Create variable"

### 4.2 Re-déployer le site
1. Allez dans l'onglet **Deploys**
2. Cliquez sur "Trigger deploy"
3. Sélectionnez "Clear cache and deploy site"
4. Attendez 1-2 minutes

---

## 🎉 ÉTAPE 5 : TESTER !

1. Cliquez sur votre URL Netlify (ou "Open production deploy")
2. Vous devriez voir ChefIA !
3. Ajoutez quelques ingrédients (ex: poulet, tomates)
4. Cliquez sur "Générer une recette magique"
5. **MAGIE !** 🪄 Une recette unique apparaît !

---

## ❌ PROBLÈMES COURANTS

### "Erreur lors de la génération"
➡️ **Solution** : Vérifiez que la clé API est bien configurée dans Netlify

### "API Key Google Gemini non configurée"
➡️ **Solution** : 
1. Vérifiez l'orthographe exacte : `GEMINI_API_KEY`
2. Vérifiez que la clé commence par "AIza"
3. Re-déployez le site après avoir ajouté la variable

### "Fonction non trouvée"
➡️ **Solution** : 
1. Vérifiez que le fichier est dans : `netlify/functions/generate-recipe.js`
2. Vérifiez que netlify.toml est à la racine
3. Re-déployez le site

### Site affiché mais API ne marche pas
➡️ **Solution** : Regardez les logs :
1. Netlify → Functions → generate-recipe
2. Cliquez sur "Function log" pour voir les erreurs

### "Quota exceeded"
➡️ **Peu probable mais** : 
1. Vous avez dépassé 60 requêtes/minute ou 1500/jour
2. Attendez un peu et réessayez
3. C'est vraiment très généreux comme quota !

---

## 💰 COÛTS : 0€ À VIE !

### Google Gemini API : **0€**
- ✅ Pas de carte bancaire
- ✅ 60 requêtes/minute
- ✅ 1500 requêtes/jour
- ✅ **Gratuit pour toujours**

### Netlify : **0€**
- ✅ 100GB de bande passante/mois
- ✅ 300 minutes de build/mois
- ✅ Largement suffisant

### 🎊 TOTAL : **0€** - Vraiment gratuit !

Avec 1500 requêtes/jour, c'est **45,000 recettes/mois GRATUITES** !

---

## 🎁 BONUS : Personnaliser l'URL

1. Dans Netlify : Site configuration → Domain management
2. Cliquez sur "Options" → "Edit site name"
3. Changez pour quelque chose comme : `chefia` ou `mon-chef-ia`
4. Votre URL devient : `https://chefia.netlify.app`

Vous pouvez aussi ajouter un domaine personnalisé (ex: chefia.com) si vous en possédez un !

---

## 🔄 POURQUOI GOOGLE GEMINI AU LIEU DE CLAUDE ?

### ✅ Avantages de Gemini :
- **100% gratuit** sans carte bancaire
- Quotas très généreux (1500 requêtes/jour)
- Qualité équivalente pour les recettes
- Gratuit à vie (pas de période d'essai)

### ❌ Pourquoi pas Claude :
- Demande une carte bancaire dès le départ
- Payant après les crédits gratuits
- Plus cher (mais excellent aussi)

**Le fonctionnement est EXACTEMENT le même** - seule l'API change !

---

## 📞 BESOIN D'AIDE ?

Si vous êtes bloqué :
1. Vérifiez chaque étape du guide
2. Consultez les logs Netlify (Deploys → Functions)
3. Vérifiez que votre clé Gemini fonctionne sur AI Studio

---

## 🎊 FÉLICITATIONS !

Vous avez maintenant votre propre assistant culinaire IA :
- ✅ En ligne 24/7
- ✅ 100% GRATUIT à vie
- ✅ Sans carte bancaire
- ✅ Recettes infinies et uniques

Partagez l'URL avec vos amis et famille ! 🚀
