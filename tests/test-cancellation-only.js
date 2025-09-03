// Test simple de l'endpoint d'annulation AVANT validation
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testCancellationOnly() {
  console.log('🧪 Test de l\'endpoint d\'annulation AVANT validation...\n');

  try {
    // Test avec la livraison existante (ID 8) qui a des réservations
    const deliveryId = 8;
    console.log(`🔄 Test de l'annulation pour la livraison ${deliveryId}...`);
    
    // Vérifier le stock disponible avant annulation
    console.log('\n📊 Stock disponible avant annulation:');
    const articles = [36, 37]; // BANANE et FRAISE
    for (const articleId of articles) {
      try {
        const stockResponse = await axios.get(`${BASE_URL}/articles/${articleId}/available-stock`);
        console.log(`   Article ${articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
      } catch (error) {
        console.log(`   Article ${articleId}: Erreur lors de la vérification du stock`);
      }
    }
    
    // Test de l'annulation
    console.log('\n🔄 Envoi de la requête d\'annulation...');
    console.log('   URL:', `${BASE_URL}/deliveries/${deliveryId}/cancel-before-validation`);
    console.log('   Data:', JSON.stringify({ reason: 'Test d\'annulation' }, null, 2));
    
    const response = await axios.post(`${BASE_URL}/deliveries/${deliveryId}/cancel-before-validation`, {
      reason: 'Test d\'annulation'
    });
    
    console.log('✅ Réponse reçue:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));

    // Vérifier le stock disponible après annulation
    console.log('\n📊 Stock disponible après annulation:');
    for (const articleId of articles) {
      try {
        const stockResponse = await axios.get(`${BASE_URL}/articles/${articleId}/available-stock`);
        console.log(`   Article ${articleId}: Stock disponible = ${stockResponse.data.availableStock}`);
      } catch (error) {
        console.log(`   Article ${articleId}: Erreur lors de la vérification du stock`);
      }
    }

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

testCancellationOnly();
