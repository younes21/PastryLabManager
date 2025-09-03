-- Migration: Ajouter les champs de validation et la table de réservations de stock des livraisons
-- Date: 2024-01-XX

-- 1. Ajouter les nouveaux champs à la table deliveries
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;

-- 2. Créer la nouvelle table delivery_stock_reservations
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

-- 3. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_delivery_stock_reservations_delivery_id 
ON delivery_stock_reservations(delivery_id);

CREATE INDEX IF NOT EXISTS idx_delivery_stock_reservations_article_id 
ON delivery_stock_reservations(article_id);

CREATE INDEX IF NOT EXISTS idx_delivery_stock_reservations_status 
ON delivery_stock_reservations(status);

CREATE INDEX IF NOT EXISTS idx_delivery_stock_reservations_parent_operation 
ON delivery_stock_reservations(parent_operation_id);

-- 4. Commentaires sur les nouvelles colonnes
COMMENT ON TABLE delivery_stock_reservations IS 'Réservations de stock spécifiques aux livraisons pour gérer la disponibilité des articles';
COMMENT ON COLUMN deliveries.is_validated IS 'Indique si la livraison a été validée et si le stock a été déduit';
COMMENT ON COLUMN deliveries.validated_at IS 'Date et heure de validation de la livraison';
COMMENT ON COLUMN delivery_stock_reservations.reserved_quantity IS 'Quantité réservée pour cette livraison';
COMMENT ON COLUMN delivery_stock_reservations.delivered_quantity IS 'Quantité effectivement livrée';
COMMENT ON COLUMN delivery_stock_reservations.status IS 'Statut de la réservation: reserved, partially_delivered, delivered, cancelled';
COMMENT ON COLUMN delivery_stock_reservations.parent_operation_id IS 'Référence à l''opération d''inventaire mère (livraison)';
