-- Migration: Ajouter les types d'opérations d'inventaire pour les annulations de livraison
-- Date: 2024-01-XX

-- Cette migration ajoute les nouveaux types d'opérations d'inventaire
-- pour gérer les annulations de livraison avec retour au stock ou rebut

-- 1. Vérifier et ajouter les nouveaux types d'opérations si nécessaire
-- Note: Les types sont gérés au niveau applicatif, cette migration documente les nouveaux types

-- Types d'opérations ajoutés:
-- - 'retour_livraison' : Pour les retours au stock lors d'annulation après validation
-- - 'rebut_livraison' : Pour les rebuts lors d'annulation après validation

-- 2. Commentaires sur les nouveaux types
COMMENT ON COLUMN inventory_operations.type IS 'Types: livraison, retour_livraison, rebut_livraison, reception, ajustement, etc.';

-- 3. Vérification de la cohérence des données
-- S'assurer que les livraisons annulées ont le bon statut
UPDATE deliveries 
SET status = 'cancelled' 
WHERE status IN ('pending', 'in_transit', 'delivered') 
AND id IN (
  SELECT DISTINCT delivery_id 
  FROM delivery_stock_reservations 
  WHERE status = 'cancelled'
);

-- 4. Index pour améliorer les performances des requêtes d'annulation
CREATE INDEX IF NOT EXISTS idx_deliveries_status_validated
ON deliveries(status, is_validated);

CREATE INDEX IF NOT EXISTS idx_delivery_stock_reservations_status_delivery
ON delivery_stock_reservations(status, delivery_id);

-- 5. Vérification des contraintes de cohérence
-- S'assurer qu'une livraison annulée ne peut pas être validée
ALTER TABLE deliveries 
ADD CONSTRAINT check_cancelled_not_validated 
CHECK (
  (status = 'cancelled' AND is_validated = false) OR 
  (status != 'cancelled')
);

-- 6. Commentaires sur les nouvelles fonctionnalités
COMMENT ON TABLE deliveries IS 'Livraisons avec gestion des annulations et validation';
COMMENT ON COLUMN deliveries.status IS 'Statuts: pending, in_transit, delivered, cancelled';
COMMENT ON COLUMN deliveries.is_validated IS 'Indique si la livraison a été validée et si le stock a été déduit';

COMMENT ON TABLE delivery_stock_reservations IS 'Réservations de stock avec gestion des annulations';
COMMENT ON COLUMN delivery_stock_reservations.status IS 'Statuts: reserved, partially_delivered, delivered, cancelled';
