import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testDeliveryWithMultipleSplits() {
  console.log('🧪 Test de création de livraison avec répartitions multiples...');
  
  try {
    const response = await fetch(`${API_BASE}/deliveries/with-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryData: {
          orderId: 15,
          status: "pending"
        },
        orderItems: [
          {
            id: 23,
            articleId: 5,
            quantity: "5.000",
            unitPrice: "15.00",
            taxRate: "19.00"
          }
        ],
        splits: {
          5: [ // Article ID 5
            {
              lotId: null,
              fromStorageZoneId: 1,
              quantity: 2
            },
            {
              lotId: null,
              fromStorageZoneId: 3,
              quantity: 3
            }
          ]
        }
      }),
    });
    
    console.log('Status:', response.status);
    const result = await response.text();
    console.log('Response:', result);
    
    if (response.ok) {
      const delivery = JSON.parse(result);
      console.log('✅ Livraison créée:', delivery.code);
      console.log('✅ Opération ID:', delivery.operationId);
      
      // Vérifier les items de l'opération
      const itemsResponse = await fetch(`${API_BASE}/inventory-operations/${delivery.operationId}/items`);
      if (itemsResponse.ok) {
        const items = await itemsResponse.json();
        console.log('✅ Items créés:', items.length);
        console.log('Items:', items);
        
        if (items.length === 2) {
          console.log('🎉 Répartitions multiples créées avec succès !');
          console.log('   - Item 1: Zone 1, quantité 2');
          console.log('   - Item 2: Zone 3, quantité 3');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDeliveryWithMultipleSplits();

