/**
 * Script de test pour le système de réservations d'ingrédients
 * 
 * Ce script teste les fonctionnalités principales :
 * 1. Création d'une préparation programmée
 * 2. Vérification des réservations créées
 * 3. Changement de statut et libération des réservations
 * 4. Suppression et libération automatique
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword';
const TEST_OPERATION = {
  type: 'preparation',
  status: 'programmed',
  scheduledDate: new Date().toISOString(),
  notes: 'Test de réservations automatiques'
};

const TEST_ITEMS = [
  {
    articleId: 21, // "tartes aux pommes" - a real product with a recipe
    quantity: '10',
    notes: 'Test item'
  }
];

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

// Fonctions de test
async function testReservationSystem() {
  console.log('🧪 Démarrage des tests du système de réservations...\n');

  try {
    // Test 1: Créer une préparation
    console.log('📝 Test 1: Création d\'une préparation...');
    const operationResponse = await fetchWithTimeout(`${BASE_URL}/inventory-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: TEST_OPERATION,
        items: TEST_ITEMS
      })
    });
    
    if (!operationResponse.ok) {
      throw new Error(`HTTP error! status: ${operationResponse.status}`);
    }
    const operationData = await operationResponse.json();
    const operationId = operationData.operation.id;
    console.log(`✅ Préparation créée avec l'ID: ${operationId}`);

    // Test 2: Vérifier que les réservations sont créées automatiquement
    console.log('\n🔍 Test 2: Vérification des réservations automatiques...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre la création des réservations
    
    const reservationsResponse = await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}/reservations`);
    const reservations = await reservationsResponse.json();
    
    if (reservations.length > 0) {
      console.log(`✅ ${reservations.length} réservation(s) créée(s) automatiquement`);
      reservations.forEach((res, index) => {
        console.log(`   - Réservation ${index + 1}: ${res.article?.name} - ${res.reservedQuantity} ${res.article?.unit}`);
      });
    } else {
      console.log('⚠️  Aucune réservation créée automatiquement');
    }

    // Test 3: Changer le statut à "en cours" et vérifier la libération
    console.log('\n▶️  Test 3: Changement de statut et libération des réservations...');
    await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'in_progress',
        startedAt: new Date().toISOString()
      })
    });
    
    console.log('✅ Statut changé à "en cours"');
    
    // Attendre la libération des réservations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const reservationsAfterStart = await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}/reservations`);
    const activeReservations = (await reservationsAfterStart.json()).filter(r => r.status === 'reserved');
    
    if (activeReservations.length === 0) {
      console.log('✅ Toutes les réservations ont été libérées automatiquement');
    } else {
      console.log(`⚠️  ${activeReservations.length} réservation(s) encore active(s)`);
    }

    // Test 4: Supprimer l'opération et vérifier la libération
    console.log('\n🗑️  Test 4: Suppression de l\'opération...');
    await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}`, {
      method: 'DELETE'
    });
    console.log('✅ Opération supprimée');
    
    // Vérifier que les réservations sont bien supprimées
    try {
      await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}/reservations`);
      console.log('⚠️  Les réservations sont encore accessibles après suppression');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Réservations correctement supprimées avec l\'opération');
      } else {
        console.log('⚠️  Erreur inattendue lors de la vérification des réservations');
      }
    }

    console.log('\n🎉 Tous les tests sont terminés !');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.data);
    }
  }
}

// Test des endpoints de réservation
async function testReservationEndpoints() {
  console.log('\n🔧 Test des endpoints de réservation...\n');

  try {
    // Créer une nouvelle opération pour les tests
    const operationResponse = await fetchWithTimeout(`${BASE_URL}/inventory-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: { ...TEST_OPERATION, status: 'draft' },
        items: TEST_ITEMS
      })
    });
    
    if (!operationResponse.ok) {
      throw new Error(`HTTP error! status: ${operationResponse.status}`);
    }
    const operationData = await operationResponse.json();
    const operationId = operationData.operation.id;
    console.log(`📝 Opération de test créée: ${operationId}`);

          // Test: Créer des réservations manuellement
      console.log('\n📋 Test: Création manuelle de réservations...');
      const manualReservations = await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}/reservations`);
      const manualReservationsData = await manualReservations.json();
      console.log(`✅ ${manualReservationsData.reservations.length} réservation(s) créée(s) manuellement`);

      // Test: Récupérer les réservations
      console.log('\n📖 Test: Récupération des réservations...');
      const getReservations = await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}/reservations`);
      const getReservationsData = await getReservations.json();
      console.log(`✅ ${getReservationsData.length} réservation(s) récupérée(s)`);

      // Test: Libérer une réservation spécifique
      if (getReservationsData.length > 0) {
        console.log('\n🔓 Test: Libération d\'une réservation spécifique...');
        const reservationId = getReservationsData[0].id;
        await fetchWithTimeout(`${BASE_URL}/stock-reservations/${reservationId}/release`);
        console.log(`✅ Réservation ${reservationId} libérée`);
      }

    // Nettoyer
    await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}`, {
      method: 'DELETE'
    });
    console.log('\n🧹 Opération de test supprimée');

  } catch (error) {
    console.error('❌ Erreur lors des tests des endpoints:', error.message);
  }
}

// Test simple de création d'opération
async function testSimpleOperationCreation() {
  console.log('🧪 Test simple: Création d\'une opération sans items...\n');

  try {
    const simpleOperation = {
      type: 'preparation',
      status: 'programmed',
      notes: 'Test simple'
    };

    console.log('📝 Tentative de création d\'une opération simple...');
    console.log('Données envoyées:', JSON.stringify(simpleOperation, null, 2));
    
    const response = await fetchWithTimeout(`${BASE_URL}/inventory-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(simpleOperation)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}: ${errorText}`);
      return;
    }
    
    const result = await response.json();
    console.log(`✅ Opération simple créée avec l'ID: ${result.id}`);
    
    // Attendre un peu et vérifier que l'opération existe toujours
    console.log('⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const checkResponse = await fetchWithTimeout(`${BASE_URL}/inventory-operations/${result.id}`);
    if (checkResponse.ok) {
      const checkResult = await checkResponse.json();
      console.log(`✅ Opération ${result.id} existe toujours:`, checkResult.type, checkResult.status);
    } else {
      console.log(`❌ Opération ${result.id} n'existe plus après 2 secondes`);
    }
    
    // Nettoyer
    await fetchWithTimeout(`${BASE_URL}/inventory-operations/${result.id}`, {
      method: 'DELETE'
    });
    console.log('🧹 Opération simple supprimée');
    
  } catch (error) {
    console.error('❌ Erreur lors du test simple:', error.message);
  }
}

// Test de création d'opération avec items (nouveau format)
async function testOperationWithItems() {
  console.log('🧪 Test: Création d\'une opération avec items (nouveau format)...\n');

  try {
    const operationWithItems = {
      operation: {
        type: 'preparation',
        status: 'programmed',
        notes: 'Test avec items'
      },
      items: [
        {
          articleId: 21, // "tartes aux pommes"
          quantity: '10',
          notes: 'Test item'
        }
      ]
    };

    console.log('📝 Tentative de création d\'une opération avec items...');
    console.log('Données envoyées:', JSON.stringify(operationWithItems, null, 2));
    
    const response = await fetchWithTimeout(`${BASE_URL}/inventory-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(operationWithItems)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}: ${errorText}`);
      return;
    }
    
    const result = await response.json();
    console.log(`✅ Opération avec items créée:`, result);
    
    // Nettoyer
    if (result.operation && result.operation.id) {
      await fetchWithTimeout(`${BASE_URL}/inventory-operations/${result.operation.id}`, {
        method: 'DELETE'
      });
      console.log('🧹 Opération avec items supprimée');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test avec items:', error.message);
  }
}

// Test de cascade delete pour les réservations
async function testCascadeDelete() {
  console.log('🧪 Test: Cascade delete des réservations...\n');

  try {
    // Créer une opération avec items pour générer des réservations
    const operationWithItems = {
      operation: {
        type: 'preparation',
        status: 'programmed',
        notes: 'Test cascade delete'
      },
      items: [
        {
          articleId: 21, // "tartes aux pommes"
          quantity: '5',
          notes: 'Test cascade delete'
        }
      ]
    };

    console.log('📝 Création d\'une opération avec items...');
    const response = await fetchWithTimeout(`${BASE_URL}/inventory-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(operationWithItems)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}: ${errorText}`);
      return;
    }
    
    const result = await response.json();
    const operationId = result.id;
    console.log(`✅ Opération créée avec l'ID: ${operationId}`);
    
    // Attendre un peu pour que les réservations soient créées
    console.log('⏳ Attente de 2 secondes pour la création des réservations...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Vérifier que les réservations existent
    const reservationsResponse = await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}/reservations`);
    const reservations = await reservationsResponse.json();
    console.log(`📋 ${reservations.length} réservation(s) trouvée(s) pour l'opération ${operationId}`);
    
    if (reservations.length > 0) {
      reservations.forEach((res, index) => {
        console.log(`   - Réservation ${index + 1}: Article ${res.articleId} - ${res.reservedQuantity} (${res.reservationType})`);
      });
      
      // Maintenant supprimer l'opération
      console.log(`\n🗑️  Suppression de l'opération ${operationId}...`);
      const deleteResponse = await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Opération supprimée');
        
        // Attendre un peu pour que le cascade delete se propage
        console.log('⏳ Attente de 1 seconde pour le cascade delete...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Vérifier que les réservations ont été supprimées automatiquement
        try {
          const checkReservationsResponse = await fetchWithTimeout(`${BASE_URL}/inventory-operations/${operationId}/reservations`);
          const remainingReservations = await checkReservationsResponse.json();
          
          if (remainingReservations.length === 0) {
            console.log('✅ Cascade delete fonctionne: toutes les réservations ont été supprimées automatiquement');
          } else {
            console.log(`⚠️  Cascade delete ne fonctionne pas: ${remainingReservations.length} réservation(s) encore présente(s)`);
          }
        } catch (error) {
          if (error.message.includes('404')) {
            console.log('✅ Cascade delete fonctionne: l\'opération et ses réservations ont été supprimés');
          } else {
            console.log('⚠️  Erreur lors de la vérification des réservations:', error.message);
          }
        }
      } else {
        console.log(`❌ Erreur lors de la suppression: ${deleteResponse.status}`);
      }
    } else {
      console.log('⚠️  Aucune réservation créée, impossible de tester le cascade delete');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de cascade delete:', error.message);
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests complets du système de réservations\n');
  
  await testReservationSystem();
  await testReservationEndpoints();
  await testSimpleOperationCreation(); // Add this line to run the new test
  await testOperationWithItems(); // Add this line to run the new test
  await testCascadeDelete(); // Add this line to run the new test
  
  console.log('\n✨ Tests terminés !');
}

// Exécuter les tests directement
console.log('🚀 Démarrage des tests du système de réservations...');
console.log('BASE_URL:', BASE_URL);

// Test simple d'abord
testSimpleOperationCreation().then(() => {
  console.log('Test simple terminé');
}).catch(console.error);

// Puis les tests complets
runAllTests().catch(console.error);

export {
  testReservationSystem,
  testReservationEndpoints,
  runAllTests
};
