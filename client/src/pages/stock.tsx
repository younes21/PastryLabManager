import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package, Warehouse, QrCode, Calendar, User, MapPin,
  TrendingUp, TrendingDown, ArrowUpDown, Search, Filter,
  Eye, History, BarChart3, AlertTriangle, CheckCircle,
  Plus, Minus, ArrowRight, ArrowLeft
} from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { usePageTitle } from '@/hooks/usePageTitle';

interface StockItem {
  id: number;
  articleId: number;
  article: {
    id: number;
    code: string;
    name: string;
    type: 'product' | 'ingredient' | 'service';
    unit: string;
    costPerUnit: string;
    currentStock: string;
    minStock: string;
    maxStock: string;
    storageZoneId: number | null;
    storageZone?: {
      id: number;
      designation: string;
    };
  };
  storageZoneId: number;
  storageZone: {
    id: number;
    designation: string;
  };
  quantity: string;
  lotId: number | null;
  lot?: {
    id: number;
    code: string;
    expirationDate: string | null;
  };
}

interface InventoryOperation {
  id: number;
  code: string;
  type: string;
  status: string;
  scheduledDate: string;
  completedAt: string | null;
  notes: string;
  createdBy: number;
  createdByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  items: InventoryOperationItem[];
}

interface InventoryOperationItem {
  id: number;
  operationId: number;
  articleId: number;
  article: {
    id: number;
    code: string;
    name: string;
    type: string;
    unit: string;
  };
  quantity: string;
  quantityBefore: string;
  quantityAfter: string;
  unitCost: string;
  fromStorageZoneId: number | null;
  toStorageZoneId: number | null;
  fromStorageZone?: {
    id: number;
    designation: string;
  };
  toStorageZone?: {
    id: number;
    designation: string;
  };
  notes: string;
  createdAt: string;
  lotId: number | null;
  lot?: {
    id: number;
    code: string;
  };
}

interface StorageZone {
  id: number;
  designation: string;
  code: string;
  description: string;
}

export default function Stock() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("ingredients");
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [isOperationsDialogOpen, setIsOperationsDialogOpen] = useState(false);
  // Ajout état pour filtrer les opérations par zone/lot
  const [operationZoneLotFilter, setOperationZoneLotFilter] = useState<{zoneId?: number, lotId?: number} | null>(null);

  // Fetch stock data with article and storage zone information
  const { data: stockItems = [], isLoading: stockLoading } = useQuery<StockItem[]>({
    queryKey: ["stock-items"],
    queryFn: async () => {
      const response = await apiRequest('/api/stock/items', 'GET');
      return response.json();
    },
  });

  // Fetch storage zones
  const { data: storageZones = [], isLoading: zonesLoading } = useQuery<StorageZone[]>({
    queryKey: ["storage-zones"],
    queryFn: async () => {
      const response = await apiRequest('/api/storage-zones', 'GET');
      return response.json();
    },
  });

  // Fetch inventory operations for selected stock item
  const { data: inventoryOperations = [], isLoading: operationsLoading } = useQuery<InventoryOperation[]>({
    queryKey: ["inventory-operations", selectedStockItem?.articleId],
    queryFn: async () => {
      if (!selectedStockItem) return [];
      const response = await apiRequest(`/api/stock/${selectedStockItem.articleId}/operations`, 'GET');
      return response.json();
    },
    enabled: !!selectedStockItem,
  });

  // Filter stock items based on search and filters
  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch = item.article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.article.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeTab === "ingredients" ? item.article.type === 'ingredient' : item.article.type === 'product';
    const matchesZone = !filterZone || item.storageZoneId === parseInt(filterZone);

    return matchesSearch && matchesType && matchesZone;
  });

  // Grouper les articles par articleId (pour ingredients)
  const groupedIngredients = Object.values(filteredStockItems
    .filter(item => item.article.type === 'ingredient')
    .reduce((acc, item) => {
      if (!acc[item.articleId]) acc[item.articleId] = { article: item.article, items: [] };
      acc[item.articleId].items.push(item);
      return acc;
    }, {} as Record<number, { article: StockItem['article'], items: StockItem[] }>));

  // Grouper les produits par articleId (pour produits)
  const groupedProducts = Object.values(filteredStockItems
    .filter(item => item.article.type === 'product')
    .reduce((acc, item) => {
      if (!acc[item.articleId]) acc[item.articleId] = { article: item.article, items: [] };
      acc[item.articleId].items.push(item);
      return acc;
    }, {} as Record<number, { article: StockItem['article'], items: StockItem[] }>));

  const getStockStatus = (quantity: string, minStock: string, maxStock: string) => {
    const stock = parseFloat(quantity);
    const min = parseFloat(minStock || '0');
    const max = parseFloat(maxStock || '0');

    if (stock <= 0) return { status: 'out', color: 'bg-red-500', text: 'Rupture' };
    if (stock <= min) return { status: 'low', color: 'bg-orange-500', text: 'Stock faible' };
    if (max > 0 && stock >= max) return { status: 'high', color: 'bg-yellow-500', text: 'Stock élevé' };
    return { status: 'normal', color: 'bg-green-500', text: 'Normal' };
  };

  const getOperationTypeIcon = (type: string) => {
    switch (type) {
      case 'reception':
      case 'fabrication':
      case 'ajustement_plus':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'livraison':
      case 'consommation':
      case 'ajustement_moins':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'transfert':
        return <ArrowRight className="w-4 h-4 text-blue-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'reception': return 'Réception';
      case 'livraison': return 'Livraison';
      case 'fabrication': return 'Fabrication';
      case 'consommation': return 'Consommation';
      case 'transfert': return 'Transfert';
      case 'ajustement': return 'Ajustement';
      case 'inventaire': return 'Inventaire';
      default: return type;
    }
  };

  const getOperationDirection = (quantityAfter: number, quantityBefore: number) => {

    let toStock = quantityAfter == quantityBefore ? null : quantityAfter < quantityBefore;

    switch (toStock) {
      case true:
        return { direction: 'in', color: 'text-green-600', icon: <TrendingUp className="w-4 h-4" /> };
      case false:
        return { direction: 'out', color: 'text-red-600', icon: <TrendingDown className="w-4 h-4" /> };
      default:
        return { direction: 'neutral', color: 'text-gray-600', icon: <Package className="w-4 h-4" /> };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewOperations = (stockItem: StockItem) => {
    setSelectedStockItem(stockItem);
    setIsOperationsDialogOpen(true);
  };
  usePageTitle('Gestion des stocks')
  return (
    <div className="space-y-6">


      {/* Filters */}
      <Card className="m-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterZone} onValueChange={setFilterZone}>
              <SelectTrigger>
                <SelectValue placeholder="Zone de stockage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les zones</SelectItem>
                {storageZones.map(zone => (
                  <SelectItem key={zone.id} value={zone.id.toString()}>
                    {zone.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterZone('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ingredients" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Ingrédients ({filteredStockItems.filter(item => item.article.type === 'ingredient').length})
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produits ({filteredStockItems.filter(item => item.article.type === 'product').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Stock des Ingrédients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedIngredients.map(({ article, items }) => {
                      const totalStock = items.reduce((sum, i) => sum + parseFloat(i.quantity), 0);
                      const stockStatus = getStockStatus(totalStock.toString(), article.minStock, article.maxStock);
                      // On prend le premier item pour l'action (pour ouvrir le dialogue sur cet article)
                      const firstItem = items[0];
                      return (
                        <TableRow key={article.id}>
                          <TableCell>
                            <div className="font-medium">{article.name}</div>
                            <div className="text-sm text-gray-500">{article.code}</div>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <div className="font-medium">{totalStock.toFixed(3)} {article.unit}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${stockStatus.color} text-white`}>{stockStatus.text}</Badge>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleViewOperations(firstItem)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Détail
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Stock des Produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedProducts.map(({ article, items }) => {
                      const totalStock = items.reduce((sum, i) => sum + parseFloat(i.quantity), 0);
                      const stockStatus = getStockStatus(totalStock.toString(), article.minStock, article.maxStock);
                      // On prend le premier item pour l'action (pour ouvrir le dialogue sur cet article)
                      const firstItem = items[0];
                      return (
                        <TableRow key={article.id}>
                          <TableCell>
                            <div className="font-medium">{article.name}</div>
                            <div className="text-sm text-gray-500">{article.code}</div>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <div className="font-medium">{totalStock.toFixed(3)} {article.unit}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${stockStatus.color} text-white`}>{stockStatus.text}</Badge>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleViewOperations(firstItem)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Détail
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Operations Dialog */}
      <Dialog open={isOperationsDialogOpen} onOpenChange={setIsOperationsDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historique des Opérations - {selectedStockItem?.article.name}
            </DialogTitle>
          </DialogHeader>

          {operationsLoading ? (
            <div className="text-center py-8">Chargement des opérations...</div>
          ) : inventoryOperations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune opération trouvée pour cet article
            </div>
          ) : (
            <>
              {/* Tableau récapitulatif par zone/lot */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <Button size="sm" variant={!operationZoneLotFilter ? "default" : "outline"} onClick={() => setOperationZoneLotFilter(null)}>
                    Afficher tout
                  </Button>
                 
                </div>
                {/* Tableau détail par zone/lot */}
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Quantité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockItems
                      .filter(item => item.articleId === selectedStockItem?.articleId)
                      .map((item, idx) => (
                        <TableRow
                          key={item.id}
                          className={operationZoneLotFilter && operationZoneLotFilter.zoneId === item.storageZoneId && operationZoneLotFilter.lotId === item.lot?.id ? 'bg-blue-100 cursor-pointer' : 'cursor-pointer'}
                          onClick={() => setOperationZoneLotFilter({ zoneId: item.storageZoneId, lotId: item.lot?.id })}
                        >
                          <TableCell>{item.storageZone?.designation || '-'}</TableCell>
                          <TableCell>{item.lot?.code || '-'}</TableCell>
                          <TableCell>{parseFloat(item.quantity).toFixed(3)} {item.article.unit}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {/* Tableau des opérations filtré */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead className="w-[100px]">Statut</TableHead>
                      <TableHead className="w-[80px]">Direction</TableHead>
                      <TableHead className="w-[100px]">Quantité</TableHead>
                      <TableHead className="w-[100px]">Stock Avant</TableHead>
                      <TableHead className="w-[100px]">Stock Après</TableHead>
                      <TableHead className="w-[100px]">Coût Unitaire</TableHead>
                      {/* <TableHead className="w-[150px]">Zones</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryOperations.flatMap((operation) =>
                      operation.items
                        .filter(item => item.articleId === selectedStockItem?.articleId)
                        .filter(item => {
                          if (!operationZoneLotFilter) return true;
                          const zoneMatch = !operationZoneLotFilter.zoneId ||item.toStorageZoneId === operationZoneLotFilter.zoneId|| item.fromStorageZoneId === operationZoneLotFilter.zoneId;
                          const lotMatch = !operationZoneLotFilter.lotId || item.lot?.id === operationZoneLotFilter.lotId;
                          return zoneMatch && lotMatch;
                        })
                        .sort((a, b) =>
                          new Date(b.createdAt.replace(" ", "T")).getTime() -
                          new Date(a.createdAt.replace(" ", "T")).getTime()
                        )
                        .map((item) => {
                          const direction = getOperationDirection(parseFloat(item.quantityBefore || "0"), parseFloat(item.quantityAfter || "0"));
                          return (
                            <TableRow key={`${operation.id}-${item.id}`}>
                              <TableCell className="text-sm">
                                {formatDate(item.createdAt)}
                              </TableCell>
                              {/* <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {operation.code}
                                </Badge>
                              </TableCell> */}
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {getOperationTypeIcon(operation.type)}
                                  <span className="text-sm">{getOperationTypeLabel(operation.type)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${operation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  operation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {operation.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className={`flex items-center gap-1 ${direction.color}`}>
                                  {direction.icon}
                                  <span className="text-sm">
                                    {direction.direction === 'in' ? 'Entrée' :
                                      direction.direction === 'out' ? 'Sortie' : 'Transfert'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className={`font-medium ${direction.color}`}>
                                {direction.direction === 'in' ? '+' : ''}{parseFloat(item.quantity).toFixed(3)} {item.article.unit}
                              </TableCell>
                              <TableCell className="text-sm">
                                {parseFloat(item.quantityBefore || '0').toFixed(3)} {item.article.unit}
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {parseFloat(item.quantityAfter || '0').toFixed(3)} {item.article.unit}
                              </TableCell>
                              <TableCell className="text-sm">
                                {parseFloat(item.unitCost || '0').toFixed(2)} DA
                              </TableCell>
                              {/* <TableCell className="text-sm">
                                {(item.fromStorageZoneId || item.toStorageZoneId) ? (
                                  <div className="space-y-1">
                                    {item.fromStorageZoneId && (
                                      <div className="flex items-center gap-1 text-xs">
                                        <ArrowLeft className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-600">De:</span>
                                        <span>{item.fromStorageZone?.designation || 'Zone inconnue'}</span>
                                      </div>
                                    )}
                                    {item.toStorageZoneId && (
                                      <div className="flex items-center gap-1 text-xs">
                                        <ArrowRight className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-600">Vers:</span>
                                        <span>{item.toStorageZone?.designation || 'Zone inconnue'}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell> */}
                              {/* <TableCell className="text-sm">
                                <div className="max-w-[180px] truncate" title={item.notes || ''}>
                                  {item.notes || '-'}
                                </div>
                              </TableCell> */}
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}