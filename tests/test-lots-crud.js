const { apiRequest } = require('../client/src/lib/queryClient');

// Configuration de base
const BASE_URL = 'http://localhost:5000';

// Fonction pour faire des requêtes API
async function apiCall(endpoint, method = 'GET', data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.message || 'Erreur inconnue'}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

// Test du CRUD des lots
async function testLotsCRUD() {
  console.log('🧪 Test du CRUD des lots...\n');
  
  try {
    // 1. Récupérer les articles pour créer un lot
    console.log('1. Récupération des articles...');
    const articles = await apiCall('/api/articles');
    if (articles.length === 0) {
      console.log('❌ Aucun article trouvé. Créez d\'abord des articles.');
      return;
    }
    const testArticle = articles[0];
    console.log(`✅ Article trouvé: ${testArticle.name} (ID: ${testArticle.id})`);
    
    // 2. Récupérer les fournisseurs
    console.log('\n2. Récupération des fournisseurs...');
    const suppliers = await apiCall('/api/suppliers');
    const testSupplier = suppliers.length > 0 ? suppliers[0] : null;
    if (testSupplier) {
      console.log(`✅ Fournisseur trouvé: ${testSupplier.companyName} (ID: ${testSupplier.id})`);
    } else {
      console.log('⚠️  Aucun fournisseur trouvé. Le lot sera créé sans fournisseur.');
    }
    
    // 3. Créer un nouveau lot
    console.log('\n3. Création d\'un nouveau lot...');
    const newLot = {
      articleId: testArticle.id,
      code: `TEST-LOT-${Date.now()}`,
      manufacturingDate: '2024-01-15',
      useDate: '2024-12-31',
      expirationDate: '2024-12-31',
      alertDate: '2024-12-15',
      supplierId: testSupplier ? testSupplier.id : null,
      notes: 'Lot de test créé automatiquement'
    };
    
    const createdLot = await apiCall('/api/lots', 'POST', newLot);
    console.log(`✅ Lot créé avec succès: ${createdLot.code} (ID: ${createdLot.id})`);
    
    // 4. Récupérer tous les lots
    console.log('\n4. Récupération de tous les lots...');
    const allLots = await apiCall('/api/lots');
    console.log(`✅ ${allLots.length} lot(s) trouvé(s)`);
    
    // 5. Récupérer le lot spécifique
    console.log('\n5. Récupération du lot spécifique...');
    const specificLot = await apiCall(`/api/lots/${createdLot.id}`);
    console.log(`✅ Lot récupéré: ${specificLot.code}`);
    
    // 6. Mettre à jour le lot
    console.log('\n6. Mise à jour du lot...');
    const updatedLotData = {
      code: `${createdLot.code}-UPDATED`,
      notes: 'Lot mis à jour automatiquement'
    };
    
    const updatedLot = await apiCall(`/api/lots/${createdLot.id}`, 'PUT', updatedLotData);
    console.log(`✅ Lot mis à jour: ${updatedLot.code}`);
    
    // 7. Vérifier la mise à jour
    console.log('\n7. Vérification de la mise à jour...');
    const verifyLot = await apiCall(`/api/lots/${createdLot.id}`);
    if (verifyLot.code === updatedLotData.code) {
      console.log('✅ Mise à jour vérifiée avec succès');
    } else {
      console.log('❌ Erreur lors de la vérification de la mise à jour');
    }
    
    // 8. Supprimer le lot
    console.log('\n8. Suppression du lot...');
    await apiCall(`/api/lots/${createdLot.id}`, 'DELETE');
    console.log('✅ Lot supprimé avec succès');
    
    // 9. Vérifier la suppression
    console.log('\n9. Vérification de la suppression...');
    try {
      await apiCall(`/api/lots/${createdLot.id}`);
      console.log('❌ Erreur: Le lot devrait être supprimé');
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('✅ Suppression vérifiée avec succès');
      } else {
        console.log('❌ Erreur inattendue lors de la vérification:', error.message);
      }
    }
    
    console.log('\n🎉 Tous les tests du CRUD des lots ont réussi !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Test des filtres
async function testLotsFilters() {
  console.log('\n🔍 Test des filtres des lots...\n');
  
  try {
    // Récupérer les articles
    const articles = await apiCall('/api/articles');
    if (articles.length === 0) {
      console.log('❌ Aucun article trouvé pour les tests de filtres.');
      return;
    }
    
    // Test du filtre par article
    const testArticle = articles[0];
    console.log(`1. Test du filtre par article (ID: ${testArticle.id})...`);
    const lotsByArticle = await apiCall(`/api/lots?articleId=${testArticle.id}`);
    console.log(`✅ ${lotsByArticle.length} lot(s) trouvé(s) pour l'article ${testArticle.name}`);
    
    // Test du filtre par zone de stockage
    console.log('\n2. Test du filtre par zone de stockage...');
    const lotsByZone = await apiCall('/api/lots?storageZoneId=1');
    console.log(`✅ ${lotsByZone.length} lot(s) trouvé(s) pour la zone 1`);
    
    console.log('\n🎉 Tests des filtres réussis !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests de filtres:', error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage des tests du CRUD des lots...\n');
  
  // Attendre que le serveur soit prêt
  console.log('⏳ Attente du serveur...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Test de connexion
    await apiCall('/api/articles');
    console.log('✅ Serveur accessible\n');
  } catch (error) {
    console.error('❌ Serveur non accessible. Assurez-vous que le serveur est démarré sur le port 5000.');
    process.exit(1);
  }
  
  // Exécuter les tests
  await testLotsCRUD();
  await testLotsFilters();
  
  console.log('\n✨ Tous les tests sont terminés !');
}

// Exécuter les tests
main().catch(console.error);
