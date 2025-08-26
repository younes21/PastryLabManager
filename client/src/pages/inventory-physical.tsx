import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, X, FileText, Edit3, Trash2, ChevronDown, Search, Package, Warehouse, ArrowLeft, Eye, Ban } from 'lucide-react';
import { Layout } from '@/components/layout';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const InventoryPhysicalInterface = () => {
  const [operations, setOperations] = useState<any[]>([]);
  const [currentOperation, setCurrentOperation] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [showArticleSelect, setShowArticleSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('ingredients');

  // Data from API
  const [storageZones, setStorageZones] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);

  // Ref pour le select d'articles
  const articleSelectRef = useRef<HTMLDivElement>(null);

  // Effet pour fermer le select quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (articleSelectRef.current && !articleSelectRef.current.contains(event.target as Node)) {
        setShowArticleSelect(false);
      }
    };

    if (showArticleSelect) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showArticleSelect]);

  // Quand la zone change, recharger les items du stock de la zone sélectionnée
  useEffect(() => {
    if (isEditing && selectedZoneId) {
      setCurrentOperation((prev: any) => prev ? { ...prev, storageZoneId: selectedZoneId } : prev);
      // Charger uniquement les articles du stock de la zone sélectionnée
      const stockArticles = stockItems
        .filter(stockItem => stockItem.storageZoneId === selectedZoneId)
        .map(stockItem => {
          const article = articles.find(a => a.id === stockItem.articleId);
          return {
            id: Date.now() + Math.random() + stockItem.id,
            articleId: stockItem.articleId,
            article: article || { id: stockItem.articleId, name: 'Article inconnu', code: 'N/A', unit: 'N/A' },
            currentStock: parseFloat(stockItem.quantity) || 0,
            newQuantity: parseFloat(stockItem.quantity) || 0,
            unit: article?.unit || 'N/A',
            storageZoneId: stockItem.storageZoneId,
            lotId: stockItem.lotId || null,
            lotCode: stockItem.lot?.code || '',
            serialNumber: stockItem.serialNumber || '',
            notes: '',
          };
        });
      setItems(stockArticles);
    }
  }, [selectedZoneId]);

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

  // Dans createNewOperation, initialiser la zone sélectionnée et charger les items du stock de la zone
  const createNewOperation = () => {
    const defaultZoneId = storageZones[0]?.id || null;
    const newOp = {
      id: -Date.now(),
      code: undefined,
      status: 'draft',
      type: 'ajustement',
      storageZoneId: defaultZoneId,
      notes: '',
      createdAt: new Date().toISOString(),
      items: []
    };
    setCurrentOperation(newOp);
    setSelectedZoneId(defaultZoneId);
    // Charger uniquement les articles du stock de la zone sélectionnée
    const stockArticles = stockItems
      .filter(stockItem => stockItem.storageZoneId === defaultZoneId)
      .map(stockItem => {
        const article = articles.find(a => a.id === stockItem.articleId);
        return {
          id: Date.now() + Math.random() + stockItem.id,
          articleId: stockItem.articleId,
          article: article || { id: stockItem.articleId, name: 'Article inconnu', code: 'N/A', unit: 'N/A' },
          currentStock: parseFloat(stockItem.quantity) || 0,
          newQuantity: parseFloat(stockItem.quantity) || 0,
          unit: article?.unit || 'N/A',
          storageZoneId: stockItem.storageZoneId,
          lotId: stockItem.lotId || null,
          lotCode: stockItem.lot?.code || '',
          serialNumber: stockItem.serialNumber || '',
          notes: '',
        };
      });
    setItems(stockArticles);
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
        newQuantity: parseFloat(it.quantityAfter || '0'),
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

  const viewOperation = async (op: any) => {
    try {
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
        newQuantity: parseFloat(it.quantityAfter || '0'),
        unit: articles.find((a: any) => a.id === it.articleId)?.unit || '',
        storageZoneId: it.toStorageZoneId || null,
        lotId: it.lotId || null,
        lotCode: it.lotCode || '',
        serialNumber: it.serialNumber || '',
        notes: it.notes || '',
      })));

      setIsViewing(true);
    } catch (e) {
      console.error('Failed to load operation', e);
      alert('Erreur lors du chargement de l\'opération');
    }
  };

  const cancelOperation = async (op: any) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet inventaire ? Cette action est irréversible.')) return;
    
    try {
      await apiRequest(`/api/inventory-operations/${op.id}`, 'PATCH', { status: 'cancelled' });
      setOperations(operations.map(operation => operation.id === op.id ? { ...operation, status: 'cancelled' } : operation));
      alert('Inventaire annulé avec succès');
    } catch (e) {
      console.error('Failed to cancel operation', e);
      alert('Erreur lors de l\'annulation');
    }
  };

  const addItem = (article: any) => {
    if (!selectedZoneId) return;
    const existingItem = items.find(item => item.articleId === article.id && item.storageZoneId === selectedZoneId);
    if (!existingItem) {
      const newItem = {
        id: Date.now() + Math.random(),
        articleId: article.id,
        article: article,
        currentStock: 0,
        newQuantity: 0,
        unit: article.unit,
        storageZoneId: selectedZoneId,
        lotId: null,
        lotCode: '',
        serialNumber: '',
        notes: '',
      };
      setItems(prev => [...prev, newItem]);
    }
    setSelectedArticle(null);
  //  setShowArticleSelect(false);
  };

  const setItemQuantityToZero = (itemId: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          newQuantity: 0
        };
      }
      return item;
    }));
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

  const updateItemZone = (itemId: number, newZoneId: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          storageZoneId: newZoneId
        };
      }
      return item;
    }));
  };

  const saveOperation = async () => {
    if (!currentOperation) return;

    // Validation stricte
    if (!currentOperation.notes || currentOperation.notes.trim() === '') {
      alert('Le motif d\'inventaire est obligatoire.');
      return;
    }

    if (items.length === 0) {
      alert('Ajoutez au moins un article à l\'inventaire.');
      return;
    }

    try {
      const operationData = {
        type: 'ajustement',
        status: currentOperation.status || 'draft',
        storageZoneId: currentOperation.storageZoneId,
        notes: currentOperation.notes.trim(),
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
    
    if (!currentOperation.notes || currentOperation.notes.trim() === '') {
      alert('Le motif d\'inventaire est obligatoire.');
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

  // Filtrer les articles selon la zone sélectionnée
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeTab === 'ingredients' ? article.type === 'ingredient' : article.type === 'product';
    // Vérifier si l'article n'est pas déjà dans les items de la zone
    const alreadyInItems = items.some(item => item.articleId === article.id);
    // Vérifier si l'article n'est pas en stock dans la zone sélectionnée
    const articleStockItems = stockItems.filter(s => s.articleId === article.id && s.storageZoneId === selectedZoneId);
    const notInStock = articleStockItems.length === 0;
  
    return matchesSearch && matchesType && !alreadyInItems && notInStock;
  });

  const filteredOperations = operations.filter(op => op.type === 'ajustement');

  if (!isEditing && !isViewing) {
    usePageTitle('Inventaire Physique');
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center m-6">
          <div>
            <h1 className="text-2xl font-semibold">Inventaires Physiques</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gérez les inventaires physiques de vos stocks
            </p>
          </div>
          <Button onClick={createNewOperation}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Inventaire
          </Button>
        </div>

        {/* Operations List */}
        <div className="bg-white overflow-x-auto rounded-lg m-6 shadow-sm border">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
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
                      {/* Bouton Consulter - toujours visible */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewOperation(op)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Bouton Annuler - seulement pour les inventaires terminés */}
                      {op.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelOperation(op)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {/* Boutons Modifier/Supprimer - seulement pour les brouillons */}
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
      </div>
    );
  }

  usePageTitle('Inventaire Physique > ' + (isViewing ? 'Consultation' : 'Édition'));
  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setIsViewing(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-orange-500 rounded-lg shadow-sm hover:bg-orange-50 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {currentOperation?.code || 'Nouveau'}
              </span>
              {isViewing && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Mode Consultation
                </span>
              )}
              {isEditing && currentOperation?.id && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                  Mode Modification
                </span>
              )}
              {currentOperation?.status && getStatusBadge(currentOperation.status)}
                {/* Select de zone de stockage */}
                <div >
                    
                    <Select
                    value={selectedZoneId?.toString() || ''}
                    onValueChange={value => setSelectedZoneId(parseInt(value))}
                    disabled={currentOperation?.status !== 'draft' || isViewing}
                    >
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Sélectionner une zone de stockage" />
                    </SelectTrigger>
                    <SelectContent>
                        {storageZones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>{zone.designation}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4">
      

        {/* Article Selection - seulement en mode édition */}
        {!isViewing && (
          <div className="bg-white rounded-lg shadow-sm border mb-4">
            <div className="p-4">
           
            {/* Motif d'inventaire obligatoire */}
                <div >
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Motif d'inventaire *
                </label>
                <textarea
                    value={currentOperation?.notes || ''}
                    onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Motif obligatoire de cet inventaire..."
                    disabled={currentOperation?.status !== 'draft' || isViewing}
                    required
                />
               
                </div>
        
                <div className='flex items-center gap-4 mt-4'>
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

                    <div className="relative flex-1 " ref={articleSelectRef}>
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
                                                <div className="max-h-80 overflow-y-auto">
                            {filteredArticles.map(article => {
                                // Déterminer la zone à afficher
                                const articleZone = storageZones.find(z => z.id === article.storageZoneId);
                                const displayZone = articleZone?.designation || 'Zone par défaut';
                                
                                return (
                                <div
                                    key={article.id}
                                    onClick={() => {
                                    setSelectedArticle(article);
                                    addItem(article);
                                    }}
                                    className=" flex justify-between gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                                >
                                    <div>
                                    <div className="text-sm font-medium">{article.name}</div>
                                    <div className="text-xs text-gray-500">
                                    {article.code} - {article.unit}
                                    </div>
                                    </div>
                                    <div className="text-xs text-orange-600">
                                    
                                    Zone: {displayZone}
                                    </div>
                                </div>
                                );
                            })}
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className='bg-gray-50' >
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Article</TableHead>
                  <TableHead className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Lot/Num Série</TableHead>
                  <TableHead className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté en Stock</TableHead>
                  <TableHead className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté Réelle</TableHead>
                  <TableHead className="px-4 py-3 text-center text-sm font-semibold text-gray-700">U.M</TableHead>
                  {!isViewing && (
                    <TableHead className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
                             <TableBody>
                 {items
                   .sort((a, b) => {
                     // Articles avec quantité > 0 en premier, puis ceux avec quantité = 0
                     if (a.newQuantity > 0 && b.newQuantity === 0) return -1;
                     if (a.newQuantity === 0 && b.newQuantity > 0) return 1;
                     return 0;
                   })
                   .map((item, index) => {
                   const zone = storageZones.find(z => z.id === item.storageZoneId);
                   const articleZone = item.article ? storageZones.find(z => z.id === item.article.storageZoneId) : null;
                   const displayZone = zone || articleZone;
                  
                  return (
                        <TableRow key={item.id} >
                       <TableCell className="p-2">
                         <div>
                          <div className="font-medium text-sm">{item.article?.name}</div>
                          <div className="text-xs text-gray-500">{item.article?.code}</div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="text-xs">
                          {item.lotCode && <div>Lot: {item.lotCode}</div>}
                          {item.serialNumber && <div>Série: {item.serialNumber}</div>}
                          {!item.lotCode && !item.serialNumber && <span className="text-gray-400">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <span className="text-sm font-medium">
                          {item.currentStock.toFixed(3)}
                        </span>
                      </TableCell>
                       <TableCell className="text-center p-2">
                         {isViewing ? (
                           <span className={`text-sm font-medium ${item.newQuantity === 0 ? 'text-red-600' : ''}`}>
                             {item.newQuantity.toFixed(3)}
                           </span>
                         ) : (
                            <div className='flex justify-center'>
                           <Input
                             type="number"
                             value={item.newQuantity}
                             onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                             
                             min="0"
                             className={`w-24 text-center text-sm ${item.newQuantity === 0 ? 'border-red-300 bg-red-50' : ''}`}
                             disabled={currentOperation?.status !== 'draft'}
                           />
                           </div>
                         )}
                       </TableCell>
                      <TableCell className="text-center text-sm p-2">
                        {item.unit}
                      </TableCell>
                      {!isViewing && (
                        <TableCell className="text-center p-2">
                                                     {currentOperation?.status === 'draft' && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setItemQuantityToZero(item.id)}
                               className="text-orange-600 hover:text-orange-700"
                               title="Mettre la quantité à zéro"
                             >
                               <X className="w-4 h-4" />
                             </Button>
                           )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
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
            onClick={() => {
              setIsEditing(false);
              setIsViewing(false);
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
          
          {/* Actions d'édition - seulement en mode édition et pour les brouillons */}
          {isEditing && currentOperation?.status === 'draft' && (
            <>
              <Button
                onClick={saveOperation}
                disabled={
                  !currentOperation?.notes ||
                  currentOperation.notes.trim() === '' ||
                  items.length === 0
                }
                className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
              
              <Button
                onClick={completeOperation}
                disabled={
                  !currentOperation?.id ||
                  !currentOperation?.notes ||
                  currentOperation.notes.trim() === '' ||
                  items.length === 0 ||
                  currentOperation.id<0
                }
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Valider
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryPhysicalInterface;
