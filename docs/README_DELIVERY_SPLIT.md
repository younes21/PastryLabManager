# Guide d'utilisation : Répartition des Articles dans les Livraisons

## 🎯 Vue d'ensemble

Cette fonctionnalité permet de gérer intelligemment la répartition des articles lors de la création de livraisons, avec des contrôles automatiques basés sur les caractéristiques des articles et leur disponibilité en stock.

## 🚀 Comment utiliser

### 1. Accéder à la page des livraisons
- Naviguez vers **Livraisons** dans le menu latéral
- Cliquez sur **Nouvelle livraison** ou modifiez une livraison existante

### 2. Ajouter des articles
- Dans l'onglet **Articles à livrer**, ajoutez les articles nécessaires
- Définissez la quantité à livrer pour chaque article

### 3. Gérer la répartition
- Pour chaque article, vous verrez un bouton **Répartir** (sauf dans le cas simple)
- Cliquez sur **Répartir** pour ouvrir le modal de répartition

## 📋 Types de répartition

### 🔴 **Cas Complexe (Répartition obligatoire)**
**Quand :** L'article nécessite une répartition manuelle

**Indicateurs visuels :**
- Bouton **Répartir** visible
- Alertes orange/rouge indiquant les contraintes
- Icône ⚠️ d'avertissement

**Exemples :**
- **Tarte fraise** (périssable) → Sélection de lot obligatoire
- **Farine** (plusieurs lots) → Sélection de lot obligatoire
- **Croissants** (plusieurs zones) → Sélection de zone obligatoire

### 🟢 **Cas Simple (Livraison directe)**
**Quand :** L'article peut être livré directement sans répartition

**Indicateurs visuels :**
- Bouton **Répartir** masqué
- Message "✓ Répartition validée" affiché
- Icône ✅ de validation

**Conditions :**
- Article dans **un seul lot**
- Article dans **une seule zone**
- Article **non périssable**
- **Aucune réservation** en cours

**Exemple :**
- **Croissants** (30 en stock, 1 seul lot, 1 seule zone, non périssable)

## 🎨 Interface du Modal de Répartition

### Section 1 : Résumé de la disponibilité
- **Stock total** : Quantité totale en stock
- **Réservé** : Quantité réservée par d'autres opérations
- **Disponible** : Quantité réellement disponible
- **Demandé** : Quantité demandée dans la commande

### Section 2 : Indicateurs de contraintes
- **Alertes visuelles** pour les sélections obligatoires
- **Messages explicatifs** sur les raisons des contraintes
- **Indicateur de livraison directe** quand c'est possible

### Section 3 : Disponibilité détaillée
- **Tableau** avec tous les lots et zones disponibles
- **Quantités** par combinaison lot/zone
- **Dates de péremption** pour les lots périssables

### Section 4 : Formulaire de répartition
- **Sélecteurs** pour lot et zone (avec validation)
- **Champs de quantité** avec validation
- **Ajout/suppression** de lignes de répartition
- **Validation en temps réel** des quantités

## ✅ Validation des répartitions

### Règles de validation
1. **Somme des quantités** : Doit être égale à la quantité demandée
2. **Sélections obligatoires** : Lot et/ou zone selon les contraintes
3. **Quantités positives** : Chaque ligne doit avoir une quantité > 0
4. **Disponibilité réelle** : Ne peut pas dépasser le stock disponible

### Messages d'erreur
- Erreurs affichées en rouge sous le formulaire
- Validation en temps réel
- Bouton de validation désactivé si erreurs

## 🔧 Fonctionnalités avancées

### Ajout de lignes de répartition
- Cliquez sur **"Ajouter une ligne de répartition"**
- Chaque ligne peut avoir un lot, une zone et une quantité différents
- Permet de répartir une quantité sur plusieurs combinaisons lot/zone

### Suppression de lignes
- Cliquez sur l'icône 🗑️ pour supprimer une ligne
- La suppression est immédiate
- La validation se met à jour automatiquement

### Modification des valeurs
- Changez lot, zone ou quantité à tout moment
- La validation se met à jour en temps réel
- Les totaux se recalculent automatiquement

## 📊 Exemples concrets

### Exemple 1 : Article Complexe
**Tarte fraise (100 en stock, 20 réservées)**
- Lot 1 – Zone 1 : 40 unités
- Lot 2 – Zone 2 : 40 unités
- Commande = 90 → Maximum livrable = 80

**Résultat :** L'utilisateur doit préciser combien du Lot 1 et combien du Lot 2

### Exemple 2 : Article Simple
**Croissant (30 en stock, aucun réservé, 1 seul lot et 1 seule zone)**

**Résultat :** Pas besoin de choix → Livraison directe possible jusqu'à 30 croissants

## 🚨 Dépannage

### Problème : "La somme des quantités réparties doit être égale à la quantité demandée"
**Solution :** Vérifiez que le total des quantités dans toutes les lignes correspond exactement à la quantité demandée

### Problème : "La sélection d'un lot est obligatoire"
**Solution :** Sélectionnez un lot pour chaque ligne de répartition (article périssable ou plusieurs lots)

### Problème : "La sélection d'une zone est obligatoire"
**Solution :** Sélectionnez une zone de stockage pour chaque ligne (article dans plusieurs zones)

### Problème : Bouton "Répartir" ne s'affiche pas
**Solution :** Vérifiez que l'article n'est pas déjà en mode "livraison directe" (cas simple)

## 💡 Conseils d'utilisation

1. **Commencez par les articles simples** pour comprendre le système
2. **Vérifiez les alertes** avant de commencer la répartition
3. **Utilisez plusieurs lignes** pour répartir sur différents lots/zones
4. **Validez en temps réel** en regardant les totaux
5. **Consultez la disponibilité détaillée** pour optimiser vos choix

## 🔄 Workflow recommandé

1. **Créer la livraison** avec les articles et quantités
2. **Identifier les articles complexes** (avec bouton "Répartir")
3. **Ouvrir le modal de répartition** pour chaque article complexe
4. **Suivre les indicateurs** pour comprendre les contraintes
5. **Remplir le formulaire** selon les règles
6. **Valider** la répartition une fois complète
7. **Sauvegarder** la livraison

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que tous les champs obligatoires sont remplis
2. Consultez les messages d'erreur affichés
3. Vérifiez que les quantités correspondent à la demande
4. Contactez l'équipe technique si le problème persiste
