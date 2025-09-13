import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testDeliveryWithSimpleSplit() {
  console.log('🧪 Test de création de livraison avec répartition simple...');
  
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
            quantity: "2.000",
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
            }
          ]
        }
      }),
    });
    
    console.log('Status:', response.status);
    const result = await response.text();
    console.log('Response:', result);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDeliveryWithSimpleSplit();

