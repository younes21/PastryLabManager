// Test simple du CRUD des lots
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testLotsAPI() {
  console.log('🧪 Test des routes API des lots...\n');
  
  try {
    // 1. Test GET /api/lots
    console.log('1. Test GET /api/lots...');
    const response = await fetch(`${BASE_URL}/api/lots`);
    if (response.ok) {
      const lots = await response.json();
      console.log(`✅ GET /api/lots - ${lots.length} lot(s) trouvé(s)`);
    } else {
      console.log(`❌ GET /api/lots - Erreur ${response.status}`);
    }
    
    // 2. Test GET /api/articles (pour avoir un article de test)
    console.log('\n2. Test GET /api/articles...');
    const articlesResponse = await fetch(`${BASE_URL}/api/articles`);
    if (articlesResponse.ok) {
      const articles = await articlesResponse.json();
      console.log(`✅ GET /api/articles - ${articles.length} article(s) trouvé(s)`);
      
      if (articles.length > 0) {
        const testArticle = articles[0];
        console.log(`   Article de test: ${testArticle.name} (ID: ${testArticle.id})`);
        
        // 3. Test POST /api/lots
        console.log('\n3. Test POST /api/lots...');
        const newLot = {
          articleId: testArticle.id,
          code: `TEST-LOT-${Date.now()}`,
          manufacturingDate: '2024-01-15',
          useDate: '2024-12-31',
          expirationDate: '2024-12-31',
          alertDate: '2024-12-15',
          notes: 'Lot de test créé automatiquement'
        };
        
        const createResponse = await fetch(`${BASE_URL}/api/lots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newLot)
        });
        
        if (createResponse.ok) {
          const createdLot = await createResponse.json();
          console.log(`✅ POST /api/lots - Lot créé: ${createdLot.code} (ID: ${createdLot.id})`);
          
          // 4. Test GET /api/lots/:id
          console.log('\n4. Test GET /api/lots/:id...');
          const getResponse = await fetch(`${BASE_URL}/api/lots/${createdLot.id}`);
          if (getResponse.ok) {
            const lot = await getResponse.json();
            console.log(`✅ GET /api/lots/${createdLot.id} - Lot récupéré: ${lot.code}`);
          } else {
            console.log(`❌ GET /api/lots/${createdLot.id} - Erreur ${getResponse.status}`);
          }
          
          // 5. Test PUT /api/lots/:id
          console.log('\n5. Test PUT /api/lots/:id...');
          const updateData = {
            code: `${createdLot.code}-UPDATED`,
            notes: 'Lot mis à jour automatiquement'
          };
          
          const updateResponse = await fetch(`${BASE_URL}/api/lots/${createdLot.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
          });
          
          if (updateResponse.ok) {
            const updatedLot = await updateResponse.json();
            console.log(`✅ PUT /api/lots/${createdLot.id} - Lot mis à jour: ${updatedLot.code}`);
          } else {
            console.log(`❌ PUT /api/lots/${createdLot.id} - Erreur ${updateResponse.status}`);
          }
          
          // 6. Test DELETE /api/lots/:id
          console.log('\n6. Test DELETE /api/lots/:id...');
          const deleteResponse = await fetch(`${BASE_URL}/api/lots/${createdLot.id}`, {
            method: 'DELETE'
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ DELETE /api/lots/${createdLot.id} - Lot supprimé`);
          } else {
            console.log(`❌ DELETE /api/lots/${createdLot.id} - Erreur ${deleteResponse.status}`);
          }
          
        } else {
          const errorData = await createResponse.json();
          console.log(`❌ POST /api/lots - Erreur ${createResponse.status}: ${errorData.message}`);
        }
      } else {
        console.log('⚠️  Aucun article trouvé pour créer un lot de test');
      }
    } else {
      console.log(`❌ GET /api/articles - Erreur ${articlesResponse.status}`);
    }
    
    console.log('\n🎉 Tests terminés !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Attendre un peu puis lancer les tests
setTimeout(() => {
  testLotsAPI();
}, 3000);
