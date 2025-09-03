# 🚫 Gestion des Annulations de Livraison

## Vue d'ensemble

Ce module implémente la gestion complète des annulations de livraison avec deux scénarios distincts :

1. **Annulation AVANT validation** : Retour automatique au stock disponible
2. **Annulation APRÈS validation** : Choix entre retour au stock ou marquage comme rebut

## 🔄 Workflow des Annulations

### Scénario 1 : Annulation avant validation
```
Livraison créée → Réservations actives → Annulation → Réservations supprimées → Stock disponible restauré
```

### Scénario 2 : Annulation après validation
```
Livraison validée → Stock déduit → Annulation → Choix retour/rebut → Opération d'inventaire créée
```

## 📡 API Endpoints

### 1. Annulation avant validation
**POST** `/api/deliveries/:id/cancel-before-validation`

**Body :**
```json
{
  "reason": "Client a changé d'avis"
}
```

**Réponse :**
```json
{
  "id": 1,
  "code": "LIV-000001",
  "status": "cancelled",
  "isValidated": false,
  "updatedAt": "2024-01-XX..."
}
```

### 2. Annulation après validation
**POST** `/api/deliveries/:id/cancel-after-validation`

**Body :**
```json
{
  "reason": "Produits endommagés",
  "isReturnToStock": false
}
```

**Réponse :**
```json
{
  "id": 1,
  "code": "LIV-000001",
  "status": "cancelled",
  "isValidated": true,
  "updatedAt": "2024-01-XX..."
}
```

## 🗄️ Opérations d'Inventaire Créées

### Retour au stock (`isReturnToStock: true`)
- **Type** : `retour_livraison`
- **Action** : Ajoute les quantités au stock
- **Traçabilité** : Lien vers la livraison annulée

### Rebut (`isReturnToStock: false`)
- **Type** : `rebut_livraison`
- **Action** : Le stock reste inchangé (déjà déduit)
- **Traçabilité** : Lien vers la livraison annulée

## 🔍 Méthodes de Stock

### `cancelDeliveryBeforeValidation(deliveryId, reason)`
- Vérifie que la livraison n'est pas validée
- Supprime toutes les réservations
- Marque la livraison comme annulée
- Le stock disponible est automatiquement restauré

### `cancelDeliveryAfterValidation(deliveryId, reason, isReturnToStock)`
- Vérifie que la livraison est validée
- Crée l'opération d'inventaire appropriée
- Met à jour le stock selon le type d'annulation
- Marque la livraison et les réservations comme annulées

### `createReturnToStockOperation(deliveryId, reason)`
- Crée une opération de type `retour_livraison`
- Ajoute les quantités au stock des articles
- Crée les items d'opération avec traçabilité

### `createWasteOperation(deliveryId, reason)`
- Crée une opération de type `rebut_livraison`
- Le stock reste inchangé
- Crée les items d'opération avec traçabilité

## 📊 Gestion du Stock

### Avant validation
- Les réservations bloquent le stock disponible
- L'annulation libère automatiquement les réservations
- Le stock disponible est restauré

### Après validation
- Le stock réel a été déduit
- L'annulation avec retour ajoute les quantités au stock
- L'annulation avec rebut laisse le stock inchangé

## 🧪 Tests

### Fichier de test
`test-delivery-cancellations.js`

### Scénarios testés
1. **Annulation avant validation** : Vérification du retour au stock
2. **Annulation après validation - retour** : Vérification de l'ajout au stock
3. **Annulation après validation - rebut** : Vérification de la stabilité du stock

### Exécution
```bash
node test-delivery-cancellations.js
```

## 🚨 Gestion des Erreurs

### Erreurs communes
- **Livraison non trouvée** : ID invalide
- **Livraison déjà validée** : Utiliser `cancel-after-validation`
- **Livraison non validée** : Utiliser `cancel-before-validation`
- **Raison manquante** : Champ `reason` requis

### Codes de statut HTTP
- **200** : Annulation réussie
- **400** : Données invalides
- **500** : Erreur serveur

## 🔗 Traçabilité

### Champs de traçabilité
- **Opération mère** : Référence à la livraison annulée
- **Notes** : Raison de l'annulation
- **Timestamps** : Dates de création et modification
- **Opérateur** : Utilisateur ayant effectué l'annulation

### Tables impliquées
- `deliveries` : Statut et métadonnées
- `delivery_stock_reservations` : Statut des réservations
- `inventory_operations` : Opérations de retour/rebut
- `inventory_operation_items` : Détails des opérations
- `articles` : Stock mis à jour

## 📈 Avantages

1. **Traçabilité complète** : Toutes les opérations sont liées
2. **Gestion flexible** : Choix entre retour et rebut
3. **Intégrité des données** : Transactions atomiques
4. **Audit trail** : Historique complet des modifications
5. **Gestion du stock** : Automatique selon le scénario
