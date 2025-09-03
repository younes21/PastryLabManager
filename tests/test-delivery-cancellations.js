// Test des annulations de livraison
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testDeliveryCancellations() {
  console.log('🧪 Test des annulations de livraison...\n');

  try {
    // 1. Vérifier l'état de la base de données
    console.log('📊 Vérification de l\'état de la base de données...');
    
    let deliveriesResponse, articlesResponse, ordersResponse;
    
    // Vérifier les livraisons existantes
    try {
      deliveriesResponse = await axios.get(`${BASE_URL}/deliveries`);
      console.log(`✅ Livraisons existantes: ${deliveriesResponse.data.length || 0}`);
    } catch (error) {
      console.log(`❌ Erreur lors de la récupération des livraisons: ${error.response?.data?.message || error.message}`);
    }

    // Vérifier les articles existants
    try {
      articlesResponse = await axios.get(`${BASE_URL}/articles`);
      console.log(`✅ Articles existants: ${articlesResponse.data.length || 0}`);
      if (articlesResponse.data.length > 0) {
        console.log(`   Premier article: ID ${articlesResponse.data[0].id}, Nom: ${articlesResponse.data[0].name}`);
      }
    } catch (error) {
      console.log(`❌ Erreur lors de la récupération des articles: ${error.response?.data?.message || error.message}`);
    }

    // Vérifier les commandes existantes
    try {
      ordersResponse = await axios.get(`${BASE_URL}/orders`);
      console.log(`✅ Commandes existantes: ${ordersResponse.data.length || 0}`);
      if (ordersResponse.data.length > 0) {
        console.log(`   Première commande: ID ${ordersResponse.data[0].id}, Statut: ${ordersResponse.data[0].status}`);
      }
    } catch (error) {
      console.log(`❌ Erreur lors de la récupération des commandes: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n📋 Résumé de l\'état de la base:');
    console.log('   - Pour tester les annulations, nous avons besoin de:');
    console.log('     * Au moins une commande existante');
    console.log('     * Au moins un article avec du stock');
    console.log('     * La possibilité de créer des livraisons');
    
    // Si nous avons des données, testons la création d'une livraison
    if (articlesResponse && articlesResponse.data && articlesResponse.data.length > 0 && ordersResponse && ordersResponse.data && ordersResponse.data.length > 0) {
      console.log('\n🔄 Test de création d\'une livraison...');
      
      const testDelivery = {
        orderId: ordersResponse.data[0].id,
        deliveryAddress: '123 Test Street',
        deliveryNotes: 'Test d\'annulation',
        status: 'pending',
        createdBy: 1
      };
      
      try {
        const deliveryResponse = await axios.post(`${BASE_URL}/deliveries`, testDelivery);
        console.log(`✅ Livraison créée: ${deliveryResponse.data.code} (ID: ${deliveryResponse.data.id})`);
        
        // Test des fonctionnalités d'annulation
        console.log('\n🔄 Test des fonctionnalités d\'annulation...');
        
        // Test 1: Annulation AVANT validation
        console.log('\n🔄 Test 1: Annulation AVANT validation...');
        const cancelBeforeResponse = await axios.post(`${BASE_URL}/deliveries/${deliveryResponse.data.id}/cancel-before-validation`, {
          reason: 'Client a changé d\'avis'
        });
        console.log(`✅ Livraison annulée: ${cancelBeforeResponse.data.status}`);
        
      } catch (error) {
        console.log(`❌ Erreur lors de la création de la livraison: ${error.response?.data?.message || error.message}`);
      }
    } else {
      console.log('\n⚠️  Données insuffisantes pour tester les annulations.');
      console.log('   Veuillez d\'abord créer des articles et des commandes dans la base de données.');
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
      console.error('   Headers:', error.response.headers);
    } else if (error.request) {
      console.error('   Request error:', error.request);
    } else {
      console.error('   Error:', error.message);
    }
    console.error('   Stack:', error.stack);
  }
}

testDeliveryCancellations();
