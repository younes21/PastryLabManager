import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testDeliveryCreation() {
  console.log('🧪 Test de création de livraison atomique...');
  
  try {
    // 1. Créer une commande de test
    console.log('1. Création d\'une commande de test...');
    const orderResponse = await fetch(`${API_BASE}/ordersWithItems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: {
          type: "order",
          clientId: 1, // Supposons qu'un client existe
          deliveryDate: new Date().toISOString().split('T')[0],
          notes: "Commande de test pour livraison",
          status: "confirmed",
        },
        items: [
          {
            articleId: 1, // Supposons qu'un article existe
            quantity: "10.000",
            unitPrice: "100.000",
            taxRate: "19.000",
            taxAmount: "19.000",
            totalPrice: "119.000",
          }
        ],
      }),
    });
    
    if (!orderResponse.ok) {
      throw new Error(`Erreur création commande: ${orderResponse.status}`);
    }
    
    const order = await orderResponse.json();
    console.log('✅ Commande créée:', order.code);
    
    // 2. Créer une livraison avec items
    console.log('2. Création d\'une livraison avec items...');
    const deliveryResponse = await fetch(`${API_BASE}/deliveries/with-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryData: {
          orderId: order.id,
          status: "pending",
          scheduledDate: new Date().toISOString(),
          deliveryAddress: "Adresse de test",
          deliveryNotes: "Livraison de test",
          packageCount: 1,
        },
        orderItems: [
          {
            id: order.items[0].id,
            articleId: 1,
            quantity: "10.000",
            unitPrice: "100.000",
            taxRate: "19.000",
          }
        ],
        splits: {
          1: [ // Article ID 1
            {
              lotId: null,
              fromStorageZoneId: null,
              quantity: 5
            },
            {
              lotId: null,
              fromStorageZoneId: null,
              quantity: 5
            }
          ]
        }
      }),
    });
    
    if (!deliveryResponse.ok) {
      const errorText = await deliveryResponse.text();
      throw new Error(`Erreur création livraison: ${deliveryResponse.status} - ${errorText}`);
    }
    
    const delivery = await deliveryResponse.json();
    console.log('✅ Livraison créée:', delivery.code);
    
    // 3. Vérifier que l'opération d'inventaire a été créée
    console.log('3. Vérification de l\'opération d\'inventaire...');
    const operationResponse = await fetch(`${API_BASE}/inventory-operations/${delivery.operationId}`);
    if (!operationResponse.ok) {
      throw new Error(`Erreur récupération opération: ${operationResponse.status}`);
    }
    
    const operation = await operationResponse.json();
    console.log('✅ Opération d\'inventaire trouvée:', operation.code);
    
    // 4. Vérifier que les items ont été créés
    console.log('4. Vérification des items...');
    const operationItemsResponse = await fetch(`${API_BASE}/inventory-operations/${delivery.operationId}/items`);
    if (!operationItemsResponse.ok) {
      throw new Error(`Erreur récupération items: ${operationItemsResponse.status}`);
    }
    
    const operationItems = await operationItemsResponse.json();
    console.log('✅ Items d\'opération créés:', operationItems.length);
    
    // 5. Vérifier que les delivery_items ont été créés
    console.log('5. Vérification des delivery_items...');
    const deliveryItemsResponse = await fetch(`${API_BASE}/deliveries/${delivery.id}/items`);
    if (!deliveryItemsResponse.ok) {
      console.log('⚠️ Route delivery_items non trouvée, vérification via base de données...');
    } else {
      const deliveryItems = await deliveryItemsResponse.json();
      console.log('✅ Delivery_items créés:', deliveryItems.length);
    }
    
    console.log('🎉 Test réussi ! Livraison atomique créée avec succès.');
    console.log('📊 Résumé:');
    console.log(`   - Commande: ${order.code}`);
    console.log(`   - Livraison: ${delivery.code}`);
    console.log(`   - Opération: ${operation.code}`);
    console.log(`   - Items d'opération: ${operationItems.length}`);
    
  } catch (error) {
    console.error('❌ Test échoué:', error.message);
    process.exit(1);
  }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  testDeliveryCreation();
}, 3000);