import React, { useState, useEffect } from 'react';
import { Plus, Save, X, FileText, Edit3, Trash2, ChevronDown, Search, Package, Warehouse } from 'lucide-react';
import { Layout } from '@/components/layout';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const InventoryPhysicalInterface = () => {
  const [operations, setOperations] = useState<any[]>([]);
  const [currentOperation, setCurrentOperation] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [showArticleSelect, setShowArticleSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('ingredients');

  // Data from API
  const [storageZones, setStorageZones] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);

  // Load initial data from API
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [zoneRes, artRes, stockRes, invRes] = await Promise.all([
          apiRequest('/api/storage-zones', 'GET'),
          apiRequest('/api/articles', 'GET'),
          apiRequest('/api/stock/items', 'GET'),
          apiRequest('/api/inventory-operations?type=ajustement', 'GET'),
        ]);

        const zonesData = await zoneRes.json();
        const articlesData = await artRes.json();
        const stockData = await stockRes.json();
        const invData = await invRes.json();

        setStorageZones(zonesData || []);
        setArticles(articlesData || []);
        setStockItems(stockData || []);
        setOperations(invData || []);
      } catch (e) {
        console.error('Failed to load initial data', e);
      }
    };

    void loadAll();
  }, []);

  const createNewOperation = () => {
    const newOp = {
      id: -Date.now(),
      code: undefined,
      status: 'draft',
      type: 'ajustement',
      storageZoneId: '',
      notes: '',
      createdAt: new Date().toISOString(),
      items: []
    };
    setCurrentOperation(newOp);
    setItems([]);
    setIsEditing(true);
  };

  const editOperation = async (op: any) => {
    try {
      if (op.status === 'completed') {
        alert('Impossible de modifier un inventaire déjà complété.');
        return;
      }

      const res = await apiRequest(`/api/inventory-operations/${op.id}`, 'GET');
      const data = await res.json();

      setCurrentOperation({
        id: data.id,
        code: data.code,
        type: data.type,
        status: data.status,
        storageZoneId: data.storageZoneId,
        notes: data.notes || '',
        createdAt: data.createdAt,
      });

      setItems((data.items || []).map((it: any) => ({
        id: it.id,
        articleId: it.articleId,
        article: articles.find((a: any) => a.id === it.articleId) || { id: it.articleId },
        currentStock: parseFloat(it.quantityBefore || '0'),
        newQuantity: parseFloat(it.quantity || '0'),
        unit: articles.find((a: any) => a.id === it.articleId)?.unit || '',
        storageZoneId: it.toStorageZoneId || null,
        lotId: it.lotId || null,
        lotCode: it.lotCode || '',
        serialNumber: it.serialNumber || '',
        notes: it.notes || '',
      })));

      setIsEditing(true);
    } catch (e) {
      console.error('Failed to load operation', e);
      alert('Erreur lors du chargement de l\'opération');
    }
  };

  const deleteOperation = async (op: any) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet inventaire ?')) return;
    
    try {
      await apiRequest(`/api/inventory-operations/${op.id}`, 'DELETE');
      setOperations(operations.filter(o => o.id !== op.id));
      alert('Inventaire supprimé avec succès');
    } catch (e) {
      console.error('Failed to delete operation', e);
      alert('Erreur lors de la suppression');
    }
  };

  const addItem = (article: any) => {
    // Trouver tous les items de stock pour cet article dans différentes zones
    const articleStockItems = stockItems.filter(s => s.articleId === article.id);
    
    // Pour chaque zone où l'article existe, créer un item
    articleStockItems.forEach(stockItem => {
      const currentStock = parseFloat(stockItem.quantity) || 0;
      
      // Vérifier si cet article dans cette zone existe déjà
      const existingItem = items.find(item => 
        item.articleId === article.id && 
        item.storageZoneId === stockItem.storageZoneId
      );
      
      if (!existingItem) {
        const newItem = {
          id: Date.now() + Math.random(), // Pour éviter les doublons d'ID
          articleId: article.id,
          article: article,
          currentStock: currentStock,
          newQuantity: currentStock,
          unit: article.unit,
          storageZoneId: stockItem.storageZoneId,
          lotId: stockItem.lotId || null,
          lotCode: stockItem.lot?.code || '',
          serialNumber: stockItem.serialNumber || '',
          notes: '',
        };

        setItems(prev => [...prev, newItem]);
      }
    });
    
    setSelectedArticle(null);
    setShowArticleSelect(false);
  };

  const removeItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: number, newQuantity: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          newQuantity: parseFloat(newQuantity) || 0
        };
      }
      return item;
    }));
  };



  const saveOperation = async () => {
    if (!currentOperation) return;

    try {
      if (!currentOperation.storageZoneId || items.length === 0) {
        alert('Sélectionnez une zone de stockage et au moins un article.');
        return;
      }

      const operationData = {
        type: 'ajustement',
        status: currentOperation.status || 'draft',
        storageZoneId: currentOperation.storageZoneId,
        notes: currentOperation.notes || '',
      };

      const itemsData = items.map((it) => ({
        articleId: it.articleId,
        quantity: (it.newQuantity - it.currentStock).toString(),
        quantityBefore: it.currentStock.toString(),
        quantityAfter: it.newQuantity.toString(),
        unitCost: '0',
        toStorageZoneId: it.storageZoneId || currentOperation.storageZoneId,
        lotId: it.lotId || null,
        serialNumber: it.serialNumber || null,
        notes: it.notes || '',
      }));

      const payload = {
        operation: operationData,
        items: itemsData,
      };

      let res;
      let data;

      if (currentOperation.id > 0 && typeof currentOperation.id === 'number') {
        res = await apiRequest(`/api/inventory-operations/${currentOperation.id}`, 'PUT', payload);
        data = await res.json();
        setOperations((prev) => prev.map(op => op.id === currentOperation.id ? data : op));
        alert('Inventaire modifié avec succès');
      } else {
        res = await apiRequest('/api/inventory-operations', 'POST', payload);
        data = await res.json();
        setOperations((prev) => [data, ...prev]);
        alert('Inventaire créé avec succès');
      }

      setCurrentOperation({
        id: data.id,
        code: data.code,
        type: data.type,
        status: data.status,
        storageZoneId: data.storageZoneId,
        notes: data.notes || '',
        createdAt: data.createdAt,
      });

      setItems((data.items || []).map((it: any) => ({
        id: it.id,
        articleId: it.articleId,
        article: articles.find((a: any) => a.id === it.articleId) || { id: it.articleId },
        currentStock: parseFloat(it.quantityBefore || '0'),
        newQuantity: parseFloat(it.quantityAfter || '0'),
        unit: articles.find((a: any) => a.id === it.articleId)?.unit || '',
        storageZoneId: it.toStorageZoneId || null,
        lotId: it.lotId || null,
        lotCode: it.lotCode || '',
        serialNumber: it.serialNumber || '',
        notes: it.notes || '',
      })));

      // Refresh stock data
      try {
        const stockRes = await apiRequest('/api/stock/items', 'GET');
        const stockData = await stockRes.json();
        setStockItems(stockData || []);
      } catch {}

    } catch (e) {
      console.error('Failed to save inventory operation', e);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const completeOperation = async () => {
    if (!currentOperation?.id) {
      alert('Veuillez sauvegarder avant de confirmer.');
      return;
    }
    
    if (!items.length) {
      alert('Ajoutez au moins un article pour confirmer.');
      return;
    }
    
    try {
      await apiRequest(`/api/inventory-operations/${currentOperation.id}`, 'PATCH', { status: 'completed' });
      setOperations(operations.map(op => op.id === currentOperation.id ? { ...op, status: 'completed' } : op));
      setCurrentOperation({ ...currentOperation, status: 'completed' });
      
      // Refresh stock data
      try {
        const stockRes = await apiRequest('/api/stock/items', 'GET');
        const stockData = await stockRes.json();
        setStockItems(stockData || []);
      } catch {}
      
      alert('Inventaire complété');
    } catch (e) {
      console.error('Failed to complete', e);
      alert('Erreur lors de la confirmation');
    }
  };

  const getStatusBadge = (status: 'draft' | 'completed' | 'cancelled') => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      draft: 'Brouillon',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeTab === 'ingredients' ? article.type === 'ingredient' : article.type === 'product';
    
    // Vérifier que l'article a du stock dans au moins une zone
    const hasStock = stockItems.some(s => 
      s.articleId === article.id && 
      parseFloat(s.quantity) > 0
    );
    
    return matchesSearch && matchesType && hasStock;
  });

  const filteredOperations = operations.filter(op => op.type === 'ajustement');

  usePageTitle('Inventaire Physique');

  return (
  
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center m-6">
        {/* <h1 className='text-2xl font-semibold'>Inventaires Physiques</h1> */}
        <br />
          <Button onClick={createNewOperation}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Inventaire
          </Button>
        </div>

        {/* Operations List */}
  
            <div className=" bg-white overflow-x-auto rounded-lg m-6 shadow-sm border ">
              <Table className="w-full ">
                <TableHeader>
                  <TableRow  className="bg-gray-50 border-b ">
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Zone</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Articles</TableHead>
                    <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperations.map((op) => (
                    <TableRow key={op.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{op.code}</TableCell>
                      <TableCell>
                        {storageZones.find(z => z.id === op.storageZoneId)?.designation || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(op.status)}</TableCell>
                      <TableCell>
                        {new Date(op.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{op.items?.length || 0} articles</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {op.status === 'draft' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editOperation(op)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteOperation(op)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredOperations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun inventaire physique trouvé
                </div>
              )}
            </div>
         

        {/* Edit Dialog */}
        {isEditing && currentOperation && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {currentOperation.id > 0 ? 'Modifier' : 'Nouvel'} Inventaire Physique
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Header Info */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                    <Input
                      value={currentOperation.code || 'Auto-généré'}
                      disabled
                      className="text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Zone de Stockage</label>
                    <Select
                      value={currentOperation.storageZoneId?.toString() || ''}
                      onValueChange={(value) => setCurrentOperation((prev: any) => ({ ...prev, storageZoneId: parseInt(value) }))}
                      disabled={currentOperation.status !== 'draft'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une zone..." />
                      </SelectTrigger>
                      <SelectContent>
                        {storageZones.map(zone => (
                          <SelectItem key={zone.id} value={zone.id.toString()}>
                            {zone.designation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                    <Input
                      value={currentOperation.status === 'draft' ? 'Brouillon' : 'Terminé'}
                      disabled
                      className="text-gray-500"
                    />
                  </div>
                </div> */}

                                 {/* Article Selection */}
                 <div className="space-y-2">
                   <label className="block text-xs font-medium text-gray-700">Ajouter Articles</label>
                
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-80 m-auto grid-cols-2">
                      <TabsTrigger value="ingredients" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Ingrédients
                      </TabsTrigger>
                      <TabsTrigger value="products" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Produits
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="relative">
                    <button
                      onClick={() => setShowArticleSelect(!showArticleSelect)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white text-left flex items-center justify-between hover:bg-gray-50"
                      disabled={currentOperation?.status !== 'draft'}
                    >
                      <span>{selectedArticle ? selectedArticle.name : 'Sélectionner un article...'}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showArticleSelect && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        <div className="p-2">
                          <Input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher un article..."
                            className="w-full"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredArticles.map(article => (
                            <div
                              key={article.id}
                              onClick={() => {
                                setSelectedArticle(article);
                                addItem(article);
                              }}
                              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                            >
                                                             <div className="text-sm font-medium">{article.name}</div>
                               <div className="text-xs text-gray-500">
                                 {article.code} - {article.unit}
                               </div>
                               <div className="text-xs text-blue-600">
                                 Zones: {stockItems
                                   .filter(s => s.articleId === article.id)
                                   .map(s => storageZones.find(z => z.id === s.storageZoneId)?.designation)
                                   .filter(Boolean)
                                   .join(', ')}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={currentOperation?.notes || ''}
                    onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Notes sur cet inventaire..."
                    disabled={currentOperation?.status !== 'draft'}
                  />
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-lg border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className=" text-xs font-medium text-gray-700 ">
                          <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Zone</TableHead>
                          <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Article</TableHead>
                          <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Lot/Num Série</TableHead>
                          <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Qté en Stock</TableHead>
                          <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Qté Réelle</TableHead>
                          <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">U.M</TableHead>
                          <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                         <TableCell>
                               <div className="text-sm font-medium">
                                 {storageZones.find(z => z.id === item.storageZoneId)?.designation || '-'}
                               </div>
                             </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{item.article?.name}</div>
                                <div className="text-xs text-gray-500">{item.article?.code}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                {item.lotCode && <div>Lot: {item.lotCode}</div>}
                                {item.serialNumber && <div>Série: {item.serialNumber}</div>}
                                {!item.lotCode && !item.serialNumber && <span className="text-gray-400">-</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm font-medium">
                                {item.currentStock.toFixed(3)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                value={item.newQuantity}
                                onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                                step="0.001"
                                min="0"
                                className="w-24 text-center text-sm"
                                disabled={currentOperation?.status !== 'draft'}
                              />
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {item.unit}
                            </TableCell>
                            <TableCell className="text-center">
                              {currentOperation?.status === 'draft' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {items.length === 0 && (
                      <div className="text-center py-6 text-gray-500 text-sm">
                        Aucun article ajouté
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  
                  {currentOperation?.status === 'draft' && (
                    <>
                      <Button
                        onClick={saveOperation}
                        className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </Button>
                      
                      <Button
                        onClick={completeOperation}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Compléter
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
 
  );
};

export default InventoryPhysicalInterface;
