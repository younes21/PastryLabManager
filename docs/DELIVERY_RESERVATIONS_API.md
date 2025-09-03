# API des Réservations de Livraison

## Vue d'ensemble

Ce système permet de gérer automatiquement les réservations de stock lors de la création de livraisons, assurant que les articles sont disponibles et réservés jusqu'à la validation de la livraison.

## Flux de travail

### 1. Création de livraison
- Une livraison est créée avec le statut `pending`
- Le champ `isValidated` est automatiquement défini à `false`

### 2. Réservation automatique
- Les articles sont réservés dans le stock
- Le stock disponible est calculé en tenant compte des réservations existantes
- Impossible de réserver plus que le stock disponible

### 3. Validation de livraison
- La livraison passe au statut `delivered`
- `isValidated` devient `true`
- Le stock est déduit automatiquement
- Une opération d'inventaire de sortie est créée
- Les réservations sont marquées comme `delivered`

## Endpoints API

### POST `/api/deliveries/:id/reservations`
Crée des réservations de stock pour une livraison.

**Corps de la requête :**
```json
{
  "orderItems": [
    {
      "id": 1,
      "articleId": 1,
      "quantity": "10.000"
    },
    {
      "id": 2,
      "articleId": 2,
      "quantity": "5.000"
    }
  ]
}
```

**Réponse :**
```json
[
  {
    "id": 1,
    "deliveryId": 1,
    "articleId": 1,
    "orderItemId": 1,
    "reservedQuantity": "10.000",
    "deliveredQuantity": "0.000",
    "status": "reserved",
    "notes": "Réservation pour livraison 1"
  }
]
```

### GET `/api/deliveries/:id/reservations`
Récupère toutes les réservations d'une livraison.

### DELETE `/api/deliveries/:id/reservations`
Libère toutes les réservations d'une livraison (annulation).

### POST `/api/deliveries/:id/validate`
Valide une livraison et déduit le stock.

**Réponse :**
```json
{
  "id": 1,
  "code": "LIV-000001",
  "isValidated": true,
  "validatedAt": "2024-01-15T10:30:00Z",
  "status": "delivered"
}
```

### GET `/api/articles/:id/available-stock`
Récupère le stock disponible d'un article en tenant compte des réservations.

**Réponse :**
```json
{
  "articleId": 1,
  "availableStock": 85.5
}
```

## Gestion des erreurs

### Stock insuffisant
```json
{
  "message": "Stock insuffisant pour l'article 1. Disponible: 5, Requis: 10"
}
```

### Livraison déjà validée
```json
{
  "message": "Livraison 1 déjà validée"
}
```

## Exemple d'utilisation

### 1. Créer une livraison
```javascript
const delivery = await axios.post('/api/deliveries', {
  orderId: 1,
  deliveryAddress: '123 Main St',
  status: 'pending'
});
```

### 2. Créer des réservations
```javascript
const reservations = await axios.post(`/api/deliveries/${delivery.id}/reservations`, {
  orderItems: [
    { id: 1, articleId: 1, quantity: '10.000' }
  ]
});
```

### 3. Vérifier le stock disponible
```javascript
const stock = await axios.get('/api/articles/1/available-stock');
console.log(`Stock disponible: ${stock.data.availableStock}`);
```

### 4. Valider la livraison
```javascript
const validatedDelivery = await axios.post(`/api/deliveries/${delivery.id}/validate`);
```

## Base de données

### Table `deliveries`
- `is_validated` : Boolean indiquant si la livraison est validée
- `validated_at` : Timestamp de validation

### Table `delivery_stock_reservations`
- `delivery_id` : Référence à la livraison
- `article_id` : Référence à l'article
- `order_item_id` : Référence à la ligne de commande
- `reserved_quantity` : Quantité réservée
- `status` : Statut de la réservation (reserved, delivered, cancelled)
- `parent_operation_id` : Référence à l'opération d'inventaire

## Migration

Exécutez le fichier `server/migrations/add_delivery_validation_fields.sql` pour créer les nouvelles colonnes et tables.

## Tests

Utilisez le fichier `test-delivery-reservations.js` pour tester les fonctionnalités :

```bash
node test-delivery-reservations.js
```
