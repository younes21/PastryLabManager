// Test de l'ajout de lignes de répartition
console.log('🧪 Test de l\'ajout de lignes de répartition...\n');

// Simuler l'état initial
let splits = [];

// Fonction d'ajout de split (similaire à celle du composant)
const addSplit = () => {
  splits = [...splits, { lotId: null, fromStorageZoneId: null, quantity: 0 }];
  console.log(`✅ Ligne ajoutée. Total des lignes: ${splits.length}`);
  console.log('📋 État actuel:', splits);
};

// Fonction de suppression de split
const removeSplit = (index) => {
  splits = splits.filter((_, i) => i !== index);
  console.log(`🗑️ Ligne ${index + 1} supprimée. Total des lignes: ${splits.length}`);
  console.log('📋 État actuel:', splits);
};

// Fonction de mise à jour d'un split
const updateSplit = (index, field, value) => {
  if (splits[index]) {
    splits[index] = { ...splits[index], [field]: value };
    console.log(`✏️ Ligne ${index + 1} mise à jour: ${field} = ${value}`);
    console.log('📋 État actuel:', splits);
  }
};

// Test 1: Ajout de lignes
console.log('1️⃣ Test d\'ajout de lignes...');
addSplit();
addSplit();
addSplit();

// Test 2: Mise à jour des lignes
console.log('\n2️⃣ Test de mise à jour des lignes...');
updateSplit(0, 'lotId', 1);
updateSplit(0, 'fromStorageZoneId', 2);
updateSplit(0, 'quantity', 10);

updateSplit(1, 'lotId', 3);
updateSplit(1, 'fromStorageZoneId', 4);
updateSplit(1, 'quantity', 15);

updateSplit(2, 'lotId', 5);
updateSplit(2, 'fromStorageZoneId', 6);
updateSplit(2, 'quantity', 20);

// Test 3: Suppression de lignes
console.log('\n3️⃣ Test de suppression de lignes...');
removeSplit(1);

// Test 4: Validation des données
console.log('\n4️⃣ Test de validation des données...');
const totalQuantity = splits.reduce((sum, split) => sum + (split.quantity || 0), 0);
const hasValidData = splits.every(split => 
  split.lotId !== null && 
  split.fromStorageZoneId !== null && 
  split.quantity > 0
);

console.log(`📊 Quantité totale: ${totalQuantity}`);
console.log(`✅ Données valides: ${hasValidData ? 'OUI' : 'NON'}`);

// Test 5: Ajout d'une nouvelle ligne après suppression
console.log('\n5️⃣ Test d\'ajout après suppression...');
addSplit();
updateSplit(splits.length - 1, 'lotId', 7);
updateSplit(splits.length - 1, 'fromStorageZoneId', 8);
updateSplit(splits.length - 1, 'quantity', 25);

console.log('\n🎯 Test terminé!');
console.log(`📋 Résumé final: ${splits.length} lignes de répartition`);
console.log('📊 Quantité totale finale:', splits.reduce((sum, split) => sum + (split.quantity || 0), 0));
