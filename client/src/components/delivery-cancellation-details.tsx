import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Eye, RotateCcw, Trash2, Calendar, User, XCircle } from 'lucide-react';
import { InventoryOperationStatus } from '@shared/constants';

interface Delivery {
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
}

interface CancellationDetailsProps {
  delivery: Delivery;
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
      reason?: string;
    }>;
  }>;
}

interface CancellationDetailsData {
  delivery: {
    id: number;
    code: string;
    reason: string;
  };
  returnOperation: {
    id: number;
    code: string;
    reason: string;
    items: Array<{
      articleId: number;
      articleName: string;
      articlePhoto: string;
      articleUnit: string;
      zoneId: number;
      zoneName: string;
      lotId: number | null;
      lotName: string;
      quantity: number;
      reason: string;
    }>;
  } | null;
  wasteOperation: {
    id: number;
    code: string;
    reason: string;
    items: Array<{
      articleId: number;
      articleName: string;
      articlePhoto: string;
      articleUnit: string;
      zoneId: number;
      zoneName: string;
      lotId: number | null;
      lotName: string;
      quantity: number;
      reason: string;
    }>;
  } | null;
}

// Modal de consultation des détails d'annulation
function CancellationDetailsModal({ delivery, isOpen, onClose }: { delivery: Delivery; isOpen: boolean; onClose: () => void }) {
  const [cancellationData, setCancellationData] = useState<CancellationDetailsData | null>(null);

  // Récupérer les détails d'annulation
  const { data: detailsData, isLoading } = useQuery({
    queryKey: ['cancellation-details', delivery.id],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/${delivery.id}/cancellation-details`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des détails d\'annulation');
      return response.json();
    },
    enabled: !!delivery.id && isOpen,
    staleTime: 0,
    gcTime: 0
  });

  useEffect(() => {
    if (detailsData) {
      setCancellationData(detailsData);
    }
  }, [detailsData]);

  if (!delivery) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Détails d'annulation - {delivery.code}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className='py-2'>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Chargement des détails...</span>
            </div>
          ) : cancellationData ? (
            <div className="space-y-4">
              {/* Informations générales */}
              <Card>
                <CardHeader className='py-2'>
                  <CardTitle className="text-lg">Informations d'annulation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Code livraison</label>
                      <p className="text-lg font-mono">{cancellationData.delivery.code}</p>
                    </div>
                    <div className='font-medium'>
                      <label className="  text-gray-500 ">Raison d'annulation</label>
                      {
                        cancellationData.delivery?.reason?.split(',').map(reason=> <p className="text-lg">{ reason}</p>)
                      }
                     
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Opération de retour */}
              {cancellationData.returnOperation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <RotateCcw className="h-5 w-5 text-green-600" />
                      Retour au stock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className=" text-gray-600">
                        <strong>Code opération:</strong> {cancellationData.returnOperation.code}
                      </p>
                      <p className=" text-gray-600">
                        <strong>Raison:</strong> {cancellationData.returnOperation.reason}
                      </p>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Article</TableHead>
                            <TableHead className="text-center">Zone</TableHead>
                            <TableHead className="text-center">Lot</TableHead>
                            <TableHead className="text-center">Quantité retournée</TableHead>
                            <TableHead className="text-center">Raison</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cancellationData.returnOperation.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="p-2">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={item.articlePhoto || ''}
                                    alt={item.articleName || ''}
                                    className="w-[4rem] h-[3rem] object-cover rounded-lg shadow-sm"
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">{item.articleName}</div>
                                    <div className="text-sm text-gray-500">{item.articleUnit}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="font-medium text-gray-900">{item.zoneName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  {item.lotName}
                                </span>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <span className="font-bold text-green-700">
                                  {item.quantity} {item.articleUnit}
                                </span>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <span className="text-sm text-gray-600">
                                  {item.reason || "-"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Opération de rebut */}
              {cancellationData.wasteOperation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Trash2 className="h-5 w-5 text-red-600" />
                      Rebut
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <strong>Code opération:</strong> {cancellationData.wasteOperation.code}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Raison:</strong> {cancellationData.wasteOperation.reason}
                      </p>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Article</TableHead>
                            <TableHead className="text-center">Zone</TableHead>
                            <TableHead className="text-center">Lot</TableHead>
                            <TableHead className="text-center">Quantité rebutée</TableHead>
                            <TableHead className="text-center">Raison</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cancellationData.wasteOperation.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="p-2">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={item.articlePhoto || ''}
                                    alt={item.articleName || ''}
                                    className="w-[4rem] h-[3rem] object-cover rounded-lg shadow-sm"
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">{item.articleName}</div>
                                    <div className="text-sm text-gray-500">{item.articleUnit}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="font-medium text-gray-900">{item.zoneName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  {item.lotName}
                                </span>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <span className="font-bold text-red-700">
                                  {item.quantity} {item.articleUnit}
                                </span>
                              </TableCell>
                              <TableCell className="text-center p-2">
                                <span className="text-sm text-gray-600">
                                  {item.reason || "-"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Aucune opération trouvée */}
              {!cancellationData.returnOperation && !cancellationData.wasteOperation && (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg">Aucun détail d'annulation trouvé</p>
                      <p className="text-sm">Cette livraison a été annulée sans opérations de retour ou rebut.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Erreur lors du chargement des détails d'annulation</p>
            </div>
          )}

          <div className="flex gap-2 justify-end mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// Composant principal
function CancellationDetails({ delivery, inventoryOperations }: CancellationDetailsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1 bg-red-50"
      >
        <Eye className="h-4 w-4" />
      { delivery.status === InventoryOperationStatus.PARTIALLY_COMPLETED? 'Annulation partielle': 'Annulation'}
      </Button>

      <CancellationDetailsModal
        delivery={delivery}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default CancellationDetails;
export { CancellationDetails };