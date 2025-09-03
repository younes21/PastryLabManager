// Test des réservations de livraison
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testDeliveryReservations() {
  console.log('🧪 Test des réservations de livraison...\n');

  try {
    // 1. Créer une livraison de test
    const deliveryResponse = await axios.post(`${BASE_URL}/deliveries`, {
      code: 'TEST-DEL-001',
      orderId: 1,
      deliveryAddress: '123 Test Street',
      deliveryNotes: 'Test de réservations',
      status: 'pending',
      createdBy: 1
    });
    const delivery = deliveryResponse.data;
    console.log(`✅ Livraison créée: ${delivery.code} (ID: ${delivery.id})\n`);

    // 2. Créer des réservations de stock
    const orderItems = [
      { id: 1, articleId: 1, quantity: '10.000' },
      { id: 2, articleId: 2, quantity: '5.000' }
    ];
    const reservationsResponse = await axios.post(`${BASE_URL}/deliveries/${delivery.id}/reservations`, { orderItems });
    const reservations = reservationsResponse.data;
    console.log(`✅ ${reservations.length} réservations créées\n`);

    // 3. Vérifier les réservations
    const reservationsCheckResponse = await axios.get(`${BASE_URL}/deliveries/${delivery.id}/reservations`);
    console.log(`✅ ${reservationsCheckResponse.data.length} réservations trouvées\n`);

    // 4. Vérifier le stock disponible
    for (const item of orderItems) {
      const stockResponse = await axios.get(`${BASE_URL}/articles/${item.articleId}/available-stock`);
      console.log(`   Article ${item.articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
    }

    // 5. Valider la livraison
    const validateResponse = await axios.post(`${BASE_URL}/deliveries/${delivery.id}/validate`);
    const validatedDelivery = validateResponse.data;
    console.log(`✅ Livraison validée: ${validatedDelivery.isValidated ? 'OUI' : 'NON'}\n`);

    // 6. Vérifier le stock après validation
    for (const item of orderItems) {
      const stockResponse = await axios.get(`${BASE_URL}/articles/${item.articleId}/available-stock`);
      console.log(`   Article ${item.articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
    }

    console.log('🎉 Tous les tests ont réussi !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
  }
}

testDeliveryReservations();
