// Script de test pour vérifier la liaison entre commandes et livraisons
const fetch = require('node-fetch');

async function testDeliveryOrderLink() {
  try {
    console.log('🧪 Test de la liaison commandes-livraisons...');
    
    // Test 1: Récupérer toutes les livraisons
    console.log('\n1. Récupération de toutes les livraisons...');
    const allDeliveries = await fetch('http://localhost:3000/api/inventory-operations?type=delivery');
    const allDeliveriesData = await allDeliveries.json();
    console.log(`✅ ${allDeliveriesData.length} livraisons trouvées`);
    
    if (allDeliveriesData.length > 0) {
      const firstDelivery = allDeliveriesData[0];
      console.log(`   Première livraison: ${firstDelivery.code} (ID: ${firstDelivery.id})`);
      
      // Test 2: Récupérer les livraisons d'une commande spécifique (si orderId existe)
      if (firstDelivery.orderId) {
        console.log(`\n2. Récupération des livraisons pour la commande ${firstDelivery.orderId}...`);
        const orderDeliveries = await fetch(`http://localhost:3000/api/inventory-operations?type=delivery&orderId=${firstDelivery.orderId}`);
        const orderDeliveriesData = await orderDeliveries.json();
        console.log(`✅ ${orderDeliveriesData.length} livraisons trouvées pour la commande ${firstDelivery.orderId}`);
        
        orderDeliveriesData.forEach(delivery => {
          console.log(`   - ${delivery.code} (${delivery.status})`);
        });
      } else {
        console.log('\n2. Aucune commande associée à cette livraison');
      }
    }
    
    // Test 3: Récupérer les commandes
    console.log('\n3. Récupération des commandes...');
    const orders = await fetch('http://localhost:3000/api/orders');
    const ordersData = await orders.json();
    console.log(`✅ ${ordersData.length} commandes trouvées`);
    
    if (ordersData.length > 0) {
      const firstOrder = ordersData[0];
      console.log(`   Première commande: ${firstOrder.code} (ID: ${firstOrder.id})`);
      
      // Test 4: Récupérer les livraisons d'une commande spécifique
      console.log(`\n4. Récupération des livraisons pour la commande ${firstOrder.id}...`);
      const orderDeliveries = await fetch(`http://localhost:3000/api/inventory-operations?type=delivery&orderId=${firstOrder.id}`);
      const orderDeliveriesData = await orderDeliveries.json();
      console.log(`✅ ${orderDeliveriesData.length} livraisons trouvées pour la commande ${firstOrder.id}`);
      
      orderDeliveriesData.forEach(delivery => {
        console.log(`   - ${delivery.code} (${delivery.status})`);
      });
    }
    
    console.log('\n🎉 Tests terminés avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testDeliveryOrderLink();
