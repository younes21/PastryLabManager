// Test complet des annulations de livraison avec création des données nécessaires
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testSetupAndCancellations() {
  console.log('🧪 Test complet des annulations de livraison...\n');

  try {
    // 1. Vérifier l'état initial
    console.log('📊 État initial de la base de données...');
    
    const articlesResponse = await axios.get(`${BASE_URL}/articles`);
    console.log(`✅ Articles existants: ${articlesResponse.data.length}`);
    
    const ordersResponse = await axios.get(`${BASE_URL}/orders`);
    console.log(`✅ Commandes existantes: ${ordersResponse.data.length}`);
    
    const deliveriesResponse = await axios.get(`${BASE_URL}/deliveries`);
    console.log(`✅ Livraisons existantes: ${deliveriesResponse.data.length}\n`);

    // 2. Créer une commande de test si nécessaire
    let orderId;
    if (ordersResponse.data.length === 0) {
      console.log('🔄 Création d\'une commande de test...');
      
      const testOrder = {
        clientId: 1, // Utiliser le premier client disponible
        status: 'confirmed',
        orderDate: new Date().toISOString(),
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 jours
        notes: 'Commande de test pour les annulations',
        createdBy: 1
      };
      
      try {
        const orderResponse = await axios.post(`${BASE_URL}/orders`, testOrder);
        orderId = orderResponse.data.id;
        console.log(`✅ Commande créée: ID ${orderId}`);
      } catch (error) {
        console.log(`❌ Erreur lors de la création de la commande: ${error.response?.data?.message || error.message}`);
        return;
      }
    } else {
      orderId = ordersResponse.data[0].id;
      console.log(`✅ Utilisation de la commande existante: ID ${orderId}`);
    }

    // 3. Créer des articles de commande si nécessaire
    console.log('\n🔄 Création des articles de commande...');
    
    const orderItems = [
      { articleId: articlesResponse.data[0].id, quantity: '10.000', unitPrice: '5.00' },
      { articleId: articlesResponse.data[1].id, quantity: '5.000', unitPrice: '8.00' }
    ];
    
    try {
      const orderItemsResponse = await axios.post(`${BASE_URL}/ordersWithItems`, {
        order: { id: orderId },
        items: orderItems
      });
      console.log(`✅ Articles de commande créés: ${orderItemsResponse.data.items?.length || 0} articles`);
    } catch (error) {
      console.log(`⚠️  Erreur lors de la création des articles de commande: ${error.response?.data?.message || error.message}`);
      console.log('   Continuons avec la commande existante...');
    }

    // 4. Créer une livraison de test
    console.log('\n🔄 Création d\'une livraison de test...');
    
    const testDelivery = {
      orderId: orderId,
      deliveryAddress: '123 Test Street, Ville Test',
      deliveryNotes: 'Test des fonctionnalités d\'annulation',
      status: 'pending',
      createdBy: 1
    };
    
    let deliveryId;
    try {
      const deliveryResponse = await axios.post(`${BASE_URL}/deliveries`, testDelivery);
      deliveryId = deliveryResponse.data.id;
      console.log(`✅ Livraison créée: ${deliveryResponse.data.code} (ID: ${deliveryId})`);
    } catch (error) {
      console.log(`❌ Erreur lors de la création de la livraison: ${error.response?.data?.message || error.message}`);
      return;
    }

    // 5. Créer des réservations de stock
    console.log('\n🔄 Création des réservations de stock...');
    
    try {
      const reservationsResponse = await axios.post(`${BASE_URL}/deliveries/${deliveryId}/reservations`, { 
        orderItems: orderItems.map((item, index) => ({ 
          id: index + 1, 
          articleId: item.articleId, 
          quantity: item.quantity 
        }))
      });
      console.log(`✅ Réservations créées: ${reservationsResponse.data.length} réservations`);
    } catch (error) {
      console.log(`❌ Erreur lors de la création des réservations: ${error.response?.data?.message || error.message}`);
      return;
    }

    // 6. Vérifier le stock disponible avant annulation
    console.log('\n📊 Stock disponible avant annulation:');
    for (const item of orderItems) {
      try {
        const stockResponse = await axios.get(`${BASE_URL}/articles/${item.articleId}/available-stock`);
        console.log(`   Article ${item.articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
      } catch (error) {
        console.log(`   Article ${item.articleId}: Erreur lors de la vérification du stock`);
      }
    }

    // 7. Test 1: Annulation AVANT validation (retour au stock)
    console.log('\n🔄 Test 1: Annulation AVANT validation...');
    try {
      const cancelBeforeResponse = await axios.post(`${BASE_URL}/deliveries/${deliveryId}/cancel-before-validation`, {
        reason: 'Client a changé d\'avis'
      });
      console.log(`✅ Livraison annulée: ${cancelBeforeResponse.data.status}`);
    } catch (error) {
      console.log(`❌ Erreur lors de l'annulation: ${error.response?.data?.message || error.message}`);
    }

    // 8. Vérifier le stock disponible après annulation
    console.log('\n📊 Stock disponible après annulation:');
    for (const item of orderItems) {
      try {
        const stockResponse = await axios.get(`${BASE_URL}/articles/${item.articleId}/available-stock`);
        console.log(`   Article ${item.articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
      } catch (error) {
        console.log(`   Article ${item.articleId}: Erreur lors de la vérification du stock`);
      }
    }

    console.log('\n🎉 Test des annulations AVANT validation terminé !');
    console.log('\n📋 Prochaines étapes pour tester les annulations APRÈS validation:');
    console.log('   1. Créer une nouvelle livraison');
    console.log('   2. Créer des réservations');
    console.log('   3. Valider la livraison');
    console.log('   4. Tester l\'annulation avec retour au stock');
    console.log('   5. Tester l\'annulation avec rebut');

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

testSetupAndCancellations();
