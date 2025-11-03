payement dashboard
creer moi une page reglements qui affiche la liste des payements, le tableau doit contenir les informations suivantes: 

- date commande
- client (firstName et lastName, sinon companyName)
- Commande (code commande depuis orderId)
- Livraison (code livraison depuis deliveryId)
- Date (date payement)
- Commandé (totalTTC depuis orderId)
- Livré (totalTTC depuis deliveryId)
- Facturé (totalTTC depuis invoiceId)
- Payé (amount)
- Etat (status)


- Livreur (receivedBy)
- Date Commande (date commande depuis orderId)
- Date Livraison (date livraison depuis deliveryId)


1. creer moi une page payements (n'utilise pas l'existante) permettant d'afficher les payements de tous les clients avec les spécifications suivantes:
***coté frontend:***
**filtre par:**
- interval de temp (date payement)
- etat pyament (status)
- clients (firstName et lastName, sinon companyName)
- commandes (code)
- livraisons (code)
- factures (code)

**liste des payement (valeurs changent selon le filtre) avec lazy loading ou pagination :**
- date
- client (firstName et lastName, sinon companyName)
- Payé (amount)
- Etat (status)
- commande (code + date)
- livraison (code + date)
- facturation (code + date)

**remarques**
- l'interface doit etre responsive (telephone, desktop)
- compacter un peut l'affichage comme dans deliveries  (ligne 1330) et utiliser le fitre debut fin aujourd'hui hier reinitialiser similaire a deliveries ligne (1251)

***coté backend:***
- les apis créées doivent etre optimisés 
- vérifier bien les nom des champs de la bdd dans frontend et backend
- une livraison est une inventory_operation de type LIVRAISON
- facturation existe table invoices et commande table orders


2. creer moi une page payment-dashboard (n'utilise pas l'existante) avec les stats suivantes:
coté frontend:
* utiliser des cards que tu doit organisés et compactés sur les stats de payement,  telque:
**filtre par:**
- interval de temp (date payement)
- etat pyament (status)
- clients (firstName et lastName, sinon companyName)
- commandes (code)
- livraisons (code)
- factures (code)

**stats payements (valeurs changent selon le filtre)**
- du: Facutré (invoice); commandé ; Livré (totalttc livré - perte - retour)
- Encaissements (payment)
- Encours client: Facutré (du - payment); commandé (du - commandé) ; Livré (totalttc livré - perte - retour - payment)
- Taux de Recouvrement (par rapport facturé,par rapport commandé, par rapport livré)

- Impayés / pertes
- Valeur des retours
- montant remboursé ( payment with amount <0)
- total transport (shippingTotalCost)
- total discount (invoice)
- nombre de commandes
- nombre de livraison
- nombre de facture


**remarques**
- l'interface doit etre responsive (telephone, desktop)
- l'ecriture doit etre un peut grande pour simplifier la visualisation
- il doit etre un vrai dashboard, tu peut les organiser comme tu veux (ce dashboard est pour le gérant du laboratoire de patisserie, ou il doit trouver les elements de reponse ici et facilement)

***coté backend:***
- les apis créées doivent etre optimisés
- vérifier bien les nom des champs de la bdd dans frontend et backend
- une livraison est une inventory_operation de type LIVRAISON
- facturation existe table invoices et commande table orders



- reference
- notes


- info commande: (code, totalttc, discount, date)
- info livraison: (code, totalttc, date)
- info facturation: (code, totalttc, date, discount, shippingTotalCost )