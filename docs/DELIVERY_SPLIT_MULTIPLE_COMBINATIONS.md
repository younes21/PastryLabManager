# Modifications du DeliverySplitModal - Combinaisons Multiples

## Résumé des changements

Le `DeliverySplitModal` a été modifié pour permettre à l'utilisateur de sélectionner **plusieurs combinaisons uniques** (lot, zone) au lieu d'une seule combinaison.

## Fonctionnalités implémentées

### 1. Interface utilisateur améliorée
- **Bouton "Ajouter une combinaison"** : Permet d'ajouter de nouvelles lignes de répartition
- **Lignes de répartition** : Chaque ligne contient :
  - Sélecteur de lot (avec liste distincte)
  - Sélecteur de zone (avec liste distincte) 
  - Champ quantité
  - Bouton de suppression
- **Numérotation** : Chaque ligne est numérotée (#1, #2, etc.)
- **Design amélioré** : Interface plus claire avec grille responsive

### 2. Validation des combinaisons
- **Unicité** : Chaque combinaison (lot, zone) doit être unique
- **Quantité totale** : La somme des quantités doit égaler la quantité demandée
- **Disponibilité** : Vérification que chaque combinaison a suffisamment de stock
- **Contraintes métier** : Respect des règles (lot obligatoire pour périssables, etc.)

### 3. Gestion des données
- **Listes distinctes** : 
  - `getDistinctLots()` : Retourne les lots uniques disponibles
  - `getDistinctZones()` : Retourne les zones uniques disponibles
- **État des splits** : Gestion d'un tableau de splits au lieu d'un seul split
- **Réinitialisation** : Nettoyage des états lors de la fermeture du modal

### 4. Messages d'erreur contextuels
- Erreurs spécifiques par ligne (ex: "ligne 2")
- Validation des doublons avec indication de la ligne problématique
- Vérification de la disponibilité en stock par combinaison

## Exemple d'utilisation

```typescript
// L'utilisateur peut maintenant créer plusieurs répartitions :
const splits = [
  { lotId: 1, fromStorageZoneId: 2, quantity: 30 },
  { lotId: 2, fromStorageZoneId: 1, quantity: 20 },
  { lotId: null, fromStorageZoneId: 3, quantity: 10 }
];
// Total: 60 (doit égaler la quantité demandée)
```

## Cas d'usage

1. **Article avec plusieurs lots** : L'utilisateur peut répartir sur différents lots
2. **Article dans plusieurs zones** : L'utilisateur peut répartir sur différentes zones
3. **Combinaisons mixtes** : L'utilisateur peut combiner différents lots et zones
4. **Optimisation du stock** : Permet d'utiliser le stock disponible de manière optimale

## Validation

- ✅ Chaque combinaison (lot, zone) est unique
- ✅ La somme des quantités = quantité demandée  
- ✅ Disponibilité en stock vérifiée pour chaque combinaison
- ✅ Respect des contraintes métier (lots obligatoires, etc.)
- ✅ Interface utilisateur intuitive et responsive

## Tests

Un script de test a été créé (`test-multiple-combinations.js`) pour vérifier :
- Récupération des données de disponibilité
- Génération des listes distinctes
- Validation des combinaisons multiples
- Détection des doublons
- Scénarios de répartition complexes
