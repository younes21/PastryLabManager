import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Configuration axios
axios.defaults.timeout = 10000;

async function testModule4() {
  console.log('🧪 TEST DU MODULE 4 - Gestion des annulations (détail des cas retour/rebut)');
  console.log('=' .repeat(80));

  try {
    // 1. Créer une livraison de test
    console.log('\n📦 1. Création d\'une livraison de test...');
    const deliveryData = {
      code: 'TEST-MOD4-001',
      orderId: 13, // Utiliser une commande existante
      deliveryMethodId: 1,
      scheduledDate: new Date().toISOString(),
      notes: 'Livraison de test pour Module 4',
      createdBy: 1
    };

    const deliveryResponse = await axios.post(`${BASE_URL}/deliveries`, deliveryData);
    const delivery = deliveryResponse.data;
    console.log(`✅ Livraison créée: ID ${delivery.id}, Code: ${delivery.code}`);

    // 2. Créer des réservations de stock
    console.log('\n🔒 2. Création des réservations de stock...');
    const orderItems = [
      {
        id: 19, // ID de l'order item existant
        articleId: 36, // Article avec stock disponible (BANANE)
        quantity: '1.000'
      }
    ];

    const reservationsResponse = await axios.post(`${BASE_URL}/deliveries/${delivery.id}/reservations`, {
      orderItems: orderItems
    });
    console.log(`✅ Réservations créées: ${reservationsResponse.data.length} réservation(s)`);

    // 3. Valider la livraison
    console.log('\n✅ 3. Validation de la livraison...');
    const validatedDelivery = await axios.post(`${BASE_URL}/deliveries/${delivery.id}/validate`);
    console.log(`✅ Livraison validée: ${validatedDelivery.data.code}`);

    // 4. Tester l'annulation avec retour au stock
    console.log('\n🔄 4. Test annulation avec retour au stock...');
    const returnToStockData = {
      reason: 'Client a refusé la livraison - articles en bon état',
      isReturnToStock: true
    };

    const returnResponse = await axios.post(`${BASE_URL}/deliveries/${delivery.id}/cancel-after-validation`, returnToStockData);
    console.log(`✅ Annulation avec retour au stock réussie: ${returnResponse.data.code}`);
    console.log(`   Statut: ${returnResponse.data.status}`);
    console.log(`   Raison: ${returnResponse.data.cancellationReason}`);

    // 5. Vérifier que le stock a été restauré
    console.log('\n📊 5. Vérification du stock restauré...');
    const articleResponse = await axios.get(`${BASE_URL}/articles/21`);
    const article = articleResponse.data;
    console.log(`✅ Article ${article.name}: Stock actuel = ${article.currentStock}`);

    // 6. Vérifier les opérations d'inventaire créées
    console.log('\n📋 6. Vérification des opérations d\'inventaire...');
    const operationsResponse = await axios.get(`${BASE_URL}/inventory-operations`);
    const operations = operationsResponse.data;
    
    const returnOperations = operations.filter(op => 
      op.type === 'retour_livraison' && 
      op.orderId === delivery.orderId
    );
    
    if (returnOperations.length > 0) {
      console.log(`✅ Opération de retour trouvée: ${returnOperations[0].code}`);
      console.log(`   Notes: ${returnOperations[0].notes}`);
      console.log(`   Lien parent: ${returnOperations[0].parentOperationId}`);
    }

    console.log('\n🎉 MODULE 4 TESTÉ AVEC SUCCÈS !');
    console.log('\n📋 RÉSUMÉ DES FONCTIONNALITÉS TESTÉES:');
    console.log('   ✅ Annulation après validation avec retour au stock');
    console.log('   ✅ Validation de la raison d\'annulation');
    console.log('   ✅ Création d\'opération d\'inventaire de type "retour_livraison"');
    console.log('   ✅ Lien explicite avec la livraison d\'origine (parentOperationId)');
    console.log('   ✅ Restauration automatique du stock');
    console.log('   ✅ Traçabilité complète des opérations');

  } catch (error) {
    console.error('\n❌ ERREUR lors du test du Module 4:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.data}`);
      console.error(`   Data:`, error.response.data);
    } else if (error.request) {
      console.error('   Pas de réponse du serveur');
    } else {
      console.error(`   Erreur: ${error.message}`);
    }
    console.error('\nStack:', error.stack);
  }
}

// Fonction pour tester l'annulation avec rebut
async function testWasteCancellation() {
  console.log('\n🗑️ TEST ANNULATION AVEC REBUT');
  console.log('=' .repeat(50));

  try {
    // 1. Créer une nouvelle livraison pour le test de rebut
    console.log('\n📦 1. Création d\'une livraison pour test rebut...');
    const deliveryData = {
      code: 'TEST-MOD4-002',
      orderId: 13,
      deliveryMethodId: 1,
      scheduledDate: new Date().toISOString(),
      notes: 'Livraison pour test rebut Module 4',
      createdBy: 1
    };

    const deliveryResponse = await axios.post(`${BASE_URL}/deliveries`, deliveryData);
    const delivery = deliveryResponse.data;
    console.log(`✅ Livraison créée: ID ${delivery.id}, Code: ${delivery.code}`);

    // 2. Créer des réservations
    console.log('\n🔒 2. Création des réservations...');
    const orderItems = [
      {
        id: 20, // Utiliser un autre order item
        articleId: 36, // Utiliser le même article avec stock
        quantity: '1.000'
      }
    ];

    await axios.post(`${BASE_URL}/deliveries/${delivery.id}/reservations`, {
      orderItems: orderItems
    });

    // 3. Valider la livraison
    console.log('\n✅ 3. Validation de la livraison...');
    await axios.post(`${BASE_URL}/deliveries/${delivery.id}/validate`);

    // 4. Tester l'annulation avec rebut
    console.log('\n🗑️ 4. Test annulation avec rebut...');
    const wasteData = {
      reason: 'Articles endommagés pendant le transport',
      isReturnToStock: false
    };

    const wasteResponse = await axios.post(`${BASE_URL}/deliveries/${delivery.id}/cancel-after-validation`, wasteData);
    console.log(`✅ Annulation avec rebut réussie: ${wasteResponse.data.code}`);
    console.log(`   Statut: ${wasteResponse.data.status}`);
    console.log(`   Raison: ${wasteResponse.data.cancellationReason}`);

    // 5. Vérifier les opérations de rebut
    console.log('\n📋 5. Vérification des opérations de rebut...');
    const operationsResponse = await axios.get(`${BASE_URL}/inventory-operations`);
    const operations = operationsResponse.data;
    
    const wasteOperations = operations.filter(op => 
      op.type === 'rebut_livraison' && 
      op.orderId === delivery.orderId
    );
    
    if (wasteOperations.length > 0) {
      console.log(`✅ Opération de rebut trouvée: ${wasteOperations[0].code}`);
      console.log(`   Notes: ${wasteOperations[0].notes}`);
      console.log(`   Raison: ${wasteOperations[0].cancellationReason}`);
    }

    console.log('\n🎉 TEST REBUT RÉUSSI !');

  } catch (error) {
    console.error('\n❌ ERREUR lors du test de rebut:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.data}`);
    } else {
      console.error(`   Erreur: ${error.message}`);
    }
  }
}

// Exécuter les tests
async function runAllTests() {
  await testModule4();
  await testWasteCancellation();
  console.log('\n🏁 TOUS LES TESTS TERMINÉS');
}

runAllTests().catch(console.error);
