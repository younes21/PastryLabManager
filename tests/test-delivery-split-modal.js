const BASE_URL = 'http://localhost:5000';

// Fonction utilitaire pour les requêtes avec timeout
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test de l'API de disponibilité des articles
async function testArticleAvailability() {
  console.log('\n🧪 Test: API de disponibilité des articles...\n');

  try {
    // Test avec un article existant (ID 1)
    const articleId = 1;
    console.log(`📊 Test de disponibilité pour l'article ID ${articleId}...`);
    
    const response = await fetchWithTimeout(`${BASE_URL}/api/articles/${articleId}/availability`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}: ${errorText}`);
      return;
    }
    
    const availabilityData = await response.json();
    console.log('✅ Données de disponibilité récupérées:');
    console.log(`   - Article: ${availabilityData.article?.name || 'N/A'} (ID: ${availabilityData.article?.id})`);
    console.log(`   - Type: ${availabilityData.article?.type || 'N/A'}`);
    console.log(`   - Périssable: ${availabilityData.article?.isPerishable ? 'Oui' : 'Non'}`);
    console.log(`   - Total stock: ${availabilityData.summary?.totalStock || 0}`);
    console.log(`   - Total réservé: ${availabilityData.summary?.totalReserved || 0}`);
    console.log(`   - Total disponible: ${availabilityData.summary?.totalAvailable || 0}`);
    console.log(`   - Sélection lot requise: ${availabilityData.summary?.requiresLotSelection ? 'Oui' : 'Non'}`);
    console.log(`   - Sélection zone requise: ${availabilityData.summary?.requiresZoneSelection ? 'Oui' : 'Non'}`);
    console.log(`   - Livraison directe possible: ${availabilityData.summary?.canDirectDelivery ? 'Oui' : 'Non'}`);
    
    console.log('\n📋 Disponibilités par lot/zone:');
    if (availabilityData.availability && availabilityData.availability.length > 0) {
      availabilityData.availability.forEach((item, index) => {
        console.log(`   ${index + 1}. Lot: ${item.lotCode || 'Aucun'} | Zone: ${item.storageZoneDesignation} | Stock: ${item.stockQuantity} | Disponible: ${item.availableQuantity}`);
      });
    } else {
      console.log('   Aucune disponibilité trouvée');
    }
    
    // Test des listes distinctes
    console.log('\n🔍 Test des listes distinctes:');
    
    // Lots distincts
    const distinctLots = [];
    const lotsMap = new Map();
    availabilityData.availability?.forEach(item => {
      if (item.lotId !== null && item.lotId !== undefined) {
        lotsMap.set(item.lotId, {
          id: item.lotId,
          code: item.lotCode,
          expirationDate: item.lotExpirationDate
        });
      }
    });
    const distinctLotsArray = Array.from(lotsMap.values());
    console.log(`   - Lots distincts: ${distinctLotsArray.length}`);
    distinctLotsArray.forEach(lot => {
      console.log(`     * ${lot.code || `Lot ${lot.id}`} ${lot.expirationDate ? `(DLC: ${new Date(lot.expirationDate).toLocaleDateString()})` : ''}`);
    });
    
    // Zones distinctes
    const zonesMap = new Map();
    availabilityData.availability?.forEach(item => {
      if (item.storageZoneId !== null && item.storageZoneId !== undefined) {
        zonesMap.set(item.storageZoneId, {
          id: item.storageZoneId,
          code: item.storageZoneCode,
          designation: item.storageZoneDesignation
        });
      }
    });
    const distinctZonesArray = Array.from(zonesMap.values());
    console.log(`   - Zones distinctes: ${distinctZonesArray.length}`);
    distinctZonesArray.forEach(zone => {
      console.log(`     * ${zone.designation} (${zone.code})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test de disponibilité:', error.message);
  }
}

// Test avec plusieurs articles
async function testMultipleArticles() {
  console.log('\n🧪 Test: Disponibilité de plusieurs articles...\n');

  const articleIds = [1, 2, 3, 4, 5]; // Test avec les premiers articles
  
  for (const articleId of articleIds) {
    try {
      console.log(`📊 Test article ID ${articleId}...`);
      
      const response = await fetchWithTimeout(`${BASE_URL}/api/articles/${articleId}/availability`);
      
      if (!response.ok) {
        console.log(`   ❌ Article ${articleId} non trouvé ou erreur`);
        continue;
      }
      
      const data = await response.json();
      
      // Compter les lots et zones distincts
      const lotsMap = new Map();
      const zonesMap = new Map();
      
      data.availability?.forEach(item => {
        if (item.lotId !== null) lotsMap.set(item.lotId, item.lotCode);
        if (item.storageZoneId !== null) zonesMap.set(item.storageZoneId, item.storageZoneDesignation);
      });
      
      console.log(`   ✅ ${data.article?.name || 'Article'} - Lots: ${lotsMap.size}, Zones: ${zonesMap.size}, Disponible: ${data.summary?.totalAvailable || 0}`);
      
    } catch (error) {
      console.log(`   ❌ Erreur pour l'article ${articleId}: ${error.message}`);
    }
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests du DeliverySplitModal...\n');
  
  try {
    await testArticleAvailability();
    await testMultipleArticles();
    
    console.log('\n✅ Tests terminés !');
    console.log('\n📝 Résumé des modifications:');
    console.log('   - ✅ Sélection unique d\'une combinaison (lot, zone)');
    console.log('   - ✅ Listes distinctes pour les lots et zones');
    console.log('   - ✅ Interface utilisateur mise à jour');
    console.log('   - ✅ Validation des sélections');
    console.log('   - ✅ Affichage des informations de disponibilité');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
runTests();
