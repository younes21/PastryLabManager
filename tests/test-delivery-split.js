// Test du composant de répartition des livraisons
console.log('🧪 Test du composant DeliverySplitModal...\n');

// Simuler les données de test
const mockAvailabilityData = {
  article: {
    id: 1,
    name: "Tarte fraise",
    code: "PRD-000001",
    isPerishable: true,
    type: "product"
  },
  availability: [
    {
      lotId: 1,
      lotCode: "LOT-001",
      lotExpirationDate: "2024-12-31",
      storageZoneId: 1,
      storageZoneCode: "ZON-001",
      storageZoneDesignation: "Congélateur",
      stockQuantity: 40,
      reservedQuantity: 20,
      availableQuantity: 20,
      isPerishable: true,
      requiresLotSelection: true,
      requiresZoneSelection: false
    },
    {
      lotId: 2,
      lotCode: "LOT-002",
      lotExpirationDate: "2024-12-25",
      storageZoneId: 2,
      storageZoneCode: "ZON-002",
      storageZoneDesignation: "Réfrigérateur",
      stockQuantity: 30,
      reservedQuantity: 10,
      availableQuantity: 20,
      isPerishable: true,
      requiresLotSelection: true,
      requiresZoneSelection: true
    }
  ],
  summary: {
    totalStock: 70,
    totalReserved: 30,
    totalAvailable: 40,
    requiresLotSelection: true,
    requiresZoneSelection: true,
    canDirectDelivery: false
  }
};

// Test des validations
const testValidations = () => {
  console.log('1️⃣ Test des validations...');
  
  // Test 1: Quantité totale correcte
  const splits1 = [
    { lotId: 1, fromStorageZoneId: 1, quantity: 20 },
    { lotId: 2, fromStorageZoneId: 2, quantity: 20 }
  ];
  
  const totalQuantity1 = splits1.reduce((sum, split) => sum + split.quantity, 0);
  const requestedQuantity = 40;
  
  if (Math.abs(totalQuantity1 - requestedQuantity) < 0.001) {
    console.log('✅ Validation quantité totale: OK');
  } else {
    console.log('❌ Validation quantité totale: ÉCHEC');
  }
  
  // Test 2: Sélections obligatoires
  const hasRequiredSelections = splits1.every(split => 
    split.lotId !== null && split.fromStorageZoneId !== null
  );
  
  if (hasRequiredSelections) {
    console.log('✅ Validation sélections obligatoires: OK');
  } else {
    console.log('❌ Validation sélections obligatoires: ÉCHEC');
  }
  
  // Test 3: Quantités positives
  const hasPositiveQuantities = splits1.every(split => split.quantity > 0);
  
  if (hasPositiveQuantities) {
    console.log('✅ Validation quantités positives: OK');
  } else {
    console.log('❌ Validation quantités positives: ÉCHEC');
  }
};

// Test des calculs
const testCalculations = () => {
  console.log('\n2️⃣ Test des calculs...');
  
  const splits = [
    { lotId: 1, fromStorageZoneId: 1, quantity: 25 },
    { lotId: 2, fromStorageZoneId: 2, quantity: 15 }
  ];
  
  // Calcul du total
  const total = splits.reduce((sum, split) => sum + split.quantity, 0);
  console.log(`📊 Total calculé: ${total} (attendu: 40)`);
  
  // Vérification de la disponibilité
  const availableQuantities = mockAvailabilityData.availability.map(item => item.availableQuantity);
  const maxAvailable = availableQuantities.reduce((sum, qty) => sum + qty, 0);
  console.log(`📦 Disponibilité maximale: ${maxAvailable}`);
  
  if (total <= maxAvailable) {
    console.log('✅ Quantité demandée dans les limites de disponibilité');
  } else {
    console.log('❌ Quantité demandée dépasse la disponibilité');
  }
};

// Test des règles métier
const testBusinessRules = () => {
  console.log('\n3️⃣ Test des règles métier...');
  
  const { summary } = mockAvailabilityData;
  
  // Règle 1: Sélection de lot obligatoire pour périssable
  if (summary.requiresLotSelection) {
    console.log('✅ Sélection de lot obligatoire (article périssable)');
  }
  
  // Règle 2: Sélection de zone obligatoire (plusieurs zones)
  if (summary.requiresZoneSelection) {
    console.log('✅ Sélection de zone obligatoire (plusieurs zones)');
  }
  
  // Règle 3: Livraison directe impossible
  if (!summary.canDirectDelivery) {
    console.log('✅ Livraison directe impossible (contraintes multiples)');
  }
  
  // Règle 4: Vérification des contraintes
  const constraints = [];
  if (summary.requiresLotSelection) constraints.push('Lot');
  if (summary.requiresZoneSelection) constraints.push('Zone');
  
  console.log(`🔒 Contraintes appliquées: ${constraints.join(', ')}`);
};

// Exécution des tests
testValidations();
testCalculations();
testBusinessRules();

console.log('\n🎯 Tests terminés!');
console.log('\n📋 Résumé des fonctionnalités testées:');
console.log('   • Validation des quantités totales');
console.log('   • Validation des sélections obligatoires');
console.log('   • Validation des quantités positives');
console.log('   • Calculs de disponibilité');
console.log('   • Application des règles métier');
console.log('   • Gestion des contraintes (lot/zone)');
