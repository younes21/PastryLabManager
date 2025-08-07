import React, { useState, useEffect } from 'react';
import { Plus, Search, Save, X, FileText, CreditCard, Eye, Trash2, Edit3, ChevronDown, ArrowLeft, Banknote } from 'lucide-react';
import { Layout } from '@/components/layout';

const ReceptionAchatInterface = () => {
  const [operations, setOperations] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState([]);
  const [showProductSelect, setShowProductSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Mock data avec plus de données
  const suppliers = [
    { id: 1, code: 'FRN-000001', companyName: 'TAB COOK SUPPLIES', type: 'societe', phone: '023-45-67-89' },
    { id: 2, code: 'FRN-000002', companyName: 'ECONOMAT DISTRIBUTION', type: 'societe', phone: '023-78-90-12' },
    { id: 3, code: 'FRN-000003', companyName: 'FRESH PRODUCTS SARL', type: 'societe', phone: '023-34-56-78' },
    { id: 4, code: 'FRN-000004', companyName: 'METRO CASH & CARRY', type: 'societe', phone: '023-89-01-23' }
  ];

  const storageZones = [
    { id: 1, designation: 'ECONOMAT', code: 'ZON-000001', capacity: '1000', unit: 'kg', temperature: '20' },
    { id: 2, designation: 'CHAMBRE FROIDE', code: 'ZON-000002', capacity: '500', unit: 'kg', temperature: '4' },
    { id: 3, designation: 'CONGELATEUR', code: 'ZON-000003', capacity: '300', unit: 'kg', temperature: '-18' },
    { id: 4, designation: 'CAVE LEGUMES', code: 'ZON-000004', capacity: '800', unit: 'kg', temperature: '12' }
  ];

  const articles = [
    { id: 1, code: 'ING-000001', name: 'NOIX', type: 'ingredient', unit: 'KG', currentStock: 5.0000, costPerUnit: 1400.00, managedInStock: true },
    { id: 2, code: 'ING-000002', name: 'FARINE T55', type: 'ingredient', unit: 'KG', currentStock: 25.0000, costPerUnit: 180.00, managedInStock: true },
    { id: 3, code: 'ING-000003', name: 'SUCRE BLANC', type: 'ingredient', unit: 'KG', currentStock: 15.0000, costPerUnit: 220.00, managedInStock: true },
    { id: 4, code: 'ING-000004', name: 'BEURRE DOUX', type: 'ingredient', unit: 'KG', currentStock: 8.5000, costPerUnit: 850.00, managedInStock: true },
    { id: 5, code: 'ING-000005', name: 'OEUFS FRAIS', type: 'ingredient', unit: 'UNITE', currentStock: 144.0000, costPerUnit: 25.00, managedInStock: true },
    { id: 6, code: 'ING-000006', name: 'LAIT ENTIER', type: 'ingredient', unit: 'LITRE', currentStock: 12.0000, costPerUnit: 95.00, managedInStock: true },
    { id: 7, code: 'ING-000007', name: 'CHOCOLAT NOIR', type: 'ingredient', unit: 'KG', currentStock: 3.2000, costPerUnit: 1200.00, managedInStock: true },
    { id: 8, code: 'ING-000008', name: 'VANILLE LIQUIDE', type: 'ingredient', unit: 'LITRE', currentStock: 0.5000, costPerUnit: 2800.00, managedInStock: true },
    { id: 9, code: 'ING-000009', name: 'SEL FIN', type: 'ingredient', unit: 'KG', currentStock: 10.0000, costPerUnit: 80.00, managedInStock: true },
    { id: 10, code: 'ING-000010', name: 'LEVURE CHIMIQUE', type: 'ingredient', unit: 'KG', currentStock: 2.0000, costPerUnit: 450.00, managedInStock: true }
  ];

  // Données de test pour les opérations existantes
  const mockOperations = [
    {
      id: 1,
      code: 'REC-000001',
      type: 'reception',
      status: 'completed',
      supplierId: 1,
      storageZoneId: 1,
      subtotalHT: 7000.00,
      totalTax: 1330.00,
      totalTTC: 8330.00,
      discount: 0,
      notes: 'Livraison matinale',
      createdAt: '2025-06-25T08:30:00',
      items: [
        { id: 1, articleId: 1, quantity: 5.000, unitCost: 1400.00, totalCost: 7000.00, taxRate: 19.00, taxAmount: 1330.00 }
      ]
    },
    {
      id: 2,
      code: 'REC-000002',
      type: 'reception',
      status: 'draft',
      supplierId: 2,
      storageZoneId: 1,
      subtotalHT: 4500.00,
      totalTax: 855.00,
      totalTTC: 5355.00,
      discount: 100,
      notes: 'Commande urgente',
      createdAt: '2025-06-28T14:15:00',
      items: [
        { id: 2, articleId: 2, quantity: 25.000, unitCost: 180.00, totalCost: 4500.00, taxRate: 19.00, taxAmount: 855.00 }
      ]
    }
  ];

  useEffect(() => {
    setOperations(mockOperations);
  }, []);

  const createNewOperation = () => {
    const newOp = {
      id: Date.now(),
      code: `REC-${String(operations.length + 1).padStart(6, '0')}`,
      type: 'reception',
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

  const editOperation = (op) => {
    setCurrentOperation(op);
    setItems(op.items || []);
    setIsEditing(true);
  };

  const deleteOperation = (opId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
      setOperations(operations.filter(op => op.id !== opId));
      if (currentOperation?.id === opId) {
        setCurrentOperation(null);
        setItems([]);
        setIsEditing(false);
      }
    }
  };

  const filteredArticles = articles.filter(article =>
    article?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (articleToAdd) => {
    if (articleToAdd) {
      const unitPrice = articleToAdd.costPerUnit;
      const quantity = 1;
      const totalPrice = quantity * unitPrice;
      const taxRate = 19.00;
      const taxAmount = totalPrice * (taxRate / 100);

      const newItem = {
        id: Date.now(),
        articleId: articleToAdd.id,
        article: articleToAdd,
        quantity: quantity,
        unitCost: unitPrice,
        totalCost: totalPrice,
        taxRate: taxRate,
        taxAmount: taxAmount,
        quantityBefore: articleToAdd.currentStock
      };

      setItems([...items, newItem]);
      setSelectedArticle(null);
      // setShowProductSelect(false);
      setSearchTerm('');
    }
  };

  const removeItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const totalCost = parseFloat(newQuantity || 0) * item.unitCost;
        const taxAmount = totalCost * (item.taxRate / 100);
        return {
          ...item,
          quantity: parseFloat(newQuantity || 0),
          totalCost: totalCost,
          taxAmount: taxAmount
        };
      }
      return item;
    }));
  };

  const updateItemPrice = (itemId, newPrice) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const totalCost = item.quantity * parseFloat(newPrice || 0);
        const taxAmount = totalCost * (item.taxRate / 100);
        return {
          ...item,
          unitCost: parseFloat(newPrice || 0),
          totalCost: totalCost,
          taxAmount: taxAmount
        };
      }
      return item;
    }));
  };

  // Calculate totals
  useEffect(() => {
    if (currentOperation) {
      const subtotalHT = items.reduce((sum, item) => sum + item.totalCost, 0);
      const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const totalTTC = subtotalHT + totalTax - (currentOperation.discount || 0);

      setCurrentOperation(prev => ({
        ...prev,
        subtotalHT,
        totalTax,
        totalTTC
      }));
    }
  }, [items, currentOperation?.discount]);

  const saveOperation = () => {
    if (!currentOperation) return;

    const updatedOperation = {
      ...currentOperation,
      items: items
    };

    if (operations.find(op => op.id === currentOperation.id)) {
      setOperations(operations.map(op => 
        op.id === currentOperation.id ? updatedOperation : op
      ));
    } else {
      setOperations([...operations, updatedOperation]);
    }

    alert('Opération sauvegardée avec succès!');
  };

  const completeOperation = () => {
    if (items.length === 0) {
      alert('Veuillez ajouter au moins un article avant de terminer.');
      return;
    }

    const updatedOperation = {
      ...currentOperation,
      status: 'completed',
      items: items
    };

    setOperations(operations.map(op => 
      op.id === currentOperation.id ? updatedOperation : op
    ));
    setCurrentOperation(updatedOperation);
    alert('Opération terminée avec succès!');
  };

  const cancelOperation = () => {
    if (currentOperation) {
      const updatedOperation = {
        ...currentOperation,
        status: 'cancelled'
      };
      setOperations(operations.map(op => 
        op.id === currentOperation.id ? updatedOperation : op
      ));
      setCurrentOperation(updatedOperation);
    }
  };

  const getStatusBadge = (status) => {
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
    return (
      <Layout title='Réceptions des achats founisseurs'>
      <div >
        {/* Header */}
        
          <div className=" mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <p className='text-gray-600 dark:text-gray-400 mt-2'>gerer les achat de vos ingrédients depuis vos fournisseur </p>
            <button
                onClick={createNewOperation}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Réception</span>
              </button>
              
            </div>
          </div>
       

        {/* Operations List */}
        <div className=" mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
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
                          {operation.totalTTC.toFixed(2)} DA
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(operation.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => editOperation(operation)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Modifier"
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
      </Layout>
    );
  }

  return (
    <Layout title='Réceptions des achats founisseurs > Ajouter des achats founisseurs'>
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
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, supplierId: parseInt(e.target.value) }))}
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
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, storageZoneId: parseInt(e.target.value) }))}
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
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
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
                onChange={(e) => setCurrentOperation(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                rows="2"
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
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                        step="1"
                        min="0"
                        className="w-20 px-1 py-0.5 text-center text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={currentOperation?.status !== 'draft'}
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                      {item.quantityBefore?.toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                      {item.article?.unit}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => updateItemPrice(item.id, e.target.value)}
                        step="1"
                        min="0"
                        className="w-30 px-1 py-0.5 text-center text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={currentOperation?.status !== 'draft'}
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs font-semibold">
                      {item.totalCost.toFixed(2)} DA
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
            <div className="px-28 py-4 font-bold">
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={saveOperation}
                  disabled={currentOperation?.status !== 'draft'}
                  className="px-3 py-3 text-sm border-blue-500  border-2 rounded hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <Save className="w-4 h-4 text-blue-700" />
                  <span>Sauvegarder</span>
                </button>
                
                <button
                  onClick={completeOperation}
                  disabled={currentOperation?.status !== 'draft' || items.length === 0}
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
    </div></Layout>
  );
};

export default ReceptionAchatInterface;