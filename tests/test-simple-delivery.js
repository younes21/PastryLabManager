// Test simple des annulations de livraison
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testSimpleDelivery() {
  console.log('🧪 Test simple des annulations de livraison...\n');

  try {
    // 1. Créer une livraison de test avec la commande existante
    console.log('🔄 Création d\'une livraison de test...');
    
    const testDelivery = {
      orderId: 13, // Commande créée précédemment
      deliveryAddress: '123 Test Street, Ville Test',
      deliveryNotes: 'Test des fonctionnalités d\'annulation',
      status: 'pending',
      createdBy: 1
    };
    
    const deliveryResponse = await axios.post(`${BASE_URL}/deliveries`, testDelivery);
    const deliveryId = deliveryResponse.data.id;
    console.log(`✅ Livraison créée: ${deliveryResponse.data.code} (ID: ${deliveryId})`);

    // 2. Créer des réservations de stock simples
    console.log('\n🔄 Création des réservations de stock...');
    
    const orderItems = [
      { id: 19, articleId: 36, quantity: '1.000' }, // BANANE - ID de l'article de commande créé
      { id: 20, articleId: 37, quantity: '1.000' }  // FRAISE - ID de l'article de commande créé
    ];
    
    try {
      const reservationsResponse = await axios.post(`${BASE_URL}/deliveries/${deliveryId}/reservations`, { 
        orderItems 
      });
      console.log(`✅ Réservations créées: ${reservationsResponse.data.length} réservations`);
    } catch (error) {
      console.error('❌ Erreur lors de la création des réservations:');
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      } else {
        console.error('   Error:', error.message);
      }
      return;
    }

    // 3. Vérifier le stock disponible avant annulation
    console.log('\n📊 Stock disponible avant annulation:');
    for (const item of orderItems) {
      const stockResponse = await axios.get(`${BASE_URL}/articles/${item.articleId}/available-stock`);
      console.log(`   Article ${item.articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
    }

    // 4. Test de l'annulation AVANT validation
    console.log('\n🔄 Test de l\'annulation AVANT validation...');
    const cancelBeforeResponse = await axios.post(`${BASE_URL}/deliveries/${deliveryId}/cancel-before-validation`, {
      reason: 'Client a changé d\'avis'
    });
    console.log(`✅ Livraison annulée: ${cancelBeforeResponse.data.status}`);

    // 5. Vérifier le stock disponible après annulation
    console.log('\n📊 Stock disponible après annulation:');
    for (const item of orderItems) {
      const stockResponse = await axios.get(`${BASE_URL}/articles/${item.articleId}/available-stock`);
      console.log(`   Article ${item.articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
    }

    console.log('\n🎉 Test de l\'annulation AVANT validation réussi !');

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

testSimpleDelivery();
