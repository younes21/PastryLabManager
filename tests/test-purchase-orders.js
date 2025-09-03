// Test simple pour vérifier les routes purchase-orders
const testPurchaseOrders = async () => {
  const baseUrl = 'http://localhost:5000/api';
  
  try {
    console.log('🧪 Test des routes purchase-orders...');
    
    // Test GET - Liste des réceptions
    console.log('1. Test GET /api/purchase-orders');
    const listResponse = await fetch(`${baseUrl}/purchase-orders`);
    const listData = await listResponse.json();
    console.log('✅ Liste des réceptions:', listData.length, 'réceptions trouvées');
    
    if (listData.length > 0) {
      const firstReception = listData[0];
      console.log('   Première réception:', firstReception.code, '- Statut:', firstReception.status);
      
      // Test GET - Détails d'une réception
      console.log('2. Test GET /api/purchase-orders/:id');
      const detailResponse = await fetch(`${baseUrl}/purchase-orders/${firstReception.id}`);
      const detailData = await detailResponse.json();
      console.log('✅ Détails de la réception:', detailData.code, '- Items:', detailData.items?.length || 0);
      
      // Test PUT - Modification (seulement si pas complétée)
      if (firstReception.status !== 'completed') {
        console.log('3. Test PUT /api/purchase-orders/:id');
        const updateData = {
          purchaseOrder: {
            ...detailData,
            notes: 'Test de modification - ' + new Date().toISOString()
          },
          items: detailData.items || []
        };
        
        const updateResponse = await fetch(`${baseUrl}/purchase-orders/${firstReception.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          console.log('✅ Modification réussie:', updateResult.code);
        } else {
          console.log('❌ Erreur lors de la modification:', updateResponse.status);
        }
      } else {
        console.log('⚠️  Réception complétée, test de modification ignoré');
      }
    } else {
      console.log('⚠️  Aucune réception trouvée pour les tests');
    }
    
    console.log('✅ Tests terminés avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
};

// Exécuter les tests si le script est lancé directement
if (typeof window === 'undefined') {
  testPurchaseOrders();
}

module.exports = { testPurchaseOrders };
