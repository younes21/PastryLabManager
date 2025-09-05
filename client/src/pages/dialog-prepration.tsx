import React, { useState, useEffect } from 'react';
import { X, Search, ShoppingCart, Package, List, BarChart3 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ProductSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productData: any) => void;
}

interface OrderedProduct {
  orderId: number;
  orderCode: string;
  orderItemId: number;
  articleId: number;
  articleName: string;
  articleCode: string;
  quantityOrdered: number;
  quantityPrepared: number;
  quantityRemaining: number;
  clientName: string;
  orderDate: string;
  article: any;
}

interface ProductSummary {
  articleId: number;
  articleName: string;
  articleCode: string;
  totalQuantityRemaining: number;
  orders: OrderedProduct[];
}

const ProductSelectionDialog: React.FC<ProductSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const [orderedProducts, setOrderedProducts] = useState<OrderedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<OrderedProduct[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<ProductSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});
  const [activeTab, setActiveTab] = useState<'detail' | 'summary'>('summary');
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductSummary | null>(null);

  // Load confirmed orders with products to prepare
  useEffect(() => {
    if (isOpen) {
      loadOrderedProducts();
    }
  }, [isOpen]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = orderedProducts.filter(product =>
        product.articleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.orderCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);

      const filteredSummaries = productSummaries.filter(summary =>
        summary.articleName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSummaries(filteredSummaries);
    } else {
      setFilteredProducts(orderedProducts);
      setFilteredSummaries(productSummaries);
    }
  }, [searchTerm, orderedProducts, productSummaries]);

  const loadOrderedProducts = async () => {
    setLoading(true);
    try {
      // Get confirmed orders with items that need preparation
      const res = await apiRequest('/api/orders/confirmed-with-products-to-prepare', 'GET');
      const data = await res.json();

      const products: OrderedProduct[] = [];
      
      for (const order of data) {
        for (const item of order.items || []) {
          const quantityRemaining = (parseFloat(item.quantity) || 0) - (parseFloat(item.quantityPrepared) || 0);
          
          if (quantityRemaining > 0) {
            products.push({
              orderId: order.id,
              orderCode: order.code,
              orderItemId: item.id,
              articleId: item.articleId,
              articleName: item.article?.name || 'Produit inconnu',
              articleCode: item.article?.code || '',
              quantityOrdered: parseFloat(item.quantity) || 0,
              quantityPrepared: parseFloat(item.quantityPrepared) || 0,
              quantityRemaining: quantityRemaining,
              clientName: order.client?.companyName || order.client?.firstName + ' ' + order.client?.lastName || 'Client inconnu',
              orderDate: order.orderDate,
              article: item.article
            });
          }
        }
      }

      setOrderedProducts(products);
      setFilteredProducts(products);

      // Create product summaries grouped by article
      const summariesMap = new Map<number, ProductSummary>();
      
      for (const product of products) {
        if (!summariesMap.has(product.articleId)) {
          summariesMap.set(product.articleId, {
            articleId: product.articleId,
            articleName: product.articleName,
            articleCode: product.articleCode,
            totalQuantityRemaining: 0,
            orders: []
          });
        }
        
        const summary = summariesMap.get(product.articleId)!;
        summary.totalQuantityRemaining += product.quantityRemaining;
        summary.orders.push(product);
      }

      const summaries = Array.from(summariesMap.values());
      setProductSummaries(summaries);
      setFilteredSummaries(summaries);
    } catch (error) {
      console.error('Failed to load ordered products:', error);
      alert('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productKey: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productKey]: quantity
    }));
  };

  const handleSelectProduct = (product: OrderedProduct) => {
    const productKey = `${product.orderId}-${product.orderItemId}`;
    const quantityToProduce = selectedProducts[productKey] || 1;

    if (quantityToProduce <= 0 || quantityToProduce > product.quantityRemaining) {
      alert(`La quantité doit être comprise entre 1 et ${product.quantityRemaining}`);
      return;
    }

    onSelect({
      orderId: product.orderId,
      orderCode: product.orderCode,
      orderItemId: product.orderItemId,
      articleId: product.articleId,
      article: product.article,
      quantityToProduce: quantityToProduce,
      quantityRemaining: product.quantityRemaining
    });
  };

  const handleSelectFromSummary = (summary: ProductSummary) => {
    const quantityToProduce = selectedProducts[`summary-${summary.articleId}`] || 1;

    if (quantityToProduce <= 0 || quantityToProduce > summary.totalQuantityRemaining) {
      alert(`La quantité doit être comprise entre 1 et ${summary.totalQuantityRemaining}`);
      return;
    }

    // Select the first available order item for this product
    const firstOrder = summary.orders[0];
    onSelect({
      orderId: firstOrder.orderId,
      orderCode: firstOrder.orderCode,
      orderItemId: firstOrder.orderItemId,
      articleId: firstOrder.articleId,
      article: firstOrder.article,
      quantityToProduce: quantityToProduce,
      quantityRemaining: summary.totalQuantityRemaining
    });
  };

  const getProductKey = (product: OrderedProduct) => `${product.orderId}-${product.orderItemId}`;

  const showProductDetail = (summary: ProductSummary) => {
    setSelectedProductDetail(summary);
    setActiveTab('detail');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b  ">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Produits Commandés à Préparer</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'summary'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Résumé par Produit</span>
          </button>
          <button
            onClick={() => setActiveTab('detail')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'detail'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Détail des Commandes</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un produit ou une commande..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Chargement...</span>
            </div>
          ) : (
            <>
              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <>
                  {filteredSummaries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">Aucun produit à préparer</p>
                      <p className="text-sm">
                        {searchTerm 
                          ? "Aucun produit ne correspond à votre recherche" 
                          : "Toutes les commandes confirmées ont été préparées"}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100 border-b">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nom du Produit</th>
                             <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté en stock</th>
                            {/* <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté Totale Restante</th> */}
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté à Produire</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSummaries.map((summary, index) => {
                            const selectedQuantity = selectedProducts[`summary-${summary.articleId}`] || 1;
                            
                            return (
                              <tr key={summary.articleId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 text-sm font-medium">
                                  {summary.articleName}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">{/*remplir la quantité en stock ici */}</td>
                                {/* <td className="px-4 py-3 text-center text-sm font-semibold text-orange-600">
                                  {summary.totalQuantityRemaining}
                                </td> */}
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="number"
                                    value={selectedQuantity}
                                    onChange={(e) => handleQuantityChange(`summary-${summary.articleId}`, parseFloat(e.target.value) || 0)}
                                    min="1"
                                    max={summary.totalQuantityRemaining}
                                    className="w-20 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-3 text-center space-x-2">
                                  <button
                                    onClick={() => handleSelectFromSummary(summary)}
                                    disabled={selectedQuantity <= 0 || selectedQuantity > summary.totalQuantityRemaining}
                                    className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed"
                                  >
                                    Sélectionner
                                  </button>
                                  <button
                                    onClick={() => showProductDetail(summary)}
                                    className="px-3 py-1 bg-accent text-white text-sm rounded hover:bg-accent-hover"
                                    title="Voir le détail des commandes"
                                  >
                                    Détail
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Detail Tab */}
              {activeTab === 'detail' && (
                <>
                  {selectedProductDetail ? (
                    <div>
                      {/* Product Header */}
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-blue-800">{selectedProductDetail.articleName}</h3>
                            <p className="text-sm text-blue-600">Quantité totale restante: <span className="font-semibold">{selectedProductDetail.totalQuantityRemaining}</span></p>
                          </div>
                          <button
                            onClick={() => setActiveTab('summary')}
                            className="px-3 py-1 bg-accent text-white text-sm rounded hover:bg-accent-hover"
                          >
                            Retour au résumé
                          </button>
                        </div>
                      </div>

                      {/* Orders Detail */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-100 border-b">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Commande</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté Commandée</th>
                              {/* <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté Préparée</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté Restante</th> */}
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté en stock</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté à Produire</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProductDetail.orders.map((product, index) => {
                              const productKey = getProductKey(product);
                              const selectedQuantity = selectedProducts[productKey] || 1;
                              
                              return (
                                <tr key={productKey} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3 text-sm font-medium text-blue-600">
                                    {product.orderCode}
                                    <div className="text-xs text-gray-500">
                                      {new Date(product.orderDate).toLocaleDateString('fr-FR')}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-semibold">
                                    {product.quantityOrdered}
                                  </td>
                                  {/* <td className="px-4 py-3 text-center text-sm text-green-600">
                                    {product.quantityPrepared}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-semibold text-orange-600">
                                    {product.quantityRemaining}
                                  </td> */}
                                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{/*remplir la quantité en stock ici */}</td>
                                  <td className="px-4 py-3 text-center">
                                    <input
                                      type="number"
                                      value={selectedQuantity}
                                      onChange={(e) => handleQuantityChange(productKey, parseFloat(e.target.value) || 0)}
                                      min="1"
                                      max={product.quantityRemaining}
                                      className="w-20 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="truncate max-w-32" title={product.clientName}>
                                      {product.clientName}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleSelectProduct(product)}
                                      disabled={selectedQuantity <= 0 || selectedQuantity > product.quantityRemaining}
                                      className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                      Sélectionner
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <List className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">Sélectionnez un produit</p>
                      <p className="text-sm">Cliquez sur "Détail" dans l'onglet résumé pour voir les commandes</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {activeTab === 'summary' 
              ? `${filteredSummaries.length} produit(s) en attente de préparation`
              : selectedProductDetail 
                ? `${selectedProductDetail.orders.length} commande(s) pour ${selectedProductDetail.articleName}`
                : 'Sélectionnez un produit pour voir les détails'
            }
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionDialog;