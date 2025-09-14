import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Loader2,
  Info,
  TrendingUp,
  Calendar,
  User,
  DollarSign,
  Activity,
  Zap
} from "lucide-react";
import type { Order, Client } from "@shared/schema";

interface ProductionSummaryDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  clients?: Client[];
}

interface ProductionDetail {
  orderId: number;
  etat: string;
  ajustements: string[];
  items: Array<{
    articleId: number;
    articleName: string;
    quantity: number;
    stockAvailable: number;
    quantityAdjusted: number; // Quantité qui peut être ajustée depuis le stock
    inProduction: number; // Maintenant représente la quantité restante à produire
    stockRemaining: number; // Stock restant après tous les ajustements
    status: 'available' | 'partial' | 'missing' | 'in_production';
  }>;
}

export function ProductionSummaryDialog({ 
  order, 
  isOpen, 
  onClose,
  clients = []
}: ProductionSummaryDialogProps) {
  const [productionDetail, setProductionDetail] = useState<ProductionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      fetchProductionDetail();
    }
  }, [isOpen, order]);

  const fetchProductionDetail = async () => {
    if (!order) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/orders/${order.id}/production-detail`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des détails de production");
      }
      const data = await response.json();
      setProductionDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "prepare":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "partiellement_prepare":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "en_cours":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "non_prepare":
      default:
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "prepare":
        return "Préparé";
      case "partiellement_prepare":
        return "Partiellement préparé";
      case "en_cours":
        return "En cours de production";
      case "non_prepare":
      default:
        return "Non préparé";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "prepare":
        return "bg-green-100 text-green-800 border-green-200";
      case "partiellement_prepare":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "en_cours":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "non_prepare":
      default:
        return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'in_production':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'missing':
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getItemStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return "Disponible";
      case 'partial':
        return "Partiellement disponible";
      case 'in_production':
        return "En production";
      case 'missing':
      default:
        return "Non disponible";
    }
  };

  if (!order) return null;

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    if (client?.type !== 'societe') {
      return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
    } else {
      return client ? `${client.companyName}` : "Client inconnu";
    }
  };

  const getProgressValue = (productionDetail: ProductionDetail | null) => {
    if (!productionDetail) return 0;
    
    const totalCommanded = productionDetail.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAdjusted = productionDetail.items.reduce((sum, item) => sum + item.quantityAdjusted, 0);
    
    if (totalCommanded === 0) return 0;
    return Math.round((totalAdjusted / totalCommanded) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0">
        <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold">Résumé de préparation - {order.code}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Informations générales de la commande - Version compacte */}
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-xs text-muted-foreground">Client</div>
                <div className="font-medium">{getClientName(order.clientId)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-xs text-muted-foreground">Livraison</div>
                <div className="font-medium">
                  {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("fr-FR") : "Non définie"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-xs text-muted-foreground">Total TTC</div>
                <div className="font-medium">{parseFloat(order.totalTTC || "0").toFixed(2)} DA</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-xs text-muted-foreground">Statut</div>
                <div className="font-medium capitalize">{order.status}</div>
              </div>
            </div>
          </div>

          {/* Statut global de production - Version compacte */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-muted-foreground">Chargement des détails...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-red-700 font-medium text-sm">{error}</span>
            </div>
          ) : productionDetail ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {getStatusIcon(productionDetail.etat)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Badge 
                        className={`${getStatusColor(productionDetail.etat)} border-0 text-sm font-medium px-2 py-1`}
                        variant="outline"
                      >
                        {getStatusLabel(productionDetail.etat)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getProgressValue(productionDetail)}% complété
                      </span>
                    </div>
                    <Progress 
                      value={getProgressValue(productionDetail)} 
                      className="h-1.5"
                    />
                </div>
              </div>

              {/* Détail des articles - Version optimisée */}
              <div className="bg-white rounded-lg border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-600" />
                    Détail des articles ({productionDetail.items.length})
                  </h3>
                </div>
                <ScrollArea className="h-[50vh]">
                  <div className="p-4">
                    <div className="space-y-3">
                      {productionDetail.items
                        .sort((a, b) => a.inProduction - b.inProduction) // Trier par quantité à produire (croissant)
                        .map((item, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4 bg-gradient-to-r from-white to-slate-50 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-slate-100 rounded-lg">
                                <Package className="h-3.5 w-3.5 text-slate-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">
                                  {item.articleName}
                                  <span className="text-xs text-gray-500 font-normal ml-2">
                                    (Stock: {item.stockAvailable})
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">Article #{item.articleId}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getItemStatusIcon(item.status)}
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-2 py-0.5 ${
                                  item.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' :
                                  item.status === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  item.status === 'in_production' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {getItemStatusLabel(item.status)}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="text-center p-2.5 bg-white rounded-lg border border-slate-200">
                              <div className="text-xl font-bold text-slate-900">{item.quantity}</div>
                              <div className="text-xs text-muted-foreground">Commandé</div>
                            </div>
                            <div className="text-center p-2.5 bg-white rounded-lg border border-slate-200">
                              <div className="text-xl font-bold text-gray-600">{item.stockRemaining}</div>
                              <div className="text-xs text-muted-foreground">Qté restante</div>
                            </div>
                            <div className="text-center p-2.5 bg-white rounded-lg border border-slate-200">
                              <div className="text-xl font-bold text-blue-600">{item.quantityAdjusted}</div>
                              <div className="text-xs text-muted-foreground">Qté qui sera prélevée</div>
                            </div>
                           
                            <div className="text-center p-2.5 bg-white rounded-lg border border-slate-200">
                              <div className="text-xl font-bold text-orange-600">
                                {item.inProduction}
                              </div>
                              <div className="text-xs text-muted-foreground">À produire</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>

           
            </>
          ) : null}
        </div>

        <div className="px-4 py-3 border-t bg-slate-50 flex justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
