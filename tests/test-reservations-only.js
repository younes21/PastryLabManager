// Test simple de l'endpoint des réservations
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testReservationsOnly() {
  console.log('🧪 Test de l\'endpoint des réservations...\n');

  try {
    // Test avec une livraison existante (ID 8)
    const deliveryId = 8;
    console.log(`🔄 Test des réservations pour la livraison ${deliveryId}...`);
    
    const orderItems = [
      { id: 19, articleId: 36, quantity: '1.000' },
      { id: 20, articleId: 37, quantity: '1.000' }
    ];
    
    console.log('📤 Envoi de la requête...');
    console.log('   URL:', `${BASE_URL}/deliveries/${deliveryId}/reservations`);
    console.log('   Data:', JSON.stringify({ orderItems }, null, 2));
    
    const response = await axios.post(`${BASE_URL}/deliveries/${deliveryId}/reservations`, { 
      orderItems 
    });
    
    console.log('✅ Réponse reçue:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erreur lors du test:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
      console.error('   Headers:', error.response.headers);
    } else if (error.request) {
      console.error('   Request error:', error.request);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testReservationsOnly();
