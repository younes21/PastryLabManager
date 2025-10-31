# Avis de Sécurité - Module Livreur

## ⚠️ PROBLÈME DE SÉCURITÉ CRITIQUE

### Problème

L'application **ne dispose d'aucune authentification côté serveur**. L'authentification actuelle repose entièrement sur le localStorage côté client, ce qui présente des risques de sécurité majeurs:

1. **Aucune vérification d'identité côté serveur**: N'importe quel utilisateur peut envoyer des requêtes avec n'importe quel `userId` sans vérification.
2. **Manipulation facile des requêtes**: Les utilisateurs malveillants peuvent facilement modifier les IDs dans leurs requêtes pour accéder/modifier les données d'autres utilisateurs.
3. **Pas de protection des endpoints**: Tous les endpoints API sont accessibles sans authentification réelle.

### Impact sur le Module Livreur

Les endpoints suivants sont particulièrement vulnérables:
- `GET /api/deliveries/stats/:userId` - N'importe qui peut voir les stats de n'importe quel livreur
- `GET /api/deliveries/livreur/:userId` - N'importe qui peut voir les livraisons d'un autre livreur
- `PATCH /api/deliveries/:id/status` - N'importe qui peut changer le statut d'une livraison
- `PATCH /api/deliveries/:id/problem` - N'importe qui peut signaler des problèmes sur une livraison
- `GET /api/payments/livreur/:userId` - N'importe qui peut voir les paiements d'un autre livreur
- `PATCH /api/payments/:id/confirm` - N'importe qui peut confirmer/annuler des paiements

### Améliorations Mises en Place

Pour atténuer partiellement ces risques, les mesures suivantes ont été implémentées:

1. **Validation Zod** sur tous les endpoints de mutation:
   - `/api/deliveries/:id/status` - Valide que le statut est dans la liste autorisée
   - `/api/deliveries/:id/problem` - Valide que la note est une chaîne de 1-5000 caractères
   - `/api/payments/:id/confirm` - Valide que deliveredAmount est un nombre positif

2. **Correction du typage** dans le frontend:
   - Le champ `deliveredAmount` est maintenant correctement converti en nombre avant l'envoi
   - Validation NaN ajoutée avant les mutations

### ⚠️ SOLUTION RECOMMANDÉE

Pour sécuriser complètement l'application, il est **IMPÉRATIF** d'implémenter une authentification côté serveur. Voici les options recommandées:

#### Option 1: Sessions Express (Recommandé pour cette application)

```typescript
// Installer les dépendances
npm install express-session passport passport-local @types/express-session @types/passport @types/passport-local

// Configurer dans server/index.ts
import session from 'express-session';
import passport from 'passport';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true en production avec HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// Middleware d'authentification
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Non authentifié" });
};

// Middleware de rôle
const hasRole = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) return next();
  res.status(403).json({ message: "Accès refusé" });
};

// Protéger les routes
app.get("/api/deliveries/stats/:userId", isAuthenticated, hasRole('livreur'), ...);
```

#### Option 2: JWT (Pour applications découplées)

```typescript
// Installer les dépendances
npm install jsonwebtoken @types/jsonwebtoken

// Générer le token lors de la connexion
const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET);

// Middleware de vérification
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Token manquant" });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
};
```

### Priorité

🔴 **CRITIQUE** - Cette vulnérabilité doit être corrigée avant tout déploiement en production.

### Actions Immédiates

1. ✅ Validations Zod implémentées
2. ✅ Correction du typage deliveredAmount
3. ⚠️ **À FAIRE**: Implémenter l'authentification côté serveur (sessions ou JWT)
4. ⚠️ **À FAIRE**: Ajouter des middlewares de vérification sur tous les endpoints sensibles
5. ⚠️ **À FAIRE**: Tester tous les endpoints avec authentification

### Date

31 Octobre 2025

---

**Note**: Ce fichier doit être partagé avec toute l'équipe de développement et les responsables de la sécurité.
