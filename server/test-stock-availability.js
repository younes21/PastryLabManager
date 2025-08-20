/**
 * Script de test pour les fonctions de vérification de disponibilité des ingrédients
 */

// Configuration
const BASE_URL = 'http://localhost:5000/api';

// Helper function to make fetch requests with timeout
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
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Test de la fonction getArticleStockDetails
async function testArticleStockDetails() {
  console.log('🧪 Test: Détails de stock d\'un article...\n');

  try {
    // Test avec l'article "Pomme" (ID 41)
    const articleId = 41;
    console.log(`📊 Vérification du stock pour l'article ${articleId} (Pomme)...`);
    
    const response = await fetchWithTimeout(`${BASE_URL}/articles/${articleId}/stock-details`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}: ${errorText}`);
      return;
    }
    
    const stockDetails = await response.json();
    console.log('✅ Détails de stock récupérés:');
    console.log(`   - Stock total: ${stockDetails.totalStock} kg`);
    console.log(`   - Quantité réservée: ${stockDetails.reservedQuantity} kg`);
    console.log(`   - Quantité livrée: ${stockDetails.deliveredQuantity} kg`);
    console.log(`   - Stock disponible: ${stockDetails.availableStock} kg`);
    console.log(`   - Nombre de réservations: ${stockDetails.reservations.length}`);
    
    if (stockDetails.reservations.length > 0) {
      console.log('   - Réservations:');
      stockDetails.reservations.forEach((res, index) => {
        console.log(`     ${index + 1}. ${res.reservedQuantity} kg - ${res.notes}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test des détails de stock:', error.message);
  }
}

// Test de la fonction checkRecipeIngredientsAvailability
async function testRecipeAvailability() {
  console.log('\n🧪 Test: Vérification de disponibilité d\'une recette...\n');

  try {
    // Test avec la recette "Prep. tarte aux pommes" (ID 7)
    const recipeId = 7;
    const plannedQuantity = 5; // 5 tartes
    console.log(`📋 Vérification de disponibilité pour la recette ${recipeId} (${plannedQuantity} tartes)...`);
    
    const response = await fetchWithTimeout(`${BASE_URL}/recipes/${recipeId}/check-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plannedQuantity })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}: ${errorText}`);
      return;
    }
    
    const availability = await response.json();
    console.log('✅ Vérification de disponibilité terminée:');
    console.log(`   - Tous les ingrédients disponibles: ${availability.available ? '✅ Oui' : '❌ Non'}`);
    console.log(`   - Total des réservations: ${availability.totalReservations} kg`);
    
    if (!availability.available && availability.missingIngredients.length > 0) {
      console.log('   - Ingrédients manquants:');
      availability.missingIngredients.forEach((ingredient, index) => {
        console.log(`     ${index + 1}. ${ingredient.articleName}:`);
        console.log(`        - Requis: ${ingredient.requiredQuantity} kg`);
        console.log(`        - Disponible: ${ingredient.availableStock} kg`);
        console.log(`        - Manque: ${ingredient.shortfall} kg`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de disponibilité de recette:', error.message);
  }
}

// Test de la fonction hasEnoughAvailableStock
async function testStockCheck() {
  console.log('\n🧪 Test: Vérification de stock suffisant...\n');

  try {
    // Test avec l'article "Pomme" (ID 41)
    const articleId = 41;
    const requiredQuantity = 10; // 10 kg
    console.log(`📊 Vérification si l'article ${articleId} (Pomme) a ${requiredQuantity} kg disponibles...`);
    
    const response = await fetchWithTimeout(`${BASE_URL}/articles/${articleId}/check-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requiredQuantity })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}: ${errorText}`);
      return;
    }
    
    const stockCheck = await response.json();
    console.log('✅ Vérification de stock terminée:');
    console.log(`   - Stock suffisant: ${stockCheck.hasEnough ? '✅ Oui' : '❌ Non'}`);
    console.log(`   - Stock disponible: ${stockCheck.availableStock} kg`);
    console.log(`   - Quantité requise: ${stockCheck.requiredQuantity} kg`);
    console.log(`   - Manque: ${stockCheck.shortfall} kg`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test de vérification de stock:', error.message);
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests de disponibilité des ingrédients...\n');
  
  await testArticleStockDetails();
  await testRecipeAvailability();
  await testStockCheck();
  
  console.log('\n✨ Tous les tests sont terminés !');
}

// Exécuter les tests
runAllTests().catch(console.error);
