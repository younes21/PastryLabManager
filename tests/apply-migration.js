// Script pour appliquer la migration delivery_stock_reservations
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function applyMigration() {
  console.log('🔄 Application de la migration delivery_stock_reservations...\n');

  try {
    // 1. Ajouter les nouveaux champs à la table deliveries
    console.log('1. Ajout des champs de validation à la table deliveries...');
    await pool.query(`
      ALTER TABLE deliveries 
      ADD COLUMN IF NOT EXISTS is_validated BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;
    `);
    console.log('✅ Champs de validation ajoutés');

    // 2. Créer la table delivery_stock_reservations
    console.log('\n2. Création de la table delivery_stock_reservations...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_stock_reservations (
        id SERIAL PRIMARY KEY,
        delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
        article_id INTEGER NOT NULL REFERENCES articles(id),
        order_item_id INTEGER NOT NULL REFERENCES order_items(id),
        
        -- Quantités
        reserved_quantity DECIMAL(10,3) NOT NULL,
        delivered_quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000,
        
        -- Statut de la réservation
        status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'partially_delivered', 'delivered', 'cancelled')),
        
        -- Traçabilité
        parent_operation_id INTEGER REFERENCES inventory_operations(id),
        
        -- Dates
        reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP,
        
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Table delivery_stock_reservations créée');

    // 3. Créer les index
    console.log('\n3. Création des index...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_stock_reservations_delivery_id 
      ON delivery_stock_reservations(delivery_id);
      
      CREATE INDEX IF NOT EXISTS idx_delivery_stock_reservations_article_id 
      ON delivery_stock_reservations(article_id);
      
      CREATE INDEX IF NOT EXISTS idx_delivery_stock_reservations_status 
      ON delivery_stock_reservations(status);
      
      CREATE INDEX IF NOT EXISTS idx_delivery_stock_reservations_parent_operation 
      ON delivery_stock_reservations(parent_operation_id);
    `);
    console.log('✅ Index créés');

    // 4. Ajouter les commentaires
    console.log('\n4. Ajout des commentaires...');
    await pool.query(`
      COMMENT ON TABLE delivery_stock_reservations IS 'Réservations de stock spécifiques aux livraisons pour gérer la disponibilité des articles';
      COMMENT ON COLUMN deliveries.is_validated IS 'Indique si la livraison a été validée et si le stock a été déduit';
      COMMENT ON COLUMN deliveries.validated_at IS 'Date et heure de validation de la livraison';
      COMMENT ON COLUMN delivery_stock_reservations.reserved_quantity IS 'Quantité réservée pour cette livraison';
      COMMENT ON COLUMN delivery_stock_reservations.delivered_quantity IS 'Quantité effectivement livrée';
      COMMENT ON COLUMN delivery_stock_reservations.status IS 'Statut de la réservation: reserved, partially_delivered, delivered, cancelled';
      COMMENT ON COLUMN delivery_stock_reservations.parent_operation_id IS 'Référence à l''opération d''inventaire mère (livraison)';
    `);
    console.log('✅ Commentaires ajoutés');

    console.log('\n🎉 Migration appliquée avec succès !');
    console.log('   La table delivery_stock_reservations est maintenant disponible.');

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error.message);
  } finally {
    await pool.end();
  }
}

applyMigration();
