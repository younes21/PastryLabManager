# Système de Réservations d'Ingrédients pour les Préparations

## Vue d'ensemble

Ce système permet de réserver automatiquement les ingrédients nécessaires lorsqu'une préparation est programmée, et de les libérer automatiquement une fois la préparation terminée ou supprimée.

## Fonctionnalités

### 1. Réservation Automatique
- **Quand** : Lorsqu'une préparation passe au statut "programmé"
- **Quoi** : Réservation automatique de tous les ingrédients nécessaires selon la recette
- **Comment** : Calcul automatique des quantités basé sur la quantité à produire

### 2. Libération Automatique
- **Quand** : 
  - La préparation commence (statut "en cours")
  - La préparation est supprimée
  - La préparation change de statut (plus "programmé")
- **Quoi** : Libération automatique de toutes les réservations d'ingrédients

### 3. Gestion des Stocks
- **Vérification** : Contrôle automatique de la disponibilité des ingrédients
- **Calcul** : Prise en compte des réservations existantes dans le stock disponible
- **Prévention** : Impossible de programmer une préparation si les ingrédients sont insuffisants

## Architecture Technique

### Base de Données

#### Table `stock_reservations` (étendue)
```sql
-- Nouveaux champs ajoutés
inventory_operation_id INTEGER REFERENCES inventory_operations(id)
reservation_type TEXT NOT NULL DEFAULT 'order' CHECK (reservation_type IN ('order', 'fabrication'))
```

#### Contraintes
- Soit `order_id` soit `inventory_operation_id` doit être présent (pas les deux)
- `reservation_type` peut être 'order' ou 'fabrication'

### API Endpoints

#### GET `/api/inventory-operations/:id/reservations`
- Récupère toutes les réservations d'une opération d'inventaire
- Retourne la liste des ingrédients réservés avec leurs détails

#### POST `/api/inventory-operations/:id/reservations`
- Crée des réservations d'ingrédients pour une préparation
- Vérifie automatiquement la disponibilité des stocks
- Retourne la liste des réservations créées

#### PATCH `/api/stock-reservations/:id/release`
- Libère une réservation spécifique (change le statut à 'cancelled')

### Composants React

#### `IngredientReservations`
- Affiche la liste des réservations d'ingrédients
- Permet de créer manuellement des réservations si nécessaire
- Affiche le statut et les quantités réservées

## Utilisation

### 1. Création d'une Préparation
1. Créer une nouvelle préparation avec le statut "brouillon"
2. Ajouter les produits et quantités à produire
3. Changer le statut à "programmé" → **Réservations automatiques créées**

### 2. Lancement d'une Préparation
1. Changer le statut de "programmé" à "en cours"
2. **Réservations automatiquement libérées**
3. Les ingrédients sont consommés lors de la production

### 3. Suppression d'une Préparation
1. Supprimer une préparation programmée
2. **Toutes les réservations sont automatiquement libérées**

## Workflow Complet

```
Création → Brouillon → Programmé → En cours → Terminé
    ↓           ↓         ↓         ↓         ↓
   Pas de    Pas de   Réservations  Libération  Pas de
 réservation réservation créées     automatique réservation
```

## Avantages

### Pour les Gérants
- **Visibilité** : Voir quels ingrédients sont réservés pour quelles préparations
- **Planification** : Éviter les conflits de stock entre préparations
- **Contrôle** : Impossible de programmer sans vérification des stocks

### Pour les Préparateurs
- **Clarté** : Voir les réservations d'ingrédients de leurs préparations
- **Confiance** : Savoir que les ingrédients sont disponibles
- **Efficacité** : Pas de surprise lors du lancement des préparations

### Pour le Système
- **Intégrité** : Gestion cohérente des stocks et réservations
- **Automatisation** : Réduction des erreurs manuelles
- **Traçabilité** : Historique complet des réservations

## Configuration

### Variables d'Environnement
Aucune configuration supplémentaire requise.

### Permissions
- **Lecture** : Tous les utilisateurs peuvent voir les réservations
- **Création** : Automatique lors de la programmation
- **Modification** : Seulement pour libérer les réservations
- **Suppression** : Automatique lors de la suppression des opérations

## Dépannage

### Problèmes Courants

#### "Stock insuffisant pour la réservation"
- Vérifier le stock disponible de l'ingrédient
- Vérifier les réservations existantes
- Ajuster la quantité à produire ou commander plus d'ingrédients

#### "Réservations non créées"
- Vérifier que le statut est bien "programmé"
- Vérifier que la préparation a des items avec des recettes
- Vérifier les logs d'erreur

#### "Réservations non libérées"
- Vérifier que le statut a bien changé
- Vérifier que l'opération existe toujours
- Vérifier les contraintes de base de données

### Logs
Les erreurs de réservation sont loggées dans la console du serveur avec le préfixe "Error creating ingredient reservations:".

## Évolutions Futures

### Fonctionnalités Prévues
- **Expiration automatique** des réservations après une durée configurable
- **Notifications** lors de la création/libération des réservations
- **Rapports** de réservations par période
- **Gestion des priorités** entre préparations

### Optimisations Possibles
- **Cache** des calculs de disponibilité
- **Batch** des opérations de réservation
- **Index** supplémentaires pour les performances
- **Partitioning** des tables de réservations
