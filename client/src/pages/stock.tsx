import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, Warehouse, QrCode, Calendar, User, MapPin, 
  TrendingUp, TrendingDown, ArrowUpDown, Search, Filter,
  Eye, History, BarChart3, AlertTriangle, CheckCircle
} from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

interface Article {
  id: number;
  code: string;
  name: string;
  type: 'product' | 'ingredient' | 'service';
  currentStock: string;
  unit: string;
  costPerUnit: string;
  storageZoneId: number | null;
  storageZone?: {
    id: number;
    designation: string;
  };
}

interface StockMove {
  id: number;
  code: string;
  type: 'in' | 'out' | 'internal' | 'adjustment';
  status: 'draft' | 'confirmed' | 'done' | 'cancelled';
  articleId: number;
  quantity: string;
  unit: string;
  fromStorageZoneId: number | null;
  toStorageZoneId: number | null;
  stockBefore: string;
  stockAfter: string;
  reason: string;
  notes: string;
  createdAt: string;
  fromStorageZone?: {
    id: number;
    designation: string;
  };
  toStorageZone?: {
    id: number;
    designation: string;
  };
  createdByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface StockByZone {
  zone_id: number;
  zone_name: string;
  stock_quantity: string;
}

interface StorageZone {
  id: number;
  designation: string;
  code: string;
  description: string;
}

export default function Stock() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterZone, setFilterZone] = useState('');

  // Fetch articles with stock information
  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["articles"],
    queryFn: async () => {
      const response = await apiRequest('/api/articles', 'GET');
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

  // Fetch stock moves for selected article
  const { data: stockMoves = [], isLoading: movesLoading } = useQuery<StockMove[]>({
    queryKey: ["stock-moves", selectedArticle?.id],
    queryFn: async () => {
      if (!selectedArticle) return [];
      const response = await apiRequest(`/api/articles/${selectedArticle.id}/stock-history?limit=100`, 'GET');
      return response.json();
    },
    enabled: !!selectedArticle,
  });

  // Fetch stock by zone for selected article
  const { data: stockByZone = [], isLoading: zoneStockLoading } = useQuery<StockByZone[]>({
    queryKey: ["stock-by-zone", selectedArticle?.id],
    queryFn: async () => {
      if (!selectedArticle) return [];
      const response = await apiRequest(`/api/articles/${selectedArticle.id}/stock-by-zone`, 'GET');
      return response.json();
    },
    enabled: !!selectedArticle,
  });

  // Filter articles based on search and filters
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || article.type === filterType;
    const matchesZone = !filterZone || article.storageZoneId === parseInt(filterZone);
    
    return matchesSearch && matchesType && matchesZone;
  });

  const getStockStatus = (currentStock: string, minStock: string = '0', maxStock: string = '0') => {
    const stock = parseFloat(currentStock);
    const min = parseFloat(minStock);
    const max = parseFloat(maxStock);
    
    if (stock <= 0) return { status: 'out', color: 'bg-red-500', text: 'Rupture' };
    if (stock <= min) return { status: 'low', color: 'bg-orange-500', text: 'Stock faible' };
    if (max > 0 && stock >= max) return { status: 'high', color: 'bg-yellow-500', text: 'Stock élevé' };
    return { status: 'normal', color: 'bg-green-500', text: 'Normal' };
  };

  const getMoveTypeIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'out': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'internal': return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
      case 'adjustment': return <BarChart3 className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMoveTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Entrée';
      case 'out': return 'Sortie';
      case 'internal': return 'Transfert';
      case 'adjustment': return 'Ajustement';
      default: return type;
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

  const getZoneName = (zoneId: number | null) => {
    if (!zoneId) return 'Non assigné';
    const zone = storageZones.find(z => z.id === zoneId);
    return zone?.designation || 'Zone inconnue';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type d'article" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="product">Produits</SelectItem>
                <SelectItem value="ingredient">Ingrédients</SelectItem>
                <SelectItem value="service">Services</SelectItem>
              </SelectContent>
            </Select>
            
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
                setFilterType('');
                setFilterZone('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Articles ({filteredArticles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {articlesLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun article trouvé
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredArticles.map((article) => {
                    const stockStatus = getStockStatus(article.currentStock);
                    return (
                      <div
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedArticle?.id === article.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">{article.name}</h3>
                          <Badge className={`${stockStatus.color} text-white text-xs`}>
                            {stockStatus.text}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Code: {article.code}</div>
                          <div>Stock: {parseFloat(article.currentStock).toFixed(3)} {article.unit}</div>
                          <div>Zone: {getZoneName(article.storageZoneId)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Article Details */}
        <div className="lg:col-span-2">
          {selectedArticle ? (
            <div className="space-y-6">
              {/* Article Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedArticle.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Code: {selectedArticle.code} | Type: {selectedArticle.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {parseFloat(selectedArticle.currentStock).toFixed(3)} {selectedArticle.unit}
                      </div>
                      <div className="text-sm text-gray-600">
                        Coût unitaire: {parseFloat(selectedArticle.costPerUnit).toFixed(2)} DA
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Stock by Zone */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Stock par Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {zoneStockLoading ? (
                    <div className="text-center py-4">Chargement...</div>
                  ) : stockByZone.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Aucun stock par zone
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stockByZone.map((zoneStock) => (
                        <div key={zoneStock.zone_id} className="p-3 border rounded-lg">
                          <div className="font-medium">{zoneStock.zone_name}</div>
                          <div className="text-lg font-bold text-blue-600">
                            {parseFloat(zoneStock.stock_quantity).toFixed(3)} {selectedArticle.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stock Movements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Historique des Mouvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {movesLoading ? (
                    <div className="text-center py-4">Chargement...</div>
                  ) : stockMoves.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Aucun mouvement trouvé
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {stockMoves.map((move) => (
                        <div key={move.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getMoveTypeIcon(move.type)}
                              <span className="font-medium text-sm">
                                {getMoveTypeLabel(move.type)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {move.code}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDate(move.createdAt)}
                            </div>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Quantité:</span>
                              <span className={`font-medium ${
                                move.type === 'in' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {move.type === 'in' ? '+' : '-'}{parseFloat(move.quantity).toFixed(3)} {move.unit}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span>Stock avant:</span>
                              <span>{parseFloat(move.stockBefore).toFixed(3)} {move.unit}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span>Stock après:</span>
                              <span className="font-medium">{parseFloat(move.stockAfter).toFixed(3)} {move.unit}</span>
                            </div>
                            
                            {move.fromStorageZoneId && (
                              <div className="flex justify-between">
                                <span>De:</span>
                                <span>{getZoneName(move.fromStorageZoneId)}</span>
                              </div>
                            )}
                            
                            {move.toStorageZoneId && (
                              <div className="flex justify-between">
                                <span>Vers:</span>
                                <span>{getZoneName(move.toStorageZoneId)}</span>
                              </div>
                            )}
                            
                            <div className="text-gray-600 text-xs mt-2">
                              <div><strong>Raison:</strong> {move.reason}</div>
                              {move.notes && <div><strong>Notes:</strong> {move.notes}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionnez un article
                </h3>
                <p className="text-gray-600">
                  Choisissez un article dans la liste pour voir ses détails de stock
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}