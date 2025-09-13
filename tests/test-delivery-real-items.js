import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testDeliveryWithRealItems() {
  console.log('🧪 Test de création de livraison avec vraies données...');
  
  try {
    const response = await fetch(`${API_BASE}/deliveries/with-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryData: {
          orderId: 15,
          status: "pending",
          scheduledDate: "2025-01-15T10:00:00Z",
          deliveryAddress: "Test Address",
          deliveryNotes: "Test Delivery",
          packageCount: 1
        },
        orderItems: [
          {
            id: 23, // Vrai ID de orderItem
            articleId: 5, // Vrai articleId
            quantity: "5.000",
            unitPrice: "15.00",
            taxRate: "19.00"
          }
        ]
      }),
    });
    
    console.log('Status:', response.status);
    const result = await response.text();
    console.log('Response:', result);
    
    if (response.ok) {
      const delivery = JSON.parse(result);
      console.log('✅ Livraison créée:', delivery.code);
      console.log('✅ Opération ID:', delivery.operationId);
      
      // Vérifier l'opération d'inventaire
      const operationResponse = await fetch(`${API_BASE}/inventory-operations/${delivery.operationId}`);
      if (operationResponse.ok) {
        const operation = await operationResponse.json();
        console.log('✅ Opération trouvée:', operation.code);
        
        // Vérifier les items de l'opération
        const itemsResponse = await fetch(`${API_BASE}/inventory-operations/${delivery.operationId}/items`);
        if (itemsResponse.ok) {
          const items = await itemsResponse.json();
          console.log('✅ Items créés:', items.length);
          console.log('Items:', items);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDeliveryWithRealItems();

