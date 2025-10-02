-- Migration: Ajouter le support des réservations pour les préparations
-- Date: 2024-01-XX

-- Ajouter les nouveaux champs à la table stock_reservations
ALTER TABLE stock_reservations 
ADD COLUMN IF NOT EXISTS inventory_operation_id INTEGER REFERENCES inventory_operations(id),
ADD COLUMN IF NOT EXISTS reservation_type TEXT NOT NULL DEFAULT 'order' CHECK (reservation_type IN ('order', 'fabrication'));

-- Créer un index pour améliorer les performances des requêtes sur les opérations d'inventaire
CREATE INDEX IF NOT EXISTS idx_stock_reservations_inventory_operation 
ON stock_reservations(inventory_operation_id);

-- Créer un index pour les requêtes par type de réservation
CREATE INDEX IF NOT EXISTS idx_stock_reservations_type 
ON stock_reservations(reservation_type);

-- Mettre à jour les contraintes existantes pour permettre soit orderId soit inventoryOperationId
-- (mais pas les deux en même temps)
ALTER TABLE stock_reservations 
DROP CONSTRAINT IF EXISTS stock_reservations_order_id_not_null;

-- Ajouter une contrainte de validation pour s'assurer qu'au moins une référence est présente
ALTER TABLE stock_reservations 
ADD CONSTRAINT check_reference_exists 
CHECK (
  (order_id IS NOT NULL AND inventory_operation_id IS NULL) OR 
  (order_id IS NULL AND inventory_operation_id IS NOT NULL)
);

-- Commentaire sur la table
COMMENT ON TABLE stock_reservations IS 'Réservations de stock pour les commandes et les préparations';
COMMENT ON COLUMN stock_reservations.inventory_operation_id IS 'Référence à l''opération d''inventaire (pour les préparations)';
COMMENT ON COLUMN stock_reservations.reservation_type IS 'Type de réservation: order (commande) ou preparation (préparation)';
COMMENT ON COLUMN stock_reservations.order_id IS 'Référence à la commande (pour les réservations de commandes)';
