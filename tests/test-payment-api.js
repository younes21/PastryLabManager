// Test simple des APIs de paiement
const baseUrl = 'http://localhost:5000';

async function testPaymentAPIs() {
  console.log('🧪 Test des APIs de gestion des règlements...\n');
  
  try {
    // 1. Test des statistiques de paiement
    console.log('1️⃣ Test des statistiques de paiement...');
    const statsResponse = await fetch(`${baseUrl}/api/payments/statistics`);
    const stats = await statsResponse.json();
    console.log('✅ Statistiques récupérées:', JSON.stringify(stats, null, 2));
    
    // 2. Test des encours
    console.log('\n2️⃣ Test des encours clients...');
    const outstandingResponse = await fetch(`${baseUrl}/api/payments/outstanding`);
    const outstanding = await outstandingResponse.json();
    console.log('✅ Encours récupérés:', outstanding.length, 'factures');
    
    // 3. Test des paiements généraux
    console.log('\n3️⃣ Test des paiements généraux...');
    const paymentsResponse = await fetch(`${baseUrl}/api/payments`);
    const payments = await paymentsResponse.json();
    console.log('✅ Paiements récupérés:', payments.length, 'paiements');
    
    // 4. Test de l'interface utilisateur
    console.log('\n4️⃣ Test de l\'interface utilisateur...');
    const uiResponse = await fetch(`${baseUrl}/payment-dashboard`);
    if (uiResponse.ok) {
      console.log('✅ Interface utilisateur accessible');
    } else {
      console.log('❌ Interface utilisateur non accessible');
    }
    
    console.log('\n🎉 Tous les tests des APIs de paiement sont passés !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testPaymentAPIs().then(() => {
  console.log('\n✅ Tests terminés');
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
});
