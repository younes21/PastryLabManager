/**
 * Test pour vérifier que le stock disponible exclut correctement les réservations 
 * de la livraison en cours de modification
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testStockAvailableExclusion() {
  console.log('🧪 Test de l\'exclusion des réservations du stock disponible');
  
  try {
    // 1. Créer une commande de test
    console.log('📝 Création d\'une commande de test...');
    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 1,
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: 'Commande de test pour vérifier l\'exclusion du stock',
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
    
    // 2. Récupérer le stock disponible initial
    console.log('📊 Récupération du stock disponible initial...');
    const initialPageData = await fetch(`${BASE_URL}/api/deliveries/page-data?orderId=${order.id}`);
    const initialData = await initialPageData.json();
    
    const initialArticle = initialData.articles.find(a => a.id === 1);
    const initialStockDispo = initialArticle?.totalDispo || 0;
    console.log(`📊 Stock disponible initial: ${initialStockDispo}`);
    
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
    
    // 4. Vérifier le stock disponible après création (sans exclusion)
    console.log('📊 Vérification du stock disponible après création (sans exclusion)...');
    const afterCreationData = await fetch(`${BASE_URL}/api/deliveries/page-data?orderId=${order.id}`);
    const afterCreation = await afterCreationData.json();
    
    const afterCreationArticle = afterCreation.articles.find(a => a.id === 1);
    const afterCreationStockDispo = afterCreationArticle?.totalDispo || 0;
    console.log(`📊 Stock disponible après création: ${afterCreationStockDispo}`);
    
    // Le stock disponible devrait être réduit de 3 (réservation)
    const expectedStockAfterCreation = initialStockDispo - 3;
    if (Math.abs(afterCreationStockDispo - expectedStockAfterCreation) > 0.001) {
      throw new Error(`Erreur: stock disponible attendu=${expectedStockAfterCreation}, obtenu=${afterCreationStockDispo}`);
    }
    
    // 5. Vérifier le stock disponible avec exclusion de la livraison
    console.log('📊 Vérification du stock disponible avec exclusion de la livraison...');
    const withExclusionData = await fetch(`${BASE_URL}/api/deliveries/page-data?orderId=${order.id}&excludeDeliveryId=${delivery.id}`);
    const withExclusion = await withExclusionData.json();
    
    const withExclusionArticle = withExclusion.articles.find(a => a.id === 1);
    const withExclusionStockDispo = withExclusionArticle?.totalDispo || 0;
    console.log(`📊 Stock disponible avec exclusion: ${withExclusionStockDispo}`);
    
    // Le stock disponible devrait être le même qu'initial (exclusion de la réservation)
    if (Math.abs(withExclusionStockDispo - initialStockDispo) > 0.001) {
      throw new Error(`Erreur: stock disponible avec exclusion attendu=${initialStockDispo}, obtenu=${withExclusionStockDispo}`);
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
    
    // 7. Vérifier le stock disponible après modification (sans exclusion)
    console.log('📊 Vérification du stock disponible après modification (sans exclusion)...');
    const afterUpdateData = await fetch(`${BASE_URL}/api/deliveries/page-data?orderId=${order.id}`);
    const afterUpdate = await afterUpdateData.json();
    
    const afterUpdateArticle = afterUpdate.articles.find(a => a.id === 1);
    const afterUpdateStockDispo = afterUpdateArticle?.totalDispo || 0;
    console.log(`📊 Stock disponible après modification: ${afterUpdateStockDispo}`);
    
    // Le stock disponible devrait être réduit de 5 (nouvelle réservation)
    const expectedStockAfterUpdate = initialStockDispo - 5;
    if (Math.abs(afterUpdateStockDispo - expectedStockAfterUpdate) > 0.001) {
      throw new Error(`Erreur: stock disponible après modification attendu=${expectedStockAfterUpdate}, obtenu=${afterUpdateStockDispo}`);
    }
    
    // 8. Vérifier le stock disponible avec exclusion après modification
    console.log('📊 Vérification du stock disponible avec exclusion après modification...');
    const withExclusionAfterUpdateData = await fetch(`${BASE_URL}/api/deliveries/page-data?orderId=${order.id}&excludeDeliveryId=${delivery.id}`);
    const withExclusionAfterUpdate = await withExclusionAfterUpdateData.json();
    
    const withExclusionAfterUpdateArticle = withExclusionAfterUpdate.articles.find(a => a.id === 1);
    const withExclusionAfterUpdateStockDispo = withExclusionAfterUpdateArticle?.totalDispo || 0;
    console.log(`📊 Stock disponible avec exclusion après modification: ${withExclusionAfterUpdateStockDispo}`);
    
    // Le stock disponible devrait être le même qu'initial (exclusion de la réservation)
    if (Math.abs(withExclusionAfterUpdateStockDispo - initialStockDispo) > 0.001) {
      throw new Error(`Erreur: stock disponible avec exclusion après modification attendu=${initialStockDispo}, obtenu=${withExclusionAfterUpdateStockDispo}`);
    }
    
    console.log('🎉 Test réussi ! L\'exclusion des réservations fonctionne correctement.');
    console.log('📋 Résumé:');
    console.log('   - Le stock disponible diminue lors de la création d\'une livraison');
    console.log('   - Le stock disponible augmente quand on exclut la livraison du calcul');
    console.log('   - La modification de la livraison met à jour correctement les réservations');
    console.log('   - L\'exclusion fonctionne aussi après modification');
    
  } catch (error) {
    console.error('❌ Test échoué:', error.message);
    throw error;
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testStockAvailableExclusion()
    .then(() => {
      console.log('✅ Tous les tests sont passés');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test échoué:', error);
      process.exit(1);
    });
}

module.exports = { testStockAvailableExclusion };
