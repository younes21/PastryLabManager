import React, { useState, useEffect } from 'react';
import { Plus, Save, X, FileText, CreditCard, Trash2, Edit3, ChevronDown, ArrowLeft, Banknote } from 'lucide-react';
import { Layout } from '@/components/layout';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';

const ReceptionAchatInterface = () => {
  const [operations, setOperations] = useState<any[]>([]);
  const [currentOperation, setCurrentOperation] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [showProductSelect, setShowProductSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Data from API
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [storageZones, setStorageZones] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  // Load initial data from API
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [supRes, zoneRes, artRes, poRes] = await Promise.all([
          apiRequest('/api/suppliers', 'GET'),
          apiRequest('/api/storage-zones', 'GET'),
          apiRequest('/api/articles', 'GET'),
          apiRequest('/api/purchase-orders', 'GET'),
        ]);

        const suppliersData = await supRes.json();
        const zonesData = await zoneRes.json();
        const articlesData = await artRes.json();
        const posData = await poRes.json();

        setSuppliers(suppliersData || []);
        setStorageZones(zonesData || []);
        // Filter to ingredients for purchase context
        // Normaliser types numériques pour éviter 0
        const norm = (v: any) => (v === null || v === undefined ? '0' : v.toString());
        const ing = (articlesData || [])
          .filter((a: any) => a.type === 'ingredient')
          .map((a: any) => ({
            ...a,
            costPerUnit: norm(a.costPerUnit),
            currentStock: norm(a.currentStock),
          }));
        setArticles(ing);
        setOperations(posData || []);
      } catch (e) {
        console.error('Failed to load initial data', e);
      }
    };

    void loadAll();
  }, []);

  const createNewOperation = () => {
    const newOp = {
      id:-Date.now(),
      code: undefined,
      status: 'draft',
      supplierId: '',
      storageZoneId: '',
      subtotalHT: 0,
      totalTax: 0,
      totalTTC: 0,
      discount: 0,
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
      // Vérifier si la réception peut être modifiée
      if (op.status === 'completed') {
        alert('Impossible de modifier une réception déjà complétée.');
        return;
      }

      // Fetch full order with items
      const res = await apiRequest(`/api/purchase-orders/${op.id}`, 'GET');
      const data = await res.json();

      setCurrentOperation({
        id: data.id,
        code: data.code,
        supplierId: data.supplierId,
        status: data.status,
        discount: parseFloat(data.discount || '0'),
        subtotalHT: parseFloat(data.subtotalHT || '0'),
        totalTax: parseFloat(data.totalTax || '0'),
        totalTTC: parseFloat(data.totalTTC || '0'),
        notes: data.notes || '',
        createdAt: data.createdAt,
        storageZoneId: data.storageZoneId || '',
      });

      const mappedItems = (data.items || []).map((it: any) => ({
        id: it.id,
        articleId: it.articleId,
        article: articles.find((a: any) => a.id === it.articleId) || { id: it.articleId },
        currentStock: parseFloat(it.quantityBefore || '0'),
        quantityOrdered: parseFloat(it.quantity || '0'),
        unitPrice: parseFloat(it.unitCost || '0'),
        totalPrice: parseFloat(it.totalCost || '0'),
        taxRate: parseFloat(it.taxRate || '0'),
        taxAmount: parseFloat(it.taxAmount || '0'),
        storageZoneId: it.toStorageZoneId || null,
        notes: it.notes || '',
      }));
      setItems(mappedItems);
      setIsEditing(true);
    } catch (e) {
      console.error('Failed to load purchase order details', e);
    }
  };

  const deleteOperation = async (opId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
      try {
        await apiRequest(`/api/purchase-orders/${opId}`, 'DELETE');
        
        // Mettre à jour l'état local
        setOperations(operations.filter(op => op.id !== opId));
        if (currentOperation?.id === opId) {
          setCurrentOperation(null);
          setItems([]);
          setIsEditing(false);
        }
        
        alert('Réception supprimée avec succès');
      } catch (e) {
        console.error('Failed to delete purchase order', e);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const filteredArticles = articles.filter(article =>
    (article?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (article?.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (articleToAdd: any) => {
    if (articleToAdd) {
      const unitPrice = parseFloat((articleToAdd.costPerUnit ?? articleToAdd.salePrice ?? 0).toString());
      const quantityOrdered = 1;
      const totalPrice = quantityOrdered * unitPrice;
      const taxRate = Number.isFinite(articleToAdd.defaultTaxRate) ? parseFloat(articleToAdd.defaultTaxRate) : 19.0;
      const taxAmount = totalPrice * (taxRate / 100);

      const newItem = {
        id: -Date.now(),
        articleId: articleToAdd.id,
        article: articleToAdd,
        quantityOrdered,
        unitPrice,
        totalPrice,
        taxRate: taxRate,
        taxAmount: taxAmount,
        currentStock: parseFloat((articleToAdd.currentStock ?? 0).toString()),
        toStorageZoneId: currentOperation?.storageZoneId || (storageZones.length > 0 ? storageZones[0].id : null),
      };

      setItems([...items, newItem]);
      setSelectedArticle(null);
      // setShowProductSelect(false);
      setSearchTerm('');
    }
  };

  const removeItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: number, newQuantity: any) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const quantityOrdered = parseFloat(newQuantity || 0);
        const totalPrice = quantityOrdered * item.unitPrice;
        const taxAmount = totalPrice * (item.taxRate / 100);
        return {
          ...item,
          quantityOrdered,
          totalPrice,
          taxAmount: taxAmount
        };
      }
      return item;
    }));
  };

  const updateItemPrice = (itemId: number, newPrice: any) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const unitPrice = parseFloat(newPrice || 0);
        const totalPrice = item.quantityOrdered * unitPrice;
        const taxAmount = totalPrice * (item.taxRate / 100);
        return {
          ...item,
          unitPrice,
          totalPrice,
          taxAmount: taxAmount
        };
      }
      return item;
    }));
  };

  // Calculate totals
  useEffect(() => {
    if (currentOperation) {
      const subtotalHT = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const totalTTC = subtotalHT + totalTax - (currentOperation.discount || 0);

      setCurrentOperation((prev: any) => ({
        ...prev,
        subtotalHT,
        totalTax,
        totalTTC
      }));
    }
  }, [items, currentOperation?.discount]);

  const saveOperation = async () => {
    if (!currentOperation) return;

    try {
      // Vérifier si la réception peut être modifiée
      if (currentOperation.id && currentOperation.status === 'completed') {
        alert('Impossible de modifier une réception déjà complétée.');
        return;
      }

      // Validation stricte: fournisseur, zone et articles requis, lignes valides
      if (!currentOperation.supplierId || !currentOperation.storageZoneId || items.length === 0) {
        alert('Sélectionnez un fournisseur, une zone de stockage et au moins un article.');
        return;
      }
      const invalidLine = items.some((it) => (Number(it.quantityOrdered) || 0) <= 0 || (Number(it.unitPrice) || 0) <= 0);
      if (invalidLine) {
        alert('Chaque ligne doit avoir une quantité et un prix unitaire > 0.');
        return;
      }

      // Build payload according to schema
      const receptionHeader = {
        supplierId: currentOperation.supplierId,
        status: currentOperation.status || 'draft',
        subtotalHT: (currentOperation.subtotalHT || 0).toFixed(2),
        totalTax: (currentOperation.totalTax || 0).toFixed(2),
        totalTTC: (currentOperation.totalTTC || 0).toFixed(2),
        discount: (currentOperation.discount || 0).toFixed(2),
        notes: currentOperation.notes || '',
        storageZoneId: currentOperation.storageZoneId || null,
      };

      const itemsPayload = items.map((it) => ({
        articleId: it.articleId,
        storageZoneId: it.storageZoneId || currentOperation.storageZoneId || null,
        currentStock: (it.currentStock ?? 0).toString(),
        quantityOrdered: (it.quantityOrdered ?? 0).toString(),
        unitPrice: (it.unitPrice ?? 0).toString(),
        totalPrice: (it.totalPrice ?? 0).toString(),
        taxRate: (it.taxRate ?? 0).toString(),
        taxAmount: (it.taxAmount ?? 0).toString(),
        notes: it.notes || undefined,
      }));

      const payload = {
        purchaseOrder: receptionHeader,
        items: itemsPayload,
      };

      let res;
      let data;

      // Détecter si c'est une modification (ID existe) ou création
      if (currentOperation.id> 0 && typeof currentOperation.id === 'number') {
        // Modification - utiliser PUT
        console.log('Modification de la réception:', currentOperation.id);
        res = await apiRequest(`/api/purchase-orders/${currentOperation.id}`, 'PUT', payload);
        data = await res.json();
        
        // Mettre à jour la liste des opérations
        setOperations((prev) => 
          prev.map(op => op.id === currentOperation.id ? data : op)
        );
        alert('Réception modifiée avec succès');
      } else {
        // Création - utiliser POST
        console.log('Création d\'une nouvelle réception');
        res = await apiRequest('/api/purchase-orders', 'POST', payload);
        data = await res.json();
        
        // Ajouter à la liste des opérations
        setOperations((prev) => [data, ...prev]);
        alert('Réception créée avec succès');
      }

      // Update current operation from server response
      setCurrentOperation({
        id: data.id,
        code: data.code,
        supplierId: data.supplierId,
        status: data.status,
        discount: parseFloat(data.discount || '0'),
        subtotalHT: parseFloat(data.subtotalHT || '0'),
        totalTax: parseFloat(data.totalTax || '0'),
        totalTTC: parseFloat(data.totalTTC || '0'),
        notes: data.notes || '',
        createdAt: data.createdAt,
        storageZoneId: data.storageZoneId || '',
      });

      // Map depuis inventory_operation_items pour éviter les 0
      setItems((data.items || []).map((it: any) => ({
        id: it.id,
        articleId: it.articleId,
        article: articles.find((a: any) => a.id === it.articleId) || { id: it.articleId },
        currentStock: parseFloat(it.quantityBefore || '0'),
        quantityOrdered: parseFloat(it.quantity || '0'),
        unitPrice: parseFloat(it.unitCost || '0'),
        totalPrice: parseFloat(it.totalCost || '0'),
        taxRate: parseFloat(it.taxRate || '0'),
        taxAmount: parseFloat(it.taxAmount || '0'),
        storageZoneId: it.toStorageZoneId || null,
        notes: it.notes || '',
      })));

      // rafraîchir articles pour refléter stock/coût si backend a modifié (au PATCH)
      try {
        const artRes = await apiRequest('/api/articles', 'GET');
        const articlesData = await artRes.json();
        setArticles((articlesData || []).filter((a: any) => a.type === 'ingredient'));
      } catch {}
    } catch (e) {
      console.error('Failed to save purchase order', e);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const completeOperation = async () => {
    if (!currentOperation?.id) {
      alert('Veuillez sauvegarder avant de confirmer.');
      return;
    }
    // Empêcher confirmation si requis non sélectionnés
    if (!currentOperation.supplierId || !items.length) {
      alert('Sélectionnez un fournisseur et au moins un article pour confirmer.');
      return;
    }
    try {
      await apiRequest(`/api/purchase-orders/${currentOperation.id}`, 'PATCH', { status: 'completed' });
      setOperations(operations.map(op => op.id === currentOperation.id ? { ...op, status: 'completed' } : op));
      setCurrentOperation({ ...currentOperation, status: 'completed' });
      // recharger articles pour afficher le nouveau stock/coût
      try {
        const artRes = await apiRequest('/api/articles', 'GET');
        const articlesData = await artRes.json();
        setArticles((articlesData || []).filter((a: any) => a.type === 'ingredient'));
      } catch {}
      alert('Réception complétée');
    } catch (e) {
      console.error('Failed to confirm', e);
      alert('Erreur lors de la confirmation');
    }
  };

  const cancelOperation = async () => {
    if (!currentOperation?.id) return;
    try {
      await apiRequest(`/api/purchase-orders/${currentOperation.id}`, 'PATCH', { status: 'cancelled' });
      setOperations(operations.map(op => op.id === currentOperation.id ? { ...op, status: 'cancelled' } : op));
      setCurrentOperation({ ...currentOperation, status: 'cancelled' });
    } catch (e) {
      console.error('Failed to cancel', e);
      alert('Erreur lors de l\'annulation');
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
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };
 
  if (!isEditing) {
    usePageTitle('Réceptions des achats founisseurs'); 
    return (
     
      <div >
        {/* Header */}
        
          <div className=" mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <p className='text-gray-600 dark:text-gray-400 mt-2'>gerer les achat de vos ingrédients depuis vos fournisseur </p>
                          <Button 
                onClick={createNewOperation}
                className="bg-accent hover:bg-accent-hover"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Réception</span>
              </Button>
              
            </div>
          </div>
       

        {/* Operations List */}
        <div className=" mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fournisseur</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Zone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total TTC</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((operation, index) => {
                    const supplier = suppliers.find(s => s.id === operation.supplierId);
                     const zone = storageZones.find(z => z.id === operation.storageZoneId);
                    
                    return (
                      <tr key={operation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">
                          {operation.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {supplier?.companyName || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {zone?.designation || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(operation.status)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">
                           {parseFloat(operation.totalTTC || operation.totalTtc || '0').toFixed(2)} DA
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                           {new Date(operation.createdAt || operation.orderDate || Date.now()).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => editOperation(operation)}
                              disabled={operation.status === 'completed'}
                              className="text-blue-600 hover:text-blue-800 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={operation.status === 'completed' ? 'Impossible de modifier une réception complétée' : 'Modifier'}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteOperation(operation.id)}
                              disabled={operation.status === 'completed'}
                              className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {operations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune réception créée.</p>
                  <button
                    onClick={createNewOperation}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Créer votre première réception
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
    );
  }
  usePageTitle('Réceptions des achats founisseurs > Ajouter des achats founisseurs'); 
  return (
 
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className=" mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsEditing(false)}
                 className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-orange-500 rounded-lg shadow-sm hover:bg-orange-50 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {currentOperation?.code || 'Nouveau'}
              </span>
              {currentOperation?.id && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                  Mode Modification
                </span>
              )}
              {currentOperation?.status && getStatusBadge(currentOperation.status)}
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      <div className=" mx-auto px-4 py-4">
        {/* Configuration compacte */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fournisseur *</label>
                <select
                  value={currentOperation?.supplierId || ''}
                     onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, supplierId: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  disabled={currentOperation?.status !== 'draft'}
                >
                  <option value="">Sélectionner...</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Zone de stockage *</label>
                <select
                  value={currentOperation?.storageZoneId || ''}
                  onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, storageZoneId: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  disabled={currentOperation?.status !== 'draft'}
                >
                  <option value="">Sélectionner...</option>
                     {storageZones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remise (DA)</label>
                <input
                  type="number"
                  value={currentOperation?.discount || 0}
                  onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  step="1"
                  disabled={currentOperation?.status !== 'draft'}
                />
              </div>

              <div className="relative col-span-2 md:col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Ajouter Produit</label>
                <button
                  onClick={() => setShowProductSelect(!showProductSelect)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-left flex items-center justify-between hover:bg-gray-50"
                  disabled={currentOperation?.status !== 'draft'}
                >
                  <span>{selectedArticle ? selectedArticle.name : 'Sélectionner...'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showProductSelect && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="p-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
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
                            {article?.code} - Stock: {article.currentStock} {article.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={currentOperation?.notes || ''}
                onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, notes: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="Notes sur cette réception..."
                disabled={currentOperation?.status !== 'draft'}
              />
            </div>
          </div>
        </div>

        {/* Table compacte */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                  <th className="px-3 py-2 text-left text-xs font-semibold">CODE</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">ARTICLES</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">QTÉ ACHAT</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">QTÉ STOCK</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">U.M</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">PRIX (DA)</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">MNT HT</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Zone de stockage</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Lot</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-3 py-2 text-xs font-medium text-gray-800">
                      {item.article?.code}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-800">
                      {item.article?.name}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={item.quantityOrdered}
                        onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                        step="1"
                        min="0"
                        className="w-20 px-1 py-0.5 text-center text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={currentOperation?.status !== 'draft'}
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                       {Number.isFinite(item.currentStock) ? Number(item.currentStock).toFixed(3) : '0.000'}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                       {item.article?.unit}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                         value={item.unitPrice}
                        onChange={(e) => updateItemPrice(item.id, e.target.value)}
                        step="1"
                        min="0"
                        className="w-30 px-1 py-0.5 text-center text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={currentOperation?.status !== 'draft'}
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs font-semibold">
                       {item.totalPrice.toFixed(2)} DA
                    </td>
                   
                    <td className="px-3 py-2 text-center">
                      <select
                        value={item.storageZoneId || currentOperation?.storageZoneId || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          const itemIndex = newItems.findIndex(i => i.id === item.id);
                          if (itemIndex > -1) {
                            newItems[itemIndex] = { ...newItems[itemIndex], storageZoneId: parseInt(e.target.value) };
                            setItems(newItems);
                          }
                        }}
                        className="w-32 px-1 py-0.5 text-center text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={currentOperation?.status !== 'draft'}
                      >
                        <option value="">Sélectionner...</option>
                        {storageZones.map(zone => (
                          <option key={zone.id} value={zone.id}>
                            {zone.designation}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => alert('Ajouter lot pour ' + item.article?.name)} // Placeholder action
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Ajouter lot"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </td>
                     <td className="px-3 py-2 text-center">
                      {currentOperation?.status === 'draft' && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {items.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">
                Aucun article ajouté
              </div>
            )}
          </div>
        </div>

        {/* Totaux et Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Totaux */}
          <div className="bg-white rounded-lg shadow-sm border md:col-span-2">
            <div className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>TOTAL HT</span>
                  <span className="font-semibold">{currentOperation?.subtotalHT.toFixed(2)} DA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TOTAL TVA</span>
                  <span>{currentOperation?.totalTax.toFixed(2)} DA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TOTAL REMISE</span>
                  <span>{currentOperation?.discount.toFixed(2)} DA</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>TOTAL TTC</span>
                  <span className="text-green-600">{currentOperation?.totalTTC.toFixed(2)} DA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className=" rounded-lg  md:col-span-1">
            <div className="px-6  py-4 font-bold">
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={saveOperation}
                  disabled={
                    currentOperation?.status !== 'draft' ||
                    !currentOperation?.supplierId ||
                    !currentOperation?.storageZoneId ||
                    items.length === 0 ||
                    items.some((it) => (Number(it.quantityOrdered) || 0) <= 0 || (Number(it.unitPrice) || 0) <= 0)
                  }
                  className="px-3 py-3 text-sm border-blue-500  border-2 rounded hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <Save className="w-4 h-4 text-blue-700" />
                  <span>Sauvegarder</span>
                </button>
                
                <button
                  onClick={completeOperation}
                  disabled={currentOperation?.status !== 'draft' || !currentOperation?.id}
                  className="px-3 py-3 text-sm border-green-500  border-2 rounded hover:bg-green-50 disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <FileText className="w-4 h-4 text-green-700" />
                  <span>Confirmer</span>
                </button>
                
                <button
                  onClick={cancelOperation}
                  disabled={currentOperation?.status !== 'draft'}
                  className="px-3 py-3 text-sm border-red-500  border-2 rounded hover:bg-red-50 disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <X className="w-4 h-4 text-red-700" />
                  <span>Annuler</span>
                </button>
                
                <button
                  className="px-3 py-3 text-sm border-purple-500  border-2 rounded hover:bg-purple-50 flex items-center justify-center space-x-1"
                >
                  <CreditCard className="w-4 h-4  text-purple-700" />
                  <span>Facture</span>
                </button>
                
                <button
                  className="px-3 py-3 text-sm border-orange-500  border-2 rounded hover:bg-orange-50 flex items-center justify-center space-x-1"
                >
                  <Banknote  className="w-4 h-4 text-orange-700" />
                  <span>Règlements</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionAchatInterface;