import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Fonction pour générer une quantité aléatoire entre 2 et 10
function getRandomQuantity() {
  return Math.floor(Math.random() * 9) + 2; // Entre 2 et 10
}

// Fonction pour générer un prix réaliste basé sur le type d'article
function getRealisticPrice(article) {
  const basePrices = {
    'ingredient': {
      'Farine': 50,
      'Sucre': 78,
      'Beurre': 1200,
      'Œufs': 12,
      'Lait': 100,
      'Levure chimique': 500,
      'Vanille': 2000,
      'Chocolat noir': 5950,
      'Amandes': 2100,
      'Noix': 1850,
      'Pistaches': 4000,
      'Cacahuètes': 450,
      'Miel': 1500,
      'Crème chantilly': 1000,
      'Colorants alimentaires': 3000,
      'Gélatine': 2200,
      'Fruits confits': 1500,
      'Pâte à sucre': 1000,
      'Huile végétale': 125,
      'Sel': 17,
    },
    'product': {
      'Tarte aux pommes': 800,
      'Gâteau au chocolat': 1200,
      'Croissants': 45,
      'Pain de mie': 200,
      'Cookies': 25,
      'Muffins': 35,
      'Éclairs': 60,
      'Profiteroles': 80,
      'Macarons': 15,
      'Cupcakes': 40,
    }
  };

  // Chercher un prix correspondant au nom de l'article
  const articleName = article.name;
  const typePrices = basePrices[article.type] || {};
  
  // Chercher une correspondance exacte ou partielle
  for (const [key, price] of Object.entries(typePrices)) {
    if (articleName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(articleName.toLowerCase())) {
      return price;
    }
  }

  // Prix par défaut selon le type
  if (article.type === 'ingredient') {
    return Math.floor(Math.random() * 2000) + 50; // Entre 50 et 2050 DA
  } else if (article.type === 'product') {
    return Math.floor(Math.random() * 1500) + 200; // Entre 200 et 1700 DA
  }
  
  return 100; // Prix par défaut
}

export async function seedInventoryInitial() {
  console.log('--- SEED INVENTAIRE INITIALE ---');
  
  try {
    // 1. Récupérer tous les articles depuis la BDD
    const articlesRes = await axios.get(`${BASE_URL}/articles`);
    const articles = articlesRes.data;
    console.log(`📦 Récupéré ${articles.length} articles depuis la BDD`);

    if (articles.length === 0) {
      console.warn('⚠️  Aucun article trouvé dans la base de données');
      return;
    }

    // 2. Préparer les items pour l'inventaire initial en utilisant la même logique que saveOperation
    const items = [];
    
    for (const article of articles) {
      // Générer une quantité aléatoire entre 2 et 10 pour les ingrédients
      // Quantité 0 pour les produits finis
      const quantity = getRandomQuantity();
      
      // Générer un prix réaliste
      const unitCost = getRealisticPrice(article);
      
      // Utiliser la même structure que saveOperation
      items.push({
        articleId: article.id,
        quantity: quantity.toString(), // Quantité de variation (nouvelle - actuelle)
        quantityBefore: "0", // Stock actuel (0 pour inventaire initial)
        quantityAfter: quantity.toString(), // Nouvelle quantité
        unitCost: unitCost.toString(), // Prix unitaire
        toStorageZoneId: article.storageZoneId || 6, // Zone de stockage par défaut
        lotId: null,
        serialNumber: null,
        notes: `Inventaire initial - ${article.name}`,
      });
      
      console.log(`✅ ${article.name} (${article.type}): ${quantity} ${article.unit} - ${unitCost} DA`);
    }

    // 3. Créer l'opération d'inventaire initial en utilisant la même structure que saveOperation
    const operationData = {
      type: 'inventaire_initiale',
      status: 'draft',
      storageZoneId: 6, // Zone par défaut
      notes: 'Inventaire initial généré automatiquement avec prix réels et quantités aléatoires (2-10)',
    };

    const payload = {
      operation: operationData,
      items: items,
    };

    // 4. Envoyer la requête d'inventaire initial
    const res = await axios.post(`${BASE_URL}/inventory-operations`, payload);
    console.log('✅ Inventaire initial créé avec succès ! ID:', res.data.id);
    console.log(`📊 ${items.length} articles traités`);
    
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data?.message?.includes('existe déjà')) {
      console.log('ℹ️  Inventaire initial déjà existant pour cette zone.');
    } else {
      console.error('❌ Erreur lors de la création de l\'inventaire initial:', error.response?.data || error.message);
      throw error;
    }
  }
}

export async function testInventoryInitial() {
  console.log('--- TEST INVENTAIRE INITIALE ---');
  
  try {
    // 1. Récupérer l'inventaire initial
    const res = await axios.get(`${BASE_URL}/inventory-operations?type=inventaire_initiale`);
    const operations = res.data;
    
    if (!operations.length) {
      console.error('❌ Aucun inventaire initial trouvé !');
      return;
    }
    
    const op = operations[0];
    console.log(`📋 Inventaire initial trouvé: ID ${op.id}, Status: ${op.status}`);
    
    // 2. Récupérer les items de l'opération
    const itemsRes = await axios.get(`${BASE_URL}/inventory-operations/${op.id}/items`);
    const items = itemsRes.data;
    console.log(`📦 ${items.length} items trouvés dans l'inventaire initial`);
    
    // 3. Récupérer tous les articles pour faire le mapping
    const articlesRes = await axios.get(`${BASE_URL}/articles`);
    const articles = articlesRes.data;
    const articlesMap = new Map(articles.map(a => [a.id, a]));
    
    // 4. Vérifier chaque article
    let ingredientsCount = 0;
    let productsCount = 0;
    let totalValue = 0;
    
    for (const item of items) {
      const article = articlesMap.get(item.articleId);
      if (article) {
        const quantity = Number(item.quantityAfter);
        const unitCost = Number(item.unitCost);
        const value = quantity * unitCost;
        
        if (article.type === 'ingredient') {
          ingredientsCount++;
          // Vérifier que la quantité est entre 2 et 10
          if (quantity >= 2 && quantity <= 10) {
            console.log(`✅ ${article.name}: ${quantity} ${article.unit} - ${unitCost} DA (valeur: ${value} DA)`);
          } else {
            console.warn(`⚠️  ${article.name}: quantité ${quantity} hors plage 2-10`);
          }
        } else if (article.type === 'product') {
          productsCount++;
          // Vérifier que la quantité est 0 pour les produits
          if (quantity === 0) {
            console.log(`✅ ${article.name}: ${quantity} ${article.unit} - ${unitCost} DA (produit fini)`);
          } else {
            console.warn(`⚠️  ${article.name}: quantité ${quantity} devrait être 0 pour un produit fini`);
          }
        }
        
        totalValue += value;
      } else {
        console.warn(`⚠️  Article non trouvé pour l'ID: ${item.articleId}`);
      }
    }
    
    console.log('\n📊 RÉSUMÉ DE L\'INVENTAIRE INITIAL:');
    console.log(`   • Ingrédients: ${ingredientsCount}`);
    console.log(`   • Produits finis: ${productsCount}`);
    console.log(`   • Total articles: ${items.length}`);
    console.log(`   • Valeur totale: ${totalValue} DA`);
    
    if (ingredientsCount > 0 && productsCount > 0) {
      console.log('🎉 Inventaire initial créé avec succès !');
    } else {
      console.warn('⚠️  L\'inventaire initial semble incomplet.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de l\'inventaire initial:', error.response?.data || error.message);
  }
}

// Appel des deux fonctions
(async () => {
  await seedInventoryInitial();
  await testInventoryInitial();
})();
