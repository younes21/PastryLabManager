import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface IngredientReservation {
  id: number;
  articleId: number;
  article: {
    id: number;
    name: string;
    code: string;
    currentStock: string;
  };
  reservedQuantity: string;
  deliveredQuantity: string;
  status: string;
  reservationType: string;
  notes: string;
  reservedAt: string;
  expiresAt?: string;
}

interface IngredientReservationsProps {
  operationId: number;
  operationType: string;
  operationStatus: string;
}

const statusLabels = {
  reserved: 'Réservé',
  partially_delivered: 'Partiellement livré',
  delivered: 'Livré',
  cancelled: 'Annulé'
};

const statusColors = {
  reserved: 'default',
  partially_delivered: 'secondary',
  delivered: 'success',
  cancelled: 'destructive'
};

const typeLabels = {
  order: 'Commande',
  preparation: 'Préparation'
};

export const IngredientReservations: React.FC<IngredientReservationsProps> = ({
  operationId,
  operationType,
  operationStatus
}) => {
  const [reservations, setReservations] = useState<IngredientReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/inventory-operations/${operationId}/reservations`, 'GET');
      setReservations(response);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les réservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReservations = async () => {
    try {
      setCreating(true);
      const response = await apiRequest(`/api/inventory-operations/${operationId}/reservations`, 'POST');
      
      toast({
        title: "Succès",
        description: "Réservations d'ingrédients créées avec succès",
      });
      
      // Recharger les réservations
      await fetchReservations();
    } catch (error) {
      console.error('Error creating reservations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création des réservations';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (operationId && (operationType === 'preparation' || operationType === 'preparation_reliquat')) {
      fetchReservations();
    }
  }, [operationId, operationType]);

  // Ne pas afficher pour les opérations qui ne sont pas des préparations
  if (operationType !== 'preparation' && operationType !== 'preparation_reliquat') {
    return null;
  }

  const canCreateReservations = operationStatus === 'programmed' && reservations.length === 0;
  const hasActiveReservations = reservations.some(r => r.status === 'reserved');

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Réservations d'ingrédients
        </CardTitle>
        <div className="flex items-center gap-2">
          {canCreateReservations && (
            <Button 
              onClick={createReservations} 
              disabled={creating}
              size="sm"
              variant="outline"
            >
              {creating ? 'Création...' : 'Créer réservations'}
            </Button>
          )}
          {hasActiveReservations && (
            <Badge variant="secondary" className="text-xs">
              {reservations.filter(r => r.status === 'reserved').length} réservations actives
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Chargement des réservations...
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {operationStatus === 'programmed' ? (
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <p>Aucune réservation d'ingrédients</p>
                <p className="text-sm">Cliquez sur "Créer réservations" pour réserver les ingrédients nécessaires</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <p>Aucune réservation active</p>
                <p className="text-sm">Les ingrédients ont été consommés ou libérés</p>
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrédient</TableHead>
                <TableHead>Quantité réservée</TableHead>
                <TableHead>Stock disponible</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reservation.article.name}</div>
                      <div className="text-sm text-muted-foreground">{reservation.article.code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {parseFloat(reservation.reservedQuantity).toFixed(2)}
                    </div>
                    {parseFloat(reservation.deliveredQuantity) > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Livré: {parseFloat(reservation.deliveredQuantity).toFixed(2)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {parseFloat(reservation.article.currentStock).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[reservation.status as keyof typeof statusColors] || 'default'}>
                      {statusLabels[reservation.status as keyof typeof statusLabels] || reservation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabels[reservation.reservationType as keyof typeof typeLabels] || reservation.reservationType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(reservation.reservedAt).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {new Date(reservation.reservedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
