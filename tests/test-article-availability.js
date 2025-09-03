// Test de l'API de disponibilité des articles
const testArticleAvailability = async () => {
  try {
    console.log('🧪 Test de l\'API de disponibilité des articles...\n');

    // Test 1: Récupérer la disponibilité d'un article existant
    console.log('1️⃣ Test récupération disponibilité article existant...');
    const response1 = await fetch('http://localhost:5000/api/articles/1/availability');
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Succès:', {
        article: data1.article.name,
        totalStock: data1.summary.totalStock,
        totalAvailable: data1.summary.totalAvailable,
        requiresLotSelection: data1.summary.requiresLotSelection,
        requiresZoneSelection: data1.summary.requiresZoneSelection,
        canDirectDelivery: data1.summary.canDirectDelivery
      });
      
      if (data1.availability.length > 0) {
        console.log('📊 Disponibilité détaillée:');
        data1.availability.forEach((item, index) => {
          console.log(`   ${index + 1}. Lot: ${item.lotCode || 'Aucun'}, Zone: ${item.storageZoneDesignation}, Disponible: ${item.availableQuantity}`);
        });
      }
    } else {
      console.log('❌ Erreur:', response1.status, response1.statusText);
    }

    console.log('\n2️⃣ Test récupération disponibilité article inexistant...');
    const response2 = await fetch('http://localhost:5000/api/articles/99999/availability');
    
    if (response2.status === 404) {
      console.log('✅ Succès: Article non trouvé (404)');
    } else {
      console.log('❌ Erreur: Réponse inattendue:', response2.status);
    }

    console.log('\n3️⃣ Test récupération disponibilité avec ID invalide...');
    const response3 = await fetch('http://localhost:5000/api/articles/invalid/availability');
    
    if (response3.status === 400) {
      console.log('✅ Succès: ID invalide rejeté (400)');
    } else {
      console.log('❌ Erreur: Réponse inattendue:', response3.status);
    }

    console.log('\n🎯 Test terminé avec succès!');

  } catch (error) {
    console.error('💥 Erreur lors du test:', error.message);
  }
};

// Attendre que le serveur soit prêt
setTimeout(testArticleAvailability, 3000);
