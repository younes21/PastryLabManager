import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testDeliveryAPI() {
  console.log('🧪 Test de l\'API de livraisons...');
  
  try {
    // 1. Vérifier que le serveur répond
    console.log('1. Test de connexion au serveur...');
    const healthResponse = await fetch(`${API_BASE}/deliveries`);
    if (!healthResponse.ok) {
      throw new Error(`Serveur non accessible: ${healthResponse.status}`);
    }
    console.log('✅ Serveur accessible');
    
    // 2. Lister les livraisons existantes
    console.log('2. Récupération des livraisons existantes...');
    const deliveries = await healthResponse.json();
    console.log(`✅ ${deliveries.length} livraisons trouvées`);
    
    // 3. Lister les commandes existantes
    console.log('3. Récupération des commandes existantes...');
    const ordersResponse = await fetch(`${API_BASE}/orders`);
    if (!ordersResponse.ok) {
      throw new Error(`Erreur récupération commandes: ${ordersResponse.status}`);
    }
    const orders = await ordersResponse.json();
    console.log(`✅ ${orders.length} commandes trouvées`);
    
    // 4. Lister les articles existants
    console.log('4. Récupération des articles existants...');
    const articlesResponse = await fetch(`${API_BASE}/articles`);
    if (!articlesResponse.ok) {
      throw new Error(`Erreur récupération articles: ${articlesResponse.status}`);
    }
    const articles = await articlesResponse.json();
    console.log(`✅ ${articles.length} articles trouvés`);
    
    // 5. Si on a des commandes et des articles, tester la création
    if (orders.length > 0 && articles.length > 0) {
      const order = orders[0];
      const article = articles[0];
      
      console.log(`5. Test de création de livraison pour commande ${order.code}...`);
      
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
              id: order.items?.[0]?.id || 1,
              articleId: article.id,
              quantity: "1.000",
              unitPrice: "100.000",
              taxRate: "19.000",
            }
          ],
        }),
      });
      
      if (!deliveryResponse.ok) {
        const errorText = await deliveryResponse.text();
        console.log('⚠️ Erreur création livraison:', errorText);
      } else {
        const delivery = await deliveryResponse.json();
        console.log('✅ Livraison créée:', delivery.code);
        
        // Vérifier l'opération d'inventaire
        if (delivery.operationId) {
          const operationResponse = await fetch(`${API_BASE}/inventory-operations/${delivery.operationId}`);
          if (operationResponse.ok) {
            const operation = await operationResponse.json();
            console.log('✅ Opération d\'inventaire créée:', operation.code);
          }
        }
      }
    } else {
      console.log('⚠️ Pas assez de données pour tester la création');
    }
    
    console.log('🎉 Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Test échoué:', error.message);
    process.exit(1);
  }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  testDeliveryAPI();
}, 2000);

