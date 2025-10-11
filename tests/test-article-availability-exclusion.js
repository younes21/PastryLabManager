/**
 * Test pour vérifier que l'endpoint /api/articles/:articleId/availability 
 * exclut correctement les réservations de la livraison en cours de modification
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testArticleAvailabilityExclusion() {
  console.log('🧪 Test de l\'exclusion des réservations dans l\'endpoint availability');
  
  try {
    // 1. Créer une commande de test
    console.log('📝 Création d\'une commande de test...');
    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 1,
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: 'Commande de test pour vérifier l\'exclusion dans availability',
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
    
    // 2. Récupérer la disponibilité initiale de l'article
    console.log('📊 Récupération de la disponibilité initiale...');
    const initialAvailability = await fetch(`${BASE_URL}/api/articles/1/availability`);
    const initialData = await initialAvailability.json();
    
    console.log(`📊 Disponibilité initiale:`);
    console.log(`   - Stock total: ${initialData.summary.totalStock}`);
    console.log(`   - Stock réservé: ${initialData.summary.totalReserved}`);
    console.log(`   - Stock disponible: ${initialData.summary.totalAvailable}`);
    
    // 3. Créer une livraison qui va réserver du stock
    console.log('📦 Création d\'une livraison (quantité=3)...');
    const deliveryResponse = await fetch(`${BASE_URL}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        clientId: 1,
        deliveryDate: new Date().toISOString().split('T')[0],
        note: 'Livraison de test pour réserver du stock',
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
      throw new Error(`Erreur création livraison: ${deliveryResponse.status}`);
    }
    
    const delivery = await deliveryResponse.json();
    console.log(`✅ Livraison créée: ${delivery.code} (ID: ${delivery.id})`);
    
    // 4. Vérifier la disponibilité après création (sans exclusion)
    console.log('📊 Vérification de la disponibilité après création (sans exclusion)...');
    const afterCreationAvailability = await fetch(`${BASE_URL}/api/articles/1/availability`);
    const afterCreationData = await afterCreationAvailability.json();
    
    console.log(`📊 Disponibilité après création:`);
    console.log(`   - Stock total: ${afterCreationData.summary.totalStock}`);
    console.log(`   - Stock réservé: ${afterCreationData.summary.totalReserved}`);
    console.log(`   - Stock disponible: ${afterCreationData.summary.totalAvailable}`);
    
    // Le stock réservé devrait augmenter de 3
    const expectedReservedAfterCreation = initialData.summary.totalReserved + 3;
    if (Math.abs(afterCreationData.summary.totalReserved - expectedReservedAfterCreation) > 0.001) {
      throw new Error(`Erreur: stock réservé attendu=${expectedReservedAfterCreation}, obtenu=${afterCreationData.summary.totalReserved}`);
    }
    
    // 5. Vérifier la disponibilité avec exclusion de la livraison
    console.log('📊 Vérification de la disponibilité avec exclusion de la livraison...');
    const withExclusionAvailability = await fetch(`${BASE_URL}/api/articles/1/availability?excludeDeliveryId=${delivery.id}`);
    const withExclusionData = await withExclusionAvailability.json();
    
    console.log(`📊 Disponibilité avec exclusion:`);
    console.log(`   - Stock total: ${withExclusionData.summary.totalStock}`);
    console.log(`   - Stock réservé: ${withExclusionData.summary.totalReserved}`);
    console.log(`   - Stock disponible: ${withExclusionData.summary.totalAvailable}`);
    
    // Le stock réservé devrait être le même qu'initial (exclusion de la réservation)
    if (Math.abs(withExclusionData.summary.totalReserved - initialData.summary.totalReserved) > 0.001) {
      throw new Error(`Erreur: stock réservé avec exclusion attendu=${initialData.summary.totalReserved}, obtenu=${withExclusionData.summary.totalReserved}`);
    }
    
    // Le stock disponible devrait être le même qu'initial
    if (Math.abs(withExclusionData.summary.totalAvailable - initialData.summary.totalAvailable) > 0.001) {
      throw new Error(`Erreur: stock disponible avec exclusion attendu=${initialData.summary.totalAvailable}, obtenu=${withExclusionData.summary.totalAvailable}`);
    }
    
    // 6. Modifier la livraison (augmenter la quantité)
    console.log('✏️ Modification de la livraison (quantité: 3 → 5)...');
    const updateResponse = await fetch(`${BASE_URL}/api/deliveries/${delivery.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        clientId: 1,
        deliveryDate: new Date().toISOString().split('T')[0],
        note: 'Livraison modifiée',
        items: [
          {
            idArticle: 1,
            qteLivree: '5', // Augmenter de 3 à 5
            idlot: null,
            idzone: 1
          }
        ]
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Erreur modification livraison: ${updateResponse.status} - ${errorText}`);
    }
    
    const updatedDelivery = await updateResponse.json();
    console.log(`✅ Livraison modifiée: ${updatedDelivery.code}`);
    
    // 7. Vérifier la disponibilité après modification (sans exclusion)
    console.log('📊 Vérification de la disponibilité après modification (sans exclusion)...');
    const afterUpdateAvailability = await fetch(`${BASE_URL}/api/articles/1/availability`);
    const afterUpdateData = await afterUpdateAvailability.json();
    
    console.log(`📊 Disponibilité après modification:`);
    console.log(`   - Stock total: ${afterUpdateData.summary.totalStock}`);
    console.log(`   - Stock réservé: ${afterUpdateData.summary.totalReserved}`);
    console.log(`   - Stock disponible: ${afterUpdateData.summary.totalAvailable}`);
    
    // Le stock réservé devrait être de 5 (nouvelle réservation)
    const expectedReservedAfterUpdate = initialData.summary.totalReserved + 5;
    if (Math.abs(afterUpdateData.summary.totalReserved - expectedReservedAfterUpdate) > 0.001) {
      throw new Error(`Erreur: stock réservé après modification attendu=${expectedReservedAfterUpdate}, obtenu=${afterUpdateData.summary.totalReserved}`);
    }
    
    // 8. Vérifier la disponibilité avec exclusion après modification
    console.log('📊 Vérification de la disponibilité avec exclusion après modification...');
    const withExclusionAfterUpdateAvailability = await fetch(`${BASE_URL}/api/articles/1/availability?excludeDeliveryId=${delivery.id}`);
    const withExclusionAfterUpdateData = await withExclusionAfterUpdateAvailability.json();
    
    console.log(`📊 Disponibilité avec exclusion après modification:`);
    console.log(`   - Stock total: ${withExclusionAfterUpdateData.summary.totalStock}`);
    console.log(`   - Stock réservé: ${withExclusionAfterUpdateData.summary.totalReserved}`);
    console.log(`   - Stock disponible: ${withExclusionAfterUpdateData.summary.totalAvailable}`);
    
    // Le stock réservé devrait être le même qu'initial (exclusion de la réservation)
    if (Math.abs(withExclusionAfterUpdateData.summary.totalReserved - initialData.summary.totalReserved) > 0.001) {
      throw new Error(`Erreur: stock réservé avec exclusion après modification attendu=${initialData.summary.totalReserved}, obtenu=${withExclusionAfterUpdateData.summary.totalReserved}`);
    }
    
    console.log('🎉 Test réussi ! L\'exclusion des réservations dans l\'endpoint availability fonctionne correctement.');
    console.log('📋 Résumé:');
    console.log('   - L\'endpoint availability exclut correctement les réservations de la livraison spécifiée');
    console.log('   - Le stock réservé diminue quand on exclut la livraison du calcul');
    console.log('   - Le stock disponible augmente quand on exclut la livraison du calcul');
    console.log('   - L\'exclusion fonctionne aussi après modification de la livraison');
    
  } catch (error) {
    console.error('❌ Test échoué:', error.message);
    throw error;
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testArticleAvailabilityExclusion()
    .then(() => {
      console.log('✅ Tous les tests sont passés');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test échoué:', error);
      process.exit(1);
    });
}

module.exports = { testArticleAvailabilityExclusion };
