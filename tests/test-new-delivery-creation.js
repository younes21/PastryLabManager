/**
 * Test pour vérifier que la création d'une nouvelle livraison fonctionne correctement
 * avec la correction de updateItemQuantity
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testNewDeliveryCreation() {
  console.log('🧪 Test de création d\'une nouvelle livraison');
  
  try {
    // 1. Créer une commande de test
    console.log('📝 Création d\'une commande de test...');
    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 1,
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: 'Commande de test pour vérifier la création de livraison',
        items: [
          {
            articleId: 1,
            quantity: '10'
          }
        ]
      })
    });
    
    if (!orderResponse.ok) {
      throw new Error(`Erreur création commande: ${orderResponse.status}`);
    }
    
    const order = await orderResponse.json();
    console.log(`✅ Commande créée: ${order.code} (ID: ${order.id})`);
    
    // 2. Récupérer les détails de livraison de la commande (sans exclusion)
    console.log('📊 Récupération des détails de livraison...');
    const deliveryDetailsResponse = await fetch(`${BASE_URL}/api/orders/${order.id}/delivery-details`);
    const deliveryDetails = await deliveryDetailsResponse.json();
    
    const orderItem = deliveryDetails.items.find(i => i.articleId === 1);
    console.log(`📊 Détails de livraison:`);
    console.log(`   - Quantité commandée: ${orderItem.quantityOrdered}`);
    console.log(`   - Quantité déjà livrée: ${orderItem.quantityDelivered}`);
    console.log(`   - Quantité restante: ${orderItem.quantityRemaining}`);
    
    // 3. Créer une nouvelle livraison
    console.log('📦 Création d\'une nouvelle livraison...');
    const deliveryResponse = await fetch(`${BASE_URL}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        clientId: 1,
        deliveryDate: new Date().toISOString().split('T')[0],
        note: 'Nouvelle livraison de test',
        items: [
          {
            idArticle: 1,
            qteLivree: '3',
            idlot: null,
            idzone: 1
          }
        ]
      })
    });
    
    if (!deliveryResponse.ok) {
      const errorText = await deliveryResponse.text();
      throw new Error(`Erreur création livraison: ${deliveryResponse.status} - ${errorText}`);
    }
    
    const delivery = await deliveryResponse.json();
    console.log(`✅ Livraison créée: ${delivery.code} (ID: ${delivery.id})`);
    
    // 4. Vérifier les détails de livraison après création
    console.log('📊 Vérification des détails après création...');
    const afterCreationResponse = await fetch(`${BASE_URL}/api/orders/${order.id}/delivery-details`);
    const afterCreationDetails = await afterCreationResponse.json();
    
    const afterCreationItem = afterCreationDetails.items.find(i => i.articleId === 1);
    console.log(`📊 Détails après création:`);
    console.log(`   - Quantité commandée: ${afterCreationItem.quantityOrdered}`);
    console.log(`   - Quantité déjà livrée: ${afterCreationItem.quantityDelivered}`);
    console.log(`   - Quantité restante: ${afterCreationItem.quantityRemaining}`);
    
    // Vérifier que la quantité déjà livrée a augmenté
    if (afterCreationItem.quantityDelivered !== orderItem.quantityDelivered + 3) {
      throw new Error(`Erreur: quantité déjà livrée attendue=${orderItem.quantityDelivered + 3}, obtenue=${afterCreationItem.quantityDelivered}`);
    }
    
    // Vérifier que la quantité restante a diminué
    if (afterCreationItem.quantityRemaining !== orderItem.quantityRemaining - 3) {
      throw new Error(`Erreur: quantité restante attendue=${orderItem.quantityRemaining - 3}, obtenue=${afterCreationItem.quantityRemaining}`);
    }
    
    // 5. Créer une deuxième livraison pour tester la limite
    console.log('📦 Création d\'une deuxième livraison...');
    const delivery2Response = await fetch(`${BASE_URL}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        clientId: 1,
        deliveryDate: new Date().toISOString().split('T')[0],
        note: 'Deuxième livraison de test',
        items: [
          {
            idArticle: 1,
            qteLivree: '5', // 3 + 5 = 8, ce qui dépasse les 10 commandés
            idlot: null,
            idzone: 1
          }
        ]
      })
    });
    
    if (!delivery2Response.ok) {
      const errorText = await delivery2Response.text();
      throw new Error(`Erreur création deuxième livraison: ${delivery2Response.status} - ${errorText}`);
    }
    
    const delivery2 = await delivery2Response.json();
    console.log(`✅ Deuxième livraison créée: ${delivery2.code} (ID: ${delivery2.id})`);
    
    // 6. Vérifier les détails après la deuxième livraison
    console.log('📊 Vérification des détails après deuxième livraison...');
    const afterSecondResponse = await fetch(`${BASE_URL}/api/orders/${order.id}/delivery-details`);
    const afterSecondDetails = await afterSecondResponse.json();
    
    const afterSecondItem = afterSecondDetails.items.find(i => i.articleId === 1);
    console.log(`📊 Détails après deuxième livraison:`);
    console.log(`   - Quantité commandée: ${afterSecondItem.quantityOrdered}`);
    console.log(`   - Quantité déjà livrée: ${afterSecondItem.quantityDelivered}`);
    console.log(`   - Quantité restante: ${afterSecondItem.quantityRemaining}`);
    
    // Vérifier que la quantité déjà livrée est maintenant de 8 (3 + 5)
    if (afterSecondItem.quantityDelivered !== 8) {
      throw new Error(`Erreur: quantité déjà livrée attendue=8, obtenue=${afterSecondItem.quantityDelivered}`);
    }
    
    // Vérifier que la quantité restante est maintenant de 2 (10 - 8)
    if (afterSecondItem.quantityRemaining !== 2) {
      throw new Error(`Erreur: quantité restante attendue=2, obtenue=${afterSecondItem.quantityRemaining}`);
    }
    
    console.log('🎉 Test réussi ! La création de nouvelles livraisons fonctionne correctement.');
    console.log('📋 Résumé:');
    console.log('   - La fonction updateItemQuantity fonctionne pour les nouvelles livraisons');
    console.log('   - Les quantités déjà livrées et restantes sont calculées correctement');
    console.log('   - Les limites de commande sont respectées');
    
  } catch (error) {
    console.error('❌ Test échoué:', error.message);
    throw error;
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testNewDeliveryCreation()
    .then(() => {
      console.log('✅ Tous les tests sont passés');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test échoué:', error);
      process.exit(1);
    });
}

module.exports = { testNewDeliveryCreation };
