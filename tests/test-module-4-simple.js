import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Configuration axios
axios.defaults.timeout = 10000;

async function testModule4Simple() {
  console.log('🧪 TEST SIMPLIFIÉ DU MODULE 4 - Vérification des méthodes d\'annulation');
  console.log('=' .repeat(70));

  try {
    // 1. Créer une livraison de test
    console.log('\n📦 1. Création d\'une livraison de test...');
    const deliveryData = {
      code: 'TEST-MOD4-SIMPLE',
      orderId: 13,
      deliveryMethodId: 1,
      scheduledDate: new Date().toISOString(),
      notes: 'Livraison de test pour Module 4 (simple)',
      createdBy: 1
    };

    const deliveryResponse = await axios.post(`${BASE_URL}/deliveries`, deliveryData);
    const delivery = deliveryResponse.data;
    console.log(`✅ Livraison créée: ID ${delivery.id}, Code: ${delivery.code}`);

    // 2. Tester l'annulation avant validation
    console.log('\n🔄 2. Test annulation avant validation...');
    const cancelBeforeData = {
      reason: 'Test annulation avant validation'
    };

    const cancelBeforeResponse = await axios.post(`${BASE_URL}/deliveries/${delivery.id}/cancel-before-validation`, cancelBeforeData);
    console.log(`✅ Annulation avant validation réussie: ${cancelBeforeResponse.data.code}`);
    console.log(`   Statut: ${cancelBeforeResponse.data.status}`);
    console.log(`   Raison: ${cancelBeforeResponse.data.cancellationReason}`);

    console.log('\n🎉 MODULE 4 - ANNULATION AVANT VALIDATION TESTÉ AVEC SUCCÈS !');

  } catch (error) {
    console.error('\n❌ ERREUR lors du test du Module 4:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.data}`);
    } else if (error.request) {
      console.error('   Pas de réponse du serveur');
    } else {
      console.error(`   Erreur: ${error.message}`);
    }
  }
}

// Exécuter le test
testModule4Simple().catch(console.error);
