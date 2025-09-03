# Page Stock - Nouvelles Fonctionnalités

## Vue d'ensemble

La page stock a été entièrement refactorisée pour offrir une interface moderne et intuitive pour la gestion des stocks d'ingrédients et de produits.

## Fonctionnalités Principales

### 1. Interface à Onglets
- **Onglet Ingrédients** : Affiche tous les ingrédients en stock
- **Onglet Produits** : Affiche tous les produits en stock
- Compteurs dynamiques pour chaque onglet

### 2. Recherche et Filtrage
- **Recherche textuelle** : Recherche par nom ou code d'article
- **Filtre par zone de stockage** : Filtre les articles par zone
- **Bouton de réinitialisation** : Efface tous les filtres

### 3. Affichage des Données de Stock
Chaque article affiche :
- Nom et code de l'article
- Zone de stockage
- Quantité en stock avec unité
- Statut du stock (Normal, Faible, Rupture, Élevé)
- Informations sur le lot (code et date d'expiration)
- Bouton pour voir les opérations

### 4. Boîte de Dialogue des Opérations
Une boîte de dialogue détaillée affiche l'historique complet des opérations pour chaque article :

#### Informations de l'Opération
- Code de l'opération
- Type d'opération (Réception, Livraison, Fabrication, etc.)
- Statut (draft, completed, cancelled)
- Date programmée
- Notes de l'opération

#### Détails des Mouvements de Stock
- **Sens du mouvement** : 
  - 🟢 **Entrée** (Réception, Fabrication, Ajustement +)
  - 🔴 **Sortie** (Livraison, Consommation, Ajustement -)
  - 🔵 **Transfert** (Transfert entre zones)
- Quantité avec signe (+ ou -)
- Stock avant et après l'opération
- Coût unitaire
- Zones de départ et d'arrivée (pour les transferts)
- Notes spécifiques à l'article

## Endpoints API Créés

### 1. `/api/stock/items`
Récupère tous les items de stock avec les détails des articles et zones de stockage.

**Réponse :**
```json
[
  {
    "id": 1,
    "articleId": 1,
    "storageZoneId": 1,
    "quantity": "10.500",
    "lotId": 1,
    "article": {
      "id": 1,
      "code": "ING-000001",
      "name": "Farine",
      "type": "ingredient",
      "unit": "kg",
      "costPerUnit": "2.50",
      "currentStock": "10.500",
      "storageZoneId": 1
    },
    "storageZone": {
      "id": 1,
      "designation": "Zone A"
    },
    "lot": {
      "id": 1,
      "code": "LOT-001",
      "expirationDate": "2024-12-31T00:00:00.000Z"
    }
  }
]
```

### 2. `/api/stock/:articleId/operations`
Récupère toutes les opérations d'inventaire pour un article spécifique.

**Réponse :**
```json
[
  {
    "id": 1,
    "code": "REC-000001",
    "type": "reception",
    "status": "completed",
    "scheduledDate": "2024-01-15T10:00:00.000Z",
    "completedAt": "2024-01-15T10:30:00.000Z",
    "notes": "Réception fournisseur",
    "createdBy": 1,
    "createdByUser": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe"
    },
    "items": [
      {
        "id": 1,
        "operationId": 1,
        "articleId": 1,
        "quantity": "5.000",
        "quantityBefore": "5.500",
        "quantityAfter": "10.500",
        "unitCost": "2.50",
        "fromStorageZoneId": null,
        "toStorageZoneId": 1,
        "notes": "Réception standard",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "article": {
          "id": 1,
          "code": "ING-000001",
          "name": "Farine",
          "type": "ingredient",
          "unit": "kg"
        },
        "fromStorageZone": null,
        "toStorageZone": {
          "id": 1,
          "designation": "Zone A"
        }
      }
    ]
  }
]
```

## Types d'Opérations Supportés

### Entrées (🟢)
- `reception` : Réception de fournisseur
- `fabrication` : Fabrication de produits
- `ajustement_plus` : Ajustement positif d'inventaire

### Sorties (🔴)
- `livraison` : Livraison client
- `consommation` : Consommation pour production
- `ajustement_moins` : Ajustement négatif d'inventaire

### Transferts (🔵)
- `transfert` : Transfert entre zones de stockage

## Statuts de Stock

- **Normal** (🟢) : Stock dans les limites normales
- **Faible** (🟠) : Stock inférieur au minimum
- **Rupture** (🔴) : Stock à zéro
- **Élevé** (🟡) : Stock supérieur au maximum

## Utilisation

1. **Accéder à la page** : Naviguez vers `/stock` dans l'application
2. **Changer d'onglet** : Cliquez sur "Ingrédients" ou "Produits"
3. **Rechercher** : Utilisez la barre de recherche pour filtrer les articles
4. **Filtrer par zone** : Sélectionnez une zone de stockage dans le menu déroulant
5. **Voir les opérations** : Cliquez sur "Opérations" pour un article spécifique
6. **Analyser les mouvements** : Dans la boîte de dialogue, examinez le sens et les détails de chaque opération

## Améliorations Futures Possibles

- Export des données de stock en CSV/Excel
- Graphiques d'évolution des stocks
- Alertes automatiques pour stock faible
- Gestion des dates de péremption
- Historique des prix d'achat
- Calcul de la valeur du stock
