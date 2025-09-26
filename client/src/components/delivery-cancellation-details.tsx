import React from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Eye, RotateCcw, Trash2, Link, Calendar, User } from 'lucide-react';

interface CancellationDetailsProps {
  delivery: {
    id: number;
    code: string;
    status: string;
    cancellationReason?: string;
    cancelledAt?: string;
    cancelledBy?: number;
    order?: {
      clientName: string;
      totalAmount: string;
    };
  };
  inventoryOperations: Array<{
    id: number;
    code: string;
    type: string;
    status: string;
    notes?: string;
    createdAt: string;
    operatorId: number;
    operatorName?: string;
    items: Array<{
      articleName: string;
      quantity: string;
      quantityBefore: string;
      quantityAfter: string;
      unitCost: string;
      wasteReason?: string;
    }>;
  }>;
}

export function CancellationDetails({ delivery, inventoryOperations }: CancellationDetailsProps) {
  const getOperationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'retour_livraison': 'Retour au stock',
      'rebut_livraison': 'Rebut',
      'livraison': 'Livraison'
    };
    return labels[type] || type;
  };

  const getOperationTypeIcon = (type: string) => {
    switch (type) {
      case 'retour_livraison':
        return <RotateCcw className="h-4 w-4 text-green-600" />;
      case 'rebut_livraison':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'livraison':
        return <Link className="h-4 w-4 text-blue-600" />;
      default:
        return <Link className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'retour_livraison': 'default',
      'rebut_livraison': 'destructive',
      'livraison': 'secondary'
    };

    return (
      <Badge variant={variants[type] || "outline"}>
        {getOperationTypeLabel(type)}
      </Badge>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-1" />
          Voir détails
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Détails de l'annulation - {delivery.code}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            {/* Informations de la livraison annulée */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Livraison annulée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Code</label>
                    <p className="font-mono text-lg">{delivery.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client</label>
                    <p>{delivery.order?.clientName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Statut</label>
                    <Badge variant="destructive">Annulée</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Montant commande</label>
                    <p>{delivery.order?.totalAmount || 'N/A'} €</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Raison de l'annulation</label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{delivery.cancellationReason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date d'annulation</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {delivery.cancelledAt ? new Date(delivery.cancelledAt).toLocaleString('fr-FR') : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Annulée par</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {delivery.cancelledBy ? `Utilisateur ${delivery.cancelledBy}` : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opérations d'inventaire liées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opérations d'inventaire liées</CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryOperations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Aucune opération d'inventaire trouvée
                  </p>
                ) : (
                  <div className="space-y-4">
                    {inventoryOperations.map((operation) => (
                      <div key={operation.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getOperationTypeIcon(operation.type)}
                            <div>
                              <h4 className="font-medium">{operation.code}</h4>
                              <p className="text-sm text-muted-foreground">
                                {getOperationTypeLabel(operation.type)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getOperationTypeBadge(operation.type)}
                            <Badge variant={operation.status === 'completed' ? 'default' : 'outline'}>
                              {operation.status === 'completed' ? 'Terminée' : operation.status}
                            </Badge>
                          </div>
                        </div>

                        {operation.notes && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {operation.notes}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Créée le :</span>{' '}
                            {new Date(operation.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            <span className="font-medium">Opérateur :</span>{' '}
                            {operation.operatorName || `Utilisateur ${operation.operatorId}`}
                          </div>
                        </div>

                        {/* Détails des articles */}
                        {operation.items.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Articles concernés :</h5>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Article</TableHead>
                                  <TableHead>Quantité</TableHead>
                                  <TableHead>Stock avant</TableHead>
                                  <TableHead>Stock après</TableHead>
                                  <TableHead>Coût unitaire</TableHead>
                                  {operation.type === 'rebut_livraison' && (
                                    <TableHead>Raison rebut</TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {operation.items.map((item, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{item.articleName}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.quantityBefore}</TableCell>
                                    <TableCell>{item.quantityAfter}</TableCell>
                                    <TableCell>{item.unitCost} €</TableCell>
                                    {operation.type === 'rebut_livraison' && (
                                      <TableCell className="text-red-600">
                                        {item.wasteReason || 'N/A'}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
