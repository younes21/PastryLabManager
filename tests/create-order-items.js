// Script pour créer des articles de commande
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createOrderItems() {
  console.log('🔄 Création d\'articles de commande...\n');

  try {
    // 1. Vérifier que la commande existe
    const orderResult = await pool.query('SELECT id FROM orders WHERE id = 13');
    if (orderResult.rows.length === 0) {
      console.log('❌ Commande 13 non trouvée');
      return;
    }
    console.log('✅ Commande 13 trouvée');

    // 2. Vérifier que les articles existent
    const articlesResult = await pool.query('SELECT id, name FROM articles WHERE id IN (36, 37)');
    console.log(`✅ Articles trouvés: ${articlesResult.rows.length}`);
    articlesResult.rows.forEach(row => {
      console.log(`   - ID ${row.id}: ${row.name}`);
    });

    // 3. Créer des articles de commande
    console.log('\n🔄 Création des articles de commande...');
    
    const orderItems = [
      {
        orderId: 13,
        articleId: 36,
        quantity: '1.000',
        unitPrice: '5.00',
        notes: 'Article de test pour les annulations'
      },
      {
        orderId: 13,
        articleId: 37,
        quantity: '1.000',
        unitPrice: '8.00',
        notes: 'Article de test pour les annulations'
      }
    ];

    for (const item of orderItems) {
      const totalPrice = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      const result = await pool.query(`
        INSERT INTO order_items (order_id, article_id, quantity, unit_price, total_price, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `, [item.orderId, item.articleId, item.quantity, item.unitPrice, totalPrice.toFixed(2), item.notes]);
      
      console.log(`✅ Article de commande créé: ID ${result.rows[0].id}`);
    }

    // 4. Vérifier que les articles ont été créés
    const checkResult = await pool.query('SELECT * FROM order_items WHERE order_id = 13');
    console.log(`\n📊 Articles de commande créés: ${checkResult.rows.length}`);
    checkResult.rows.forEach(row => {
      console.log(`   - ID ${row.id}: Article ${row.article_id}, Quantité ${row.quantity}`);
    });

    console.log('\n🎉 Articles de commande créés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la création des articles de commande:', error.message);
  } finally {
    await pool.end();
  }
}

createOrderItems();
