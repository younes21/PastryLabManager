# Fonctionnalités de Répartition des Articles dans les Livraisons

## Vue d'ensemble

Cette fonctionnalité implémente un système intelligent de répartition des articles lors de la création de livraisons, avec des contrôles automatiques basés sur les caractéristiques des articles et leur disponibilité en stock.

## Contrôles Automatiques

### 1. Obligation de Sélection de Lot

**Cas où la sélection d'un lot est obligatoire :**
- L'article est marqué comme **périssable** dans la base de données
- L'article existe dans **plusieurs lots** différents

**Exemple :**
- Tarte fraise (périssable) → Sélection de lot obligatoire
- Farine disponible dans 3 lots → Sélection de lot obligatoire

### 2. Obligation de Sélection de Zone

**Cas où la sélection d'une zone est obligatoire :**
- L'article existe dans **plusieurs zones de stockage** différentes

**Exemple :**
- Croissants stockés en Zone 1 (Congélateur) et Zone 2 (Étagère) → Sélection de zone obligatoire

### 3. Cas Simple (Livraison Directe)

**Conditions pour une livraison directe sans répartition :**
- L'article n'existe que dans **un seul lot**
- L'article n'existe que dans **une seule zone**
- L'article **n'est pas périssable**
- **Aucune réservation** n'est en cours

**Exemple :**
- Croissants (30 en stock, 1 seul lot, 1 seule zone, non périssable) → Livraison directe possible jusqu'à 30 unités

## Interface Utilisateur

### Modal de Répartition

Le modal affiche trois sections principales :

#### 1. Résumé de la Disponibilité
- **Stock total** : Quantité totale en stock
- **Réservé** : Quantité réservée par d'autres opérations
- **Disponible** : Quantité réellement disponible
- **Demandé** : Quantité demandée dans la commande

#### 2. Indicateurs de Contraintes
- **Alertes visuelles** pour les sélections obligatoires
- **Messages explicatifs** sur les raisons des contraintes
- **Indicateur de livraison directe** quand c'est possible

#### 3. Disponibilité Détaillée
- **Tableau** avec tous les lots et zones disponibles
- **Quantités** par combinaison lot/zone
- **Dates de péremption** pour les lots périssables

#### 4. Formulaire de Répartition
- **Sélecteurs** pour lot et zone (avec validation)
- **Champs de quantité** avec validation
- **Ajout/suppression** de lignes de répartition
- **Validation en temps réel** des quantités

## API Backend

### Endpoint : `/api/articles/:articleId/availability`

**Méthode :** GET

**Paramètres :**
- `articleId` : ID de l'article

**Réponse :**
```json
{
  "article": {
    "id": 1,
    "name": "Tarte fraise",
    "code": "PRD-000001",
    "isPerishable": true,
    "type": "product"
  },
  "availability": [
    {
      "lotId": 1,
      "lotCode": "LOT-001",
      "lotExpirationDate": "2024-12-31",
      "storageZoneId": 1,
      "storageZoneCode": "ZON-001",
      "storageZoneDesignation": "Congélateur",
      "stockQuantity": 40,
      "reservedQuantity": 20,
      "availableQuantity": 20,
      "isPerishable": true,
      "requiresLotSelection": true,
      "requiresZoneSelection": false
    }
  ],
  "summary": {
    "totalStock": 40,
    "totalReserved": 20,
    "totalAvailable": 20,
    "requiresLotSelection": true,
    "requiresZoneSelection": false,
    "canDirectDelivery": false
  }
}
```

## Logique Métier

### Calcul de Disponibilité

1. **Stock Total** : Somme de toutes les quantités en stock (tous lots et zones confondus)
2. **Réservations Actives** : Quantités réservées par d'autres commandes ou préparations
3. **Disponibilité Réelle** : Stock total - Réservations actives

### Validation des Répartitions

1. **Somme des Quantités** : Doit être égale à la quantité demandée
2. **Sélections Obligatoires** : Lot et/ou zone selon les contraintes
3. **Quantités Positives** : Chaque ligne doit avoir une quantité > 0
4. **Disponibilité Réelle** : Ne peut pas dépasser le stock disponible

## Exemples Concrets

### Exemple 1 : Article Complexe
**Tarte fraise (100 en stock, 20 réservées)**
- Lot 1 – Zone 1 : 40 unités
- Lot 2 – Zone 2 : 40 unités
- Commande = 90 → Maximum livrable = 80

**Résultat :** L'utilisateur doit préciser combien du Lot 1 et combien du Lot 2

### Exemple 2 : Article Simple
**Croissant (30 en stock, aucun réservé, 1 seul lot et 1 seule zone)**

**Résultat :** Pas besoin de choix → Livraison directe possible jusqu'à 30 croissants

## Avantages de cette Approche

1. **Traçabilité Complète** : Chaque article livré est tracé par lot et zone
2. **Gestion des Périssables** : Contrôle automatique des dates de péremption
3. **Optimisation des Stocks** : Utilisation intelligente des différents emplacements
4. **Validation Automatique** : Réduction des erreurs de saisie
5. **Interface Intuitive** : Guide l'utilisateur selon les contraintes

## Utilisation

1. **Créer une livraison** depuis la page des livraisons
2. **Ajouter des articles** à la livraison
3. **Cliquer sur "Répartition"** pour chaque article nécessitant une répartition
4. **Suivre les indicateurs** pour comprendre les contraintes
5. **Remplir le formulaire** de répartition selon les règles
6. **Valider** la répartition une fois complète

## Maintenance

### Ajout de Nouveaux Types de Contraintes

Pour ajouter de nouvelles règles de validation :

1. **Modifier** la logique dans `server/routes.ts` (fonction `getArticleAvailability`)
2. **Mettre à jour** l'interface `ArticleAvailability` dans le composant React
3. **Ajouter** les nouvelles validations dans la fonction `validateSplits`

### Personnalisation des Messages

Les messages d'erreur et d'information sont centralisés dans le composant `DeliverySplitModal` et peuvent être facilement modifiés selon les besoins de l'entreprise.
