// Test de l'annulation APRÈS validation
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testCancellationAfterValidation() {
  console.log('🧪 Test de l\'annulation APRÈS validation...\n');

  try {
    // 1. Créer une nouvelle livraison
    console.log('🔄 Création d\'une nouvelle livraison...');
    const testDelivery = {
      orderId: 13,
      deliveryAddress: '456 Test Avenue, Ville Test',
      deliveryNotes: 'Test d\'annulation APRÈS validation',
      status: 'pending',
      createdBy: 1
    };
    
    const deliveryResponse = await axios.post(`${BASE_URL}/deliveries`, testDelivery);
    const deliveryId = deliveryResponse.data.id;
    console.log(`✅ Livraison créée: ${deliveryResponse.data.code} (ID: ${deliveryId})`);

    // 2. Créer des réservations
    console.log('\n🔄 Création des réservations de stock...');
    const orderItems = [
      { id: 19, articleId: 36, quantity: '1.000' },
      { id: 20, articleId: 37, quantity: '1.000' }
    ];
    
    const reservationsResponse = await axios.post(`${BASE_URL}/deliveries/${deliveryId}/reservations`, { 
      orderItems 
    });
    console.log(`✅ Réservations créées: ${reservationsResponse.data.length} réservations`);

    // 3. Vérifier le stock avant validation
    console.log('\n📊 Stock disponible avant validation:');
    const articles = [36, 37];
    for (const articleId of articles) {
      const stockResponse = await axios.get(`${BASE_URL}/articles/${articleId}/available-stock`);
      console.log(`   Article ${articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
    }

    // 4. Valider la livraison
    console.log('\n🔄 Validation de la livraison...');
    const validateResponse = await axios.post(`${BASE_URL}/deliveries/${deliveryId}/validate`);
    console.log(`✅ Livraison validée: ${validateResponse.data.isValidated ? 'OUI' : 'NON'}`);

    // 5. Vérifier le stock après validation
    console.log('\n📊 Stock disponible après validation:');
    for (const articleId of articles) {
      const stockResponse = await axios.get(`${BASE_URL}/articles/${articleId}/available-stock`);
      console.log(`   Article ${articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
    }

    // 6. Test 1: Annulation avec retour au stock
    console.log('\n🔄 Test 1: Annulation avec retour au stock...');
    const cancelReturnResponse = await axios.post(`${BASE_URL}/deliveries/${deliveryId}/cancel-after-validation`, {
      reason: 'Produits retournés en bon état',
      isReturnToStock: true
    });
    console.log(`✅ Livraison annulée avec retour au stock: ${cancelReturnResponse.data.status}`);

    // 7. Vérifier le stock après retour
    console.log('\n📊 Stock disponible après retour au stock:');
    for (const articleId of articles) {
      const stockResponse = await axios.get(`${BASE_URL}/articles/${articleId}/available-stock`);
      console.log(`   Article ${articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
    }

    // 8. Créer une deuxième livraison pour tester le rebut
    console.log('\n🔄 Création d\'une deuxième livraison pour test rebut...');
    const testDelivery2 = {
      orderId: 13,
      deliveryAddress: '789 Test Boulevard, Ville Test',
      deliveryNotes: 'Test d\'annulation avec rebut',
      status: 'pending',
      createdBy: 1
    };
    
    const deliveryResponse2 = await axios.post(`${BASE_URL}/deliveries`, testDelivery2);
    const deliveryId2 = deliveryResponse2.data.id;
    console.log(`✅ Livraison créée: ${deliveryResponse2.data.code} (ID: ${deliveryId2})`);

    // 9. Créer des réservations et valider
    await axios.post(`${BASE_URL}/deliveries/${deliveryId2}/reservations`, { orderItems });
    await axios.post(`${BASE_URL}/deliveries/${deliveryId2}/validate`);
    console.log('✅ Deuxième livraison validée');

    // 10. Test 2: Annulation avec rebut
    console.log('\n🔄 Test 2: Annulation avec rebut...');
    const cancelWasteResponse = await axios.post(`${BASE_URL}/deliveries/${deliveryId2}/cancel-after-validation`, {
      reason: 'Produits endommagés lors du transport',
      isReturnToStock: false
    });
    console.log(`✅ Livraison annulée avec rebut: ${cancelWasteResponse.data.status}`);

    // 11. Vérifier le stock après rebut
    console.log('\n📊 Stock disponible après rebut:');
    for (const articleId of articles) {
      const stockResponse = await axios.get(`${BASE_URL}/articles/${articleId}/available-stock`);
      console.log(`   Article ${articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
    }

    console.log('\n🎉 Tous les tests d\'annulation APRÈS validation ont réussi !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   Request error:', error.request);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testCancellationAfterValidation();
