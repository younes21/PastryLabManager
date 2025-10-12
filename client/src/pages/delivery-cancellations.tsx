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
    wasteReason?: string;
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
  const [reason, setReason] = useState('');
  const [isReturnToStock, setIsReturnToStock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellationItems, setCancellationItems] = useState<Array<{
    articleId: number;
    article: any;
    totalQuantity: number;
    zones: Array<{
      zoneId: number;
      zoneName: string;
      lotId: number | null;
      lotName: string;
      quantity: number;
      notes: string;
      wasteQuantity: number;
      returnQuantity: number;
      wasteReason: string;
    }>;
  }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les données de la livraison pour générer le tableau summary
  const { data: deliveryData } = useQuery({
    queryKey: ['delivery-details', delivery?.id],
    queryFn: async () => {
      if (!delivery?.id) return null;
      const response = await fetch(`/api/deliveries/${delivery.id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des détails de la livraison');
      return response.json();
    },
    enabled: !!delivery?.id && isOpen
  });

  // Générer les données du tableau summary
  const generateSummaryData = () => {
    if (!deliveryData?.items) return [];
    
    const summaryItems: Array<{
      articleId: number;
      article: any;
      totalQuantity: number;
      zones: Array<{
        zoneId: number;
        zoneName: string;
        lotId: number | null;
        lotName: string;
        quantity: number;
        notes: string;
        wasteQuantity: number;
        returnQuantity: number;
        wasteReason: string;
      }>;
    }> = [];

    deliveryData.items.forEach((item: any) => {
      if (item.quantity === 0) return;

      const articleId = item.articleId;
      const article = item.article;
      const quantity = item.quantity;

      // Pour chaque article, créer une entrée avec les zones
      summaryItems.push({
        articleId,
        article,
        totalQuantity: quantity,
        zones: [{
          zoneId: item.fromStorageZoneId || 0,
          zoneName: item.storageZone?.designation || `Zone ${item.fromStorageZoneId || '-'}`,
          lotId: item.lotId,
          lotName: item.lot?.code || 'vide',
          quantity: quantity,
          notes: item.notes || "",
          wasteQuantity: 0,
          returnQuantity: quantity,
          wasteReason: ""
        }]
      });
    });

    return summaryItems;
  };

  // Mettre à jour les données d'annulation quand les données de livraison changent
  useEffect(() => {
    if (deliveryData) {
      const summaryData = generateSummaryData();
      setCancellationItems(summaryData);
    }
  }, [deliveryData]);

  // Fonctions pour gérer les changements dans les inputs
  const updateWasteQuantity = (articleId: number, zoneIndex: number, value: number) => {
    setCancellationItems(prev => prev.map(item => {
      if (item.articleId === articleId) {
        const updatedZones = [...item.zones];
        updatedZones[zoneIndex] = { ...updatedZones[zoneIndex], wasteQuantity: value };
        return { ...item, zones: updatedZones };
      }
      return item;
    }));
  };

  const updateReturnQuantity = (articleId: number, zoneIndex: number, value: number) => {
    setCancellationItems(prev => prev.map(item => {
      if (item.articleId === articleId) {
        const updatedZones = [...item.zones];
        updatedZones[zoneIndex] = { ...updatedZones[zoneIndex], returnQuantity: value };
        return { ...item, zones: updatedZones };
      }
      return item;
    }));
  };

  const updateWasteReason = (articleId: number, zoneIndex: number, value: string) => {
    setCancellationItems(prev => prev.map(item => {
      if (item.articleId === articleId) {
        const updatedZones = [...item.zones];
        updatedZones[zoneIndex] = { ...updatedZones[zoneIndex], wasteReason: value };
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
          reason, 
          isReturnToStock,
          cancellationItems: cancellationItems.map(item => ({
            articleId: item.articleId,
            zones: item.zones.map(zone => ({
              zoneId: zone.zoneId,
              lotId: zone.lotId,
              wasteQuantity: zone.wasteQuantity,
              returnQuantity: zone.returnQuantity,
              wasteReason: zone.wasteReason
            }))
          }))
        })
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

    if (!reason.trim() || reason.trim().length < 3) {
      toast({
        title: "Raison invalide",
        description: "La raison doit contenir au moins 3 caractères.",
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
    setReason('');
    setIsReturnToStock(true);
    setIsSubmitting(false);
    setCancellationItems([]);
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
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Raison de l'annulation *
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Client a refusé la livraison"
                minLength={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 3 caractères requis
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Type d'annulation
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={isReturnToStock ? "default" : "outline"}
                    onClick={() => setIsReturnToStock(true)}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retour au stock
                  </Button>
                  <Button
                    type="button"
                    variant={!isReturnToStock ? "default" : "outline"}
                    onClick={() => setIsReturnToStock(false)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Rebut
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isReturnToStock
                    ? "Les articles seront remis en stock"
                    : "Les articles seront marqués comme perdus/endommagés"
                  }
                </p>
              </div>

              {/* Tableau summary avec inputs */}
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
                        <TableHead className="text-center">Qté Rebut</TableHead>
                        <TableHead className="text-center">Qté Retour</TableHead>
                        <TableHead className="text-center">Cause Rebut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cancellationItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <span className="text-lg font-bold text-red-900 uppercase">Aucun produit à livrer</span>
                          </TableCell>
                        </TableRow>
                      ) : (
                        cancellationItems.map((summaryItem) => {
                          const { articleId, article, totalQuantity, zones } = summaryItem;

                          return zones.map((zone, zoneIndex) => (
                            <TableRow key={`${articleId}-${zoneIndex}`}>
                              {zoneIndex === 0 && (
                                <TableCell rowSpan={zones.length} className="p-2">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={article?.photo || ''}
                                      alt={article?.name || ''}
                                      className="w-[4rem] h-[3rem] object-cover rounded-lg shadow-sm"
                                    />
                                    <div>
                                      <div className="font-medium text-gray-900">{article?.name}</div>
                                      <div className="text-sm text-gray-500">{article?.unit}</div>
                                    </div>
                                  </div>
                                </TableCell>
                              )}
                              {zoneIndex === 0 && (
                                <TableCell rowSpan={zones.length} className="text-center p-2">
                                  <div className="font-bold text-green-700">
                                    {totalQuantity} {article?.unit}
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="text-center p-2">
                                <div className="text-sm">{zone.zoneName}</div>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <div className="text-sm">{zone.lotName}</div>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <div className="font-bold text-blue-700">
                                  {zone.quantity} {article?.unit}
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={zone.quantity}
                                  value={zone.wasteQuantity}
                                  onChange={(e) => updateWasteQuantity(articleId, zoneIndex, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-center"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={zone.quantity}
                                  value={zone.returnQuantity}
                                  onChange={(e) => updateReturnQuantity(articleId, zoneIndex, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-center"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell className="text-center p-2">
                                {zone.wasteQuantity > 0 && (
                                  <Input
                                    type="text"
                                    value={zone.wasteReason}
                                    onChange={(e) => updateWasteReason(articleId, zoneIndex, e.target.value)}
                                    placeholder="Cause du rebut"
                                    className="w-32"
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          ));
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Annuler la livraison
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
