# Inventaire Physique - Fonctionnalités

## Vue d'ensemble

La page d'inventaire physique permet de gérer les ajustements de stock en comparant les quantités théoriques avec les quantités réelles comptées lors d'un inventaire physique.

## Fonctionnalités principales

### 1. Liste des inventaires physiques
- **Affichage** : Tableau avec les inventaires existants
- **Colonnes** : Code, Zone, Statut, Date, Nombre d'articles, Actions
- **Filtrage** : Par statut (Brouillon, Terminé, Annulé)
- **Actions** : Modifier (brouillon), Supprimer (brouillon)

### 2. Création d'un nouvel inventaire
- **Code automatique** : Généré avec le préfixe "AJU-" suivi d'un numéro séquentiel
- **Zone de stockage** : Sélection obligatoire
- **Statut** : Brouillon par défaut
- **Notes** : Commentaires optionnels

### 3. Gestion des articles
- **Sélection par type** : Onglets séparés pour Ingrédients et Produits
- **Recherche** : Par nom ou code d'article
- **Informations affichées** : Code, nom, stock actuel, unité

### 4. Tableau des articles d'inventaire
- **Zone** : Sélection de la zone de stockage par article
- **Article** : Nom et code de l'article
- **Lot/Numéro de série** : Affichage des informations de traçabilité
- **Quantité en stock** : Stock théorique (lecture seule)
- **Quantité réelle** : Stock compté (modifiable)
- **Unité de mesure** : Unité de l'article
- **Actions** : Supprimer l'article (brouillon uniquement)

### 5. Workflow de validation
- **Brouillon** : État initial, modifiable
- **Sauvegarde** : Enregistrement sans validation
- **Complétion** : Validation finale qui met à jour les stocks

## API Endpoints utilisés

### GET `/api/inventory-operations?type=ajustement`
Récupère la liste des opérations d'ajustement

### GET `/api/inventory-operations/:id`
Récupère une opération d'ajustement avec ses items

### POST `/api/inventory-operations`
Crée une nouvelle opération d'ajustement

### PUT `/api/inventory-operations/:id`
Modifie une opération d'ajustement existante

### PATCH `/api/inventory-operations/:id`
Met à jour le statut d'une opération

### DELETE `/api/inventory-operations/:id`
Supprime une opération d'ajustement

### GET `/api/stock/items`
Récupère les items de stock avec les informations des articles

### GET `/api/storage-zones`
Récupère la liste des zones de stockage

### GET `/api/articles`
Récupère la liste des articles

## Structure des données

### Opération d'inventaire
```typescript
{
  id: number;
  code: string; // AJU-000001, AJU-000002, etc.
  type: 'ajustement';
  status: 'draft' | 'completed' | 'cancelled';
  storageZoneId: number;
  notes?: string;
  createdAt: string;
  items: InventoryItem[];
}
```

### Item d'inventaire
```typescript
{
  id: number;
  articleId: number;
  quantity: string; // Différence (nouvelle - ancienne)
  quantityBefore: string; // Stock théorique
  quantityAfter: string; // Stock réel
  unitCost: string; // Toujours '0' pour ajustement
  toStorageZoneId: number;
  lotId?: number;
  serialNumber?: string;
  notes?: string;
}
```

## Règles métier

### 1. Génération des codes
- **Préfixe** : "AJU" pour ajustement
- **Format** : AJU-000001, AJU-000002, etc.
- **Séquence** : Basée sur le nombre d'opérations d'ajustement existantes

### 2. Validation des données
- **Zone obligatoire** : Une zone de stockage doit être sélectionnée
- **Articles requis** : Au moins un article doit être ajouté
- **Quantités positives** : Les quantités réelles doivent être ≥ 0

### 3. Gestion des statuts
- **Brouillon** : Modifiable, supprimable
- **Terminé** : Lecture seule, met à jour les stocks
- **Annulé** : Lecture seule, pas d'impact sur les stocks

### 4. Impact sur les stocks
- **Complétion** : Met à jour automatiquement les stocks des articles
- **Calcul** : Nouveau stock = Stock théorique + Différence
- **Traçabilité** : Conservation de l'historique des ajustements

## Interface utilisateur

### Design
- **Style** : Cohérent avec les autres pages (purchase-orders)
- **Couleurs** : Dégradé rose-orange pour les en-têtes
- **Responsive** : Adaptation mobile et desktop

### Composants utilisés
- **Table** : Affichage des listes
- **Dialog** : Formulaire d'édition
- **Tabs** : Séparation ingrédients/produits
- **Select** : Sélection des zones et articles
- **Input** : Saisie des quantités
- **Badge** : Affichage des statuts

### Navigation
- **Sidebar** : Lien "Inventaire Physique" dans le groupe "Inventaire"
- **Route** : `/inventory-physical`
- **Icône** : CheckCircle (validation)

## Tests

### Script de test
Le fichier `test-inventory-physical.js` permet de tester :
- Vérification des opérations existantes
- Création d'opérations de test
- Validation des données
- Nettoyage automatique

### Exécution
```bash
node test-inventory-physical.js
```

## Évolutions futures

### Fonctionnalités possibles
- **Import/Export** : Fichiers Excel pour les inventaires
- **Rapports** : Statistiques d'écarts d'inventaire
- **Notifications** : Alertes pour écarts importants
- **Validation multi-niveaux** : Approbation hiérarchique
- **Inventaire par zone** : Filtrage automatique par zone
- **Scanner codes-barres** : Interface mobile pour comptage

### Améliorations techniques
- **Performance** : Pagination pour gros volumes
- **Cache** : Mise en cache des données fréquentes
- **Audit** : Logs détaillés des modifications
- **API** : Endpoints optimisés pour mobile
