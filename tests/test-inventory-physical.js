const { Pool } = require('pg');

// Configuration de la base de données
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pastrylab',
  user: 'postgres',
  password: 'postgres'
});

async function testInventoryPhysical() {
  try {
    console.log('🧪 Test de l\'API Inventaire Physique');
    
    // 1. Vérifier que les opérations d'ajustement existent
    console.log('\n1. Vérification des opérations d\'ajustement existantes...');
    const existingOps = await pool.query(`
      SELECT id, code, type, status, created_at 
      FROM inventory_operations 
      WHERE type = 'ajustement' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`✅ ${existingOps.rows.length} opérations d'ajustement trouvées`);
    existingOps.rows.forEach(op => {
      console.log(`   - ${op.code} (${op.status}) - ${op.created_at}`);
    });

    // 2. Vérifier les articles disponibles
    console.log('\n2. Vérification des articles disponibles...');
    const articles = await pool.query(`
      SELECT id, code, name, type, unit, current_stock 
      FROM articles 
      WHERE active = true AND managed_in_stock = true
      ORDER BY type, name 
      LIMIT 10
    `);
    
    console.log(`✅ ${articles.rows.length} articles trouvés`);
    articles.rows.forEach(article => {
      console.log(`   - ${article.code} (${article.type}): ${article.name} - Stock: ${article.current_stock} ${article.unit}`);
    });

    // 3. Vérifier les zones de stockage
    console.log('\n3. Vérification des zones de stockage...');
    const zones = await pool.query(`
      SELECT id, code, designation 
      FROM storage_zones 
      ORDER BY designation
    `);
    
    console.log(`✅ ${zones.rows.length} zones de stockage trouvées`);
    zones.rows.forEach(zone => {
      console.log(`   - ${zone.code}: ${zone.designation}`);
    });

    // 4. Vérifier les items de stock
    console.log('\n4. Vérification des items de stock...');
    const stockItems = await pool.query(`
      SELECT s.id, s.article_id, s.storage_zone_id, s.quantity, s.lot_id,
             a.code as article_code, a.name as article_name, a.type as article_type,
             sz.designation as zone_name,
             l.code as lot_code
      FROM stock s
      JOIN articles a ON s.article_id = a.id
      JOIN storage_zones sz ON s.storage_zone_id = sz.id
      LEFT JOIN lots l ON s.lot_id = l.id
      WHERE a.active = true
      ORDER BY a.type, a.name
      LIMIT 10
    `);
    
    console.log(`✅ ${stockItems.rows.length} items de stock trouvés`);
    stockItems.rows.forEach(item => {
      console.log(`   - ${item.article_code}: ${item.article_name} (${item.article_type})`);
      console.log(`     Zone: ${item.zone_name}, Qté: ${item.quantity}, Lot: ${item.lot_code || 'N/A'}`);
    });

    // 5. Test de création d'une opération d'ajustement
    console.log('\n5. Test de création d\'une opération d\'ajustement...');
    
    if (articles.rows.length > 0 && zones.rows.length > 0) {
      const testArticle = articles.rows[0];
      const testZone = zones.rows[0];
      
      // Créer une opération d'ajustement de test
      const newOp = await pool.query(`
        INSERT INTO inventory_operations (type, status, storage_zone_id, notes, created_at)
        VALUES ('ajustement', 'draft', $1, 'Test d\'inventaire physique', NOW())
        RETURNING id, code, type, status
      `, [testZone.id]);
      
      console.log(`✅ Opération de test créée: ${newOp.rows[0].code}`);
      
      // Créer un item de test
      const newItem = await pool.query(`
        INSERT INTO inventory_operation_items (
          operation_id, article_id, quantity, quantity_before, quantity_after,
          unit_cost, to_storage_zone_id, notes, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id, article_id, quantity
      `, [
        newOp.rows[0].id,
        testArticle.id,
        5.0, // Ajustement de +5
        parseFloat(testArticle.current_stock || 0),
        parseFloat(testArticle.current_stock || 0) + 5.0,
        0.0, // Pas de coût pour ajustement
        testZone.id,
        'Test d\'ajustement'
      ]);
      
      console.log(`✅ Item de test créé: Article ${testArticle.code}, Ajustement: +5 ${testArticle.unit}`);
      
      // Nettoyer le test
      await pool.query('DELETE FROM inventory_operation_items WHERE operation_id = $1', [newOp.rows[0].id]);
      await pool.query('DELETE FROM inventory_operations WHERE id = $1', [newOp.rows[0].id]);
      console.log('🧹 Test nettoyé');
    }

    console.log('\n✅ Tests terminés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await pool.end();
  }
}

testInventoryPhysical();
