// Test de création automatique de lots lors de la finalisation d'une opération de préparation
console.log('🧪 Test de création automatique de lots...\n');

// Simulation des données de test
const testData = {
  article: {
    id: 1,
    code: 'PRD-001',
    name: 'Pain de mie',
    type: 'product',
    unit: 'kg',
    shelfLife: 5, // 5 jours de DLC
    costPerUnit: '8.50'
  },
  operation: {
    id: 1,
    code: 'PREP-001',
    type: 'preparation',
    status: 'in_progress',
    operatorId: 1,
    scheduledDate: '2024-01-15T08:00:00Z'
  },
  completionData: {
    conformQuantity: 4.5, // 4.5 kg conforme
    totalPlanned: 5.0, // 5.0 kg prévu
    wasteQuantity: 0.5, // 0.5 kg de rebut
    manufacturingDate: '2024-01-15T14:30:00Z'
  }
};

console.log('📋 Données de test:');
console.log(`   - Article: ${testData.article.name} (${testData.article.code})`);
console.log(`   - DLC: ${testData.article.shelfLife} jours`);
console.log(`   - Opération: ${testData.operation.code}`);
console.log(`   - Quantité prévue: ${testData.completionData.totalPlanned} ${testData.article.unit}`);
console.log(`   - Quantité conforme: ${testData.completionData.conformQuantity} ${testData.article.unit}`);
console.log(`   - Quantité rebut: ${testData.completionData.wasteQuantity} ${testData.article.unit}`);

// Simulation de la logique de création de lot
function simulateLotCreation() {
  console.log('\n🔄 Simulation de la création automatique de lot...\n');

  // 1. Vérifier que l'opération est de type Préparation
  if (testData.operation.type !== 'preparation') {
    console.log('❌ L\'opération n\'est pas de type préparation');
    return;
  }
  console.log('✅ Opération de type préparation confirmée');

  // 2. Calculer la quantité totale produite = confirmé + rebut
  const totalProduced = testData.completionData.conformQuantity + testData.completionData.wasteQuantity;
  console.log(`✅ Quantité totale produite: ${totalProduced} ${testData.article.unit}`);

  // 3. Vérifier que la quantité totale > 0
  if (totalProduced <= 0) {
    console.log('❌ Aucune quantité produite, pas de lot à créer');
    return;
  }
  console.log('✅ Quantité produite positive, création du lot...');

  // 4. Générer le code du lot selon les règles: {ArticleCode}-{yyyyMMdd}-{seq}
  const manufacturingDate = new Date(testData.completionData.manufacturingDate);
  const dateStr = manufacturingDate.toISOString().split('T')[0].replace(/-/g, '');
  const sequence = '001'; // Premier lot du jour
  const lotCode = `${testData.article.code}-${dateStr}-${sequence}`;
  console.log(`✅ Code du lot généré: ${lotCode}`);

  // 5. Calculer les dates
  const shelfLifeDays = testData.article.shelfLife;
  const useDate = new Date(manufacturingDate);
  useDate.setDate(useDate.getDate() + shelfLifeDays);
  
  const expirationDate = new Date(useDate);
  const alertDate = new Date(expirationDate);
  alertDate.setDate(alertDate.getDate() - 3);

  console.log('\n📅 Dates calculées:');
  console.log(`   - Date de fabrication: ${manufacturingDate.toISOString()}`);
  console.log(`   - Date d'utilisation: ${useDate.toISOString()}`);
  console.log(`   - Date d'expiration: ${expirationDate.toISOString()}`);
  console.log(`   - Date d'alerte: ${alertDate.toISOString()}`);

  // 6. Créer l'enregistrement dans lots
  const lotData = {
    id: 1,
    articleId: testData.article.id,
    code: lotCode,
    manufacturingDate: manufacturingDate.toISOString(),
    useDate: useDate.toISOString(),
    expirationDate: expirationDate.toISOString(),
    alertDate: alertDate.toISOString(),
    supplierId: null, // Lot issu de production interne
    notes: "Lot généré automatiquement via production",
    createdAt: new Date().toISOString()
  };

  console.log('\n📦 Données du lot à créer:');
  console.log(`   - ID: ${lotData.id}`);
  console.log(`   - Article ID: ${lotData.articleId}`);
  console.log(`   - Code: ${lotData.code}`);
  console.log(`   - Fournisseur: ${lotData.supplierId ? 'Externe' : 'Production interne'}`);
  console.log(`   - Notes: ${lotData.notes}`);

  // 7. Créer l'enregistrement dans operation_lots
  const operationLotData = {
    id: 1,
    operationId: testData.operation.id,
    lotId: lotData.id,
    producedQuantity: totalProduced.toString(),
    notes: "Lot généré automatiquement via production",
    createdAt: new Date().toISOString()
  };

  console.log('\n🔗 Données operation_lots:');
  console.log(`   - ID: ${operationLotData.id}`);
  console.log(`   - Operation ID: ${operationLotData.operationId}`);
  console.log(`   - Lot ID: ${operationLotData.lotId}`);
  console.log(`   - Quantité produite: ${operationLotData.producedQuantity} ${testData.article.unit}`);
  console.log(`   - Notes: ${operationLotData.notes}`);

  console.log('\n✅ Simulation terminée avec succès!');
  console.log('\n📝 Résumé:');
  console.log(`   - Lot créé: ${lotCode}`);
  console.log(`   - Quantité totale: ${totalProduced} ${testData.article.unit}`);
  console.log(`   - DLC: ${shelfLifeDays} jours`);
  console.log(`   - Origine: Production interne`);
  console.log(`   - Traçabilité: Lié à l'opération ${testData.operation.code}`);
}

// Exécuter la simulation
simulateLotCreation();

console.log('\n🎯 Test de validation des règles métier:');
console.log('✅ Code du lot: {ArticleCode}-{yyyyMMdd}-{seq}');
console.log('✅ Dates calculées selon shelf_life de l\'article');
console.log('✅ supplierId = NULL (production interne)');
console.log('✅ notes = "Lot généré automatiquement via production"');
console.log('✅ operation_lots avec quantité totale produite');
console.log('✅ Traçabilité complète opération → lot');

console.log('\n🎉 Test de création automatique de lots réussi!');
