import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Truck,
  XCircle,
  RotateCcw,
  Trash2,
  Eye,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { CancellationDetails } from '@/components/delivery-cancellation-details';

interface Delivery {
  id: number;
  code: string;
  orderId: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  scheduledDate: string;
  notes?: string;
  cancellationReason?: string;
  isValidated: boolean;
  createdAt: string;
  updatedAt?: string;
  order?: {
    clientName: string;
    totalAmount: string;
  };
}

interface InventoryOperation {
  id: number;
  code: string;
  type: string;
  status: string;
  notes?: string;
  createdAt: string;
  operatorId: number;
  parentOperationId?: number;
  orderId?: number;
  items: Array<{
    articleName: string;
    quantity: string;
    quantityBefore: string;
    quantityAfter: string;
    unitCost: string;
    reason?: string;
  }>;
}

interface CancellationModalProps {
  delivery: Delivery | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Modal d'annulation
function CancellationModal({ delivery, isOpen, onClose, onSuccess }: CancellationModalProps) {
  const [returnReason, setReasonRetour] = useState('');
  const [WasteReason, setReasonRebut] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellationItems, setCancellationItems] = useState<Array<{
    articleId: number;
    articleName: string;
    articlePhoto: string;
    articleUnit: string;
    totalQuantity: number;
    zones: Array<{
      zoneId: number;
      zoneName: string;
      lotId: number | null;
      lotName: string;
      quantity: number;
      notes: string;
      returnQuantity: number;
      wasteQuantity: number;
      returnReason: string;
      wasteReason: string;
    }>;
  }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les données de la livraison pour générer le tableau summary
  const { data: deliveryData, refetch: refetchDeliveryData } = useQuery({
    queryKey: ['delivery-details', delivery?.id, isOpen],
    queryFn: async () => {
      if (!delivery?.id) return null;
      const response = await fetch(`/api/deliveries/${delivery.id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des détails de la livraison');
      return response.json();
    },
    enabled: !!delivery?.id && isOpen,
    staleTime: 0, // Force le rechargement à chaque ouverture
    gcTime: 0  // Ne pas mettre en cache
  });

  // Générer les données du tableau summary
  const generateSummaryData = () => {
    if (!deliveryData) return [];

    return deliveryData;
  };

  // Mettre à jour les données d'annulation quand les données de livraison changent
  useEffect(() => {
    if (deliveryData && isOpen) {
      const summaryData = generateSummaryData();
      setCancellationItems(summaryData);
    }
  }, [deliveryData, isOpen]);

  // Réinitialiser les champs de saisie quand le dialogue s'ouvre
  useEffect(() => {
    if (isOpen) {
      setReasonRetour('');
      setReasonRebut('');
    }
  }, [isOpen]);

  // Fonctions pour gérer les changements dans les inputs
  const updatewasteQuantity = (articleId: number, zoneIndex: number, value: number) => {
    setCancellationItems(prev => prev.map(item => {
      if (item.articleId === articleId) {
        const updatedZones = [...item.zones];
        const zone = updatedZones[zoneIndex];
        const maxValue = zone.quantity - zone.returnQuantity;
        const newValue = Math.min(Math.max(0, value), maxValue);
        updatedZones[zoneIndex] = { ...zone, wasteQuantity: newValue };
        return { ...item, zones: updatedZones };
      }
      return item;
    }));
  };

  const updatereturnQuantity = (articleId: number, zoneIndex: number, value: number) => {
    setCancellationItems(prev => prev.map(item => {
      if (item.articleId === articleId) {
        const updatedZones = [...item.zones];
        const zone = updatedZones[zoneIndex];
        const maxValue = zone.quantity - zone.wasteQuantity;
        const newValue = Math.min(Math.max(0, value), maxValue);
        updatedZones[zoneIndex] = { ...zone, returnQuantity: newValue };
        return { ...item, zones: updatedZones };
      }
      return item;
    }));
  };

  const updateReasonRebut = (articleId: number, zoneIndex: number, value: string) => {
    setCancellationItems(prev => prev.map(item => {
      if (item.articleId === articleId) {
        const updatedZones = [...item.zones];
        updatedZones[zoneIndex] = { ...updatedZones[zoneIndex], wasteReason: value };
        return { ...item, zones: updatedZones };
      }
      return item;
    }));
  };

  const updateReasonRetour = (articleId: number, zoneIndex: number, value: string) => {
    setCancellationItems(prev => prev.map(item => {
      if (item.articleId === articleId) {
        const updatedZones = [...item.zones];
        updatedZones[zoneIndex] = { ...updatedZones[zoneIndex], returnReason: value };
        return { ...item, zones: updatedZones };
      }
      return item;
    }));
  };

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!delivery) return;

      // Vérifier que la livraison est validée
      if (!delivery.isValidated) {
        throw new Error("Seules les livraisons validées peuvent être annulées");
      }

      // Annulation avec détails des quantités
      const response = await fetch(`/api/deliveries/${delivery.id}/cancel-after-validation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnReason: returnReason.trim(),
          WasteReason: WasteReason.trim(),
          cancellationItems: cancellationItems.map(item => ({
            articleId: item.articleId,
            zones: item.zones.map(zone => ({
              zoneId: zone.zoneId,
              lotId: zone.lotId,
              wasteQuantity: zone.wasteQuantity,
              returnQuantity: zone.returnQuantity,
              returnReason: zone.returnReason || returnReason,
              wasteReason: zone.wasteReason || WasteReason
            }))
          } as CancellationItem))
        } as CancellationData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'annulation');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Annulation réussie",
        description: `La livraison ${delivery?.code} a été annulée avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-operations'] });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier qu'au moins une raison est fournie
    if (!returnReason.trim() && !WasteReason.trim()) {
      toast({
        title: "Reasons manquantes",
        description: "Veuillez saisir au moins une raison de retour ou de rebut.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier qu'au moins une quantité est saisie
    const hasQuantities = cancellationItems.some(item =>
      item.zones.some(zone => zone.returnQuantity > 0 || zone.wasteQuantity > 0)
    );

    if (!hasQuantities) {
      toast({
        title: "Quantités manquantes",
        description: "Veuillez saisir au moins une quantité de retour ou de rebut.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier que les quantités ne dépassent pas la quantité livrée
    const hasInvalidQuantities = cancellationItems.some(item =>
      item.zones.some(zone => (zone.returnQuantity + zone.wasteQuantity) > zone.quantity)
    );

    if (hasInvalidQuantities) {
      toast({
        title: "Quantités invalides",
        description: "La somme des quantités de retour et de rebut ne peut pas dépasser la quantité livrée.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await cancelMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReasonRetour('');
    setReasonRebut('');
    setIsSubmitting(false);
    // Ne pas réinitialiser cancellationItems ici car cela interfère avec le rechargement
    onClose();
  };

  if (!delivery) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Annuler la livraison {delivery.code}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champs globaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reason de retour
                </label>
                <Input
                  value={returnReason}
                  onChange={(e) => setReasonRetour(e.target.value)}
                  placeholder="Ex: Client a refusé la livraison"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reason de rebut
                </label>
                <Input
                  value={WasteReason}
                  onChange={(e) => setReasonRebut(e.target.value)}
                  placeholder="Ex: Marchandise endommagée"
                />
              </div>
            </div>

            {/* Tableau des articles de la livraison */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Détail des quantités par article
              </label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead className="text-center">Quantité à livrer</TableHead>
                      <TableHead className="text-center">Zone</TableHead>
                      <TableHead className="text-center">Lot</TableHead>
                      <TableHead className="text-center">Quantité par zone</TableHead>
                      <TableHead className="text-center">Annulation</TableHead>

                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancellationItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <span className="text-lg font-bold text-red-900 uppercase">Aucun produit à livrer</span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cancellationItems.map((summaryItem) => {
                        const { articleId, articleName, articlePhoto, articleUnit, totalQuantity, zones } = summaryItem;

                        return zones.map((zone, zoneIndex) => (
                          <TableRow key={`${articleId}-${zoneIndex}`}>
                            {zoneIndex === 0 && (
                              <TableCell rowSpan={zones.length} className="p-2">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={articlePhoto || ''}
                                    alt={articleName || ''}
                                    className="w-[4rem] h-[3rem] object-cover rounded-lg shadow-sm"
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">{articleName}</div>
                                    <div className="text-sm text-gray-500">{articleUnit}</div>
                                  </div>
                                </div>
                              </TableCell>
                            )}
                            {zoneIndex === 0 && (
                              <TableCell rowSpan={zones.length} className="text-center p-2">
                                <div className="font-bold text-green-700">
                                  {totalQuantity} {articleUnit}
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="text-center p-2">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-medium text-gray-900">{zone.zoneName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center p-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {zone.lotName || 'vide'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center p-2">
                              <span className="font-bold text-blue-700">
                                {zone.quantity} {articleUnit}
                              </span>
                            </TableCell>

                            <TableCell className="text-center p-2 min-w-96 ">
                              <div className='flex gap-2'>
                                <div className="flex flex-1 flex-col items-center gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={zone.quantity - zone.wasteQuantity}
                                    value={zone.returnQuantity}
                                    onChange={(e) => updatereturnQuantity(articleId, zoneIndex, parseFloat(e.target.value) || 0)}
                                    className="w-20 text-center"
                                    placeholder="0"
                                  />
                                  <span className="text-xs text-gray-500">
                                    Max: {zone.quantity - zone.wasteQuantity}
                                  </span>
                                </div>
                                <Input
                                  type="text"
                                  value={zone.returnReason || returnReason}
                                  onChange={(e) => updateReasonRetour(articleId, zoneIndex, e.target.value)}
                                  placeholder="Reason retour"
                                 
                                />
                              </div>
                              <div className='flex  gap-2' >
                                <div className="flex flex-col items-center gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={zone.quantity - zone.returnQuantity}
                                    value={zone.wasteQuantity}
                                    onChange={(e) => updatewasteQuantity(articleId, zoneIndex, parseFloat(e.target.value) || 0)}
                                    className="w-20 text-center"
                                    placeholder="0"
                                  />
                                  <span className="text-xs text-gray-500">
                                    Max: {zone.quantity - zone.returnQuantity}
                                  </span>
                                </div>
                                <Input
                                  type="text"
                                  value={zone.wasteReason || WasteReason}
                                  onChange={(e) => updateReasonRebut(articleId, zoneIndex, e.target.value)}
                                  placeholder="Reason rebut"
                               
                                />
                              </div>



                            </TableCell>

                          </TableRow>
                        ));
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// Page principale
export default function DeliveryCancellationsPage() {
  usePageTitle('Gestion des annulations de livraisons');

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Récupérer les livraisons
  const { data: deliveries = [], isLoading, refetch } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const response = await fetch('/api/deliveries');
      if (!response.ok) throw new Error('Erreur lors de la récupération des livraisons');
      return response.json();
    }
  });

  // Récupérer les opérations d'inventaire pour la traçabilité
  const { data: inventoryOperations = [] } = useQuery({
    queryKey: ['inventory-operations'],
    queryFn: async () => {
      const response = await fetch('/api/inventory-operations');
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Filtrer les livraisons
  const filteredDeliveries = deliveries.filter((delivery: Delivery) => {
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    const matchesSearch = delivery.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.order?.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCancelDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setSelectedDelivery(null);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      in_transit: "default",
      delivered: "secondary",
      cancelled: "destructive"
    };

    const labels: Record<string, string> = {
      pending: "En attente",
      in_transit: "En transit",
      delivered: "Livrée",
      cancelled: "Annulée"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Obtenir les opérations d'inventaire liées à une livraison
  const getRelatedOperations = (deliveryId: number): InventoryOperation[] => {
    return inventoryOperations.filter((op: InventoryOperation) =>
      op.parentOperationId === deliveryId ||
      (op.type === 'livraison' && op.orderId === deliveryId)
    );
  };

  // Statistiques
  const stats = {
    total: deliveries.length,
    cancelled: deliveries.filter((d: Delivery) => d.status === 'cancelled').length,
    pending: deliveries.filter((d: Delivery) => d.status === 'pending').length,
    inTransit: deliveries.filter((d: Delivery) => d.status === 'in_transit').length,
    delivered: deliveries.filter((d: Delivery) => d.status === 'delivered').length
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des annulations</h1>
          <p className="text-muted-foreground">
            Annuler des livraisons et gérer les retours au stock ou rebuts
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">En transit</p>
                <p className="text-2xl font-bold">{stats.inTransit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Livrées</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Annulées</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Code livraison ou nom client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_transit">En transit</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des livraisons */}
      <Card>
        <CardHeader>
          <CardTitle>Livraisons ({filteredDeliveries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Chargement des livraisons...
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune livraison trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date prévue</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Validation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery: Delivery) => {
                  const relatedOperations = getRelatedOperations(delivery.id);

                  return (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-mono">{delivery.code}</TableCell>
                      <TableCell>{delivery.order?.clientName || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(delivery.scheduledDate).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell>
                        {delivery.isValidated ? (
                          <Badge variant="secondary">Validée</Badge>
                        ) : (
                          <Badge variant="outline">Non validée</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {delivery.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelDelivery(delivery)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                          )}
                          {delivery.status === 'cancelled' && (
                            <CancellationDetails
                              delivery={delivery}
                              inventoryOperations={relatedOperations}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal d'annulation */}
      <CancellationModal
        delivery={selectedDelivery}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export { CancellationModal };
