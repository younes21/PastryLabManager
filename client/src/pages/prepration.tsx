import React, { useState, useEffect } from 'react';
import { Plus, Save, X, FileText, Trash2, Edit3, ChevronDown, ArrowLeft, Play, Clock, Filter, CheckCircle, AlertTriangle, Pause, Zap, CirclePlus } from 'lucide-react';
import { Layout } from '@/components/layout';
import { apiRequest } from '@/lib/queryClient';
import ProductSelectionDialog from './dialog-prepration';
import { useToast } from '@/hooks/use-toast';

const PreparationPage = () => {
  const { toast } = useToast();
  const [operations, setOperations] = useState<any[]>([]);
  const [currentOperation, setCurrentOperation] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPlanningMode, setIsPlanningMode] = useState(false); // Mode planification simple
  const [isPartialMode, setIsPartialMode] = useState(false); // Mode création de reliquat
  const [parentOperation, setParentOperation] = useState<any>(null); // Opération parent pour reliquat
  const [items, setItems] = useState<any[]>([]);
  const [showProductSelect, setShowProductSelect] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Dialogues
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionData, setCompletionData] = useState<{ operationId: number | null, conformQuantity: string, wasteReason: string }>({ operationId: null, conformQuantity: '', wasteReason: '' });
  
  // Orders data for planning
  const [orders, setOrders] = useState<any[]>([]);

  // Data from API
  const [operators, setOperators] = useState<any[]>([]);
  const [storageZones, setStorageZones] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [recipeOperations, setRecipeOperations] = useState<any[]>([]);
  const [recipeMap, setrecipeMap] = useState<any>();
  const [workStations, setWorkStations] = useState<any[]>([]);

  // State for recipe details tabs
  const [activeRecipeTab, setActiveRecipeTab] = useState('ingredients');

  // Load initial data from API

  const loadOperations = async () => {
    const prepRes = await apiRequest('/api/inventory-operations?type=preparation&include_reliquat=true', 'GET');
    const preparationsData = await prepRes.json();
    setOperations(preparationsData || []);
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
           
        const [opRes, zoneRes, artRes, recRes, ordRes, wsRes] = await Promise.all([
          apiRequest('/api/users?role=preparateur', 'GET'),
          apiRequest('/api/storage-zones', 'GET'),
          apiRequest('/api/articles', 'GET'),
          apiRequest('/api/recipes', 'GET'),
          apiRequest('/api/orders/confirmed-with-products-to-prepare', 'GET'),
          apiRequest('/api/work-stations', 'GET'),
        ]);
        loadOperations();


        const operatorsData = await opRes.json();
        const zonesData = await zoneRes.json();
        const articlesData = await artRes.json();
        const recipesData = await recRes.json();
        const ordersData = await ordRes.json();
        const workStationsData = await wsRes.json();

        setOperators(operatorsData || []);
        setStorageZones(zonesData || []);
        
        // Filter to products only (with recipes)
        const products = (articlesData || [])
          .filter((a: any) => a.type === 'product')
          .map((a: any) => ({
            ...a,
            currentStock: a.currentStock?.toString() || '0',
          }));
        const allArticles = (articlesData || [])
          .map((a: any) => ({
            ...a,
            currentStock: a.currentStock?.toString() || '0',
          }));
          
          const recipesMap = new Map(recipesData.map(r => [r.articleId, r.designation]));

        setProducts(products);
        setArticles(allArticles);
        setRecipes(recipesData || []);
        setrecipeMap(recipesMap);
        setOrders(ordersData || []);
        setWorkStations(workStationsData || []);
        
        console.log('State updated successfully');
      } catch (error) {
        console.error('Error loading preparation page data:', error);
        alert('Erreur lors du chargement des données');
      }
    };

    loadAll();
  }, []);

  // Debug useEffect to monitor state changes
  useEffect(() => {
   
    if (isPartialMode) {
      console.log('🔄 Partial mode state changed:', {
        items: items,
        itemsLength: items.length,
        firstItem: items[0],
        firstItemArticle: items[0]?.article,
        firstItemRecipe: items[0]?.recipe,
        recipeIngredients: recipeIngredients,
        recipeOperations: recipeOperations
      });
    }
  }, [isPartialMode, items, recipeIngredients, recipeOperations]);

  // Load recipe details when recipe is selected
  const loadRecipeDetails = async (recipeId: number) => {
    try {
      console.log('🔍 Loading recipe details for recipe ID:', recipeId);
      
      const [ingredientsRes, operationsRes] = await Promise.all([
        apiRequest(`/api/recipes/${recipeId}/ingredients`, 'GET'),
        apiRequest(`/api/recipes/${recipeId}/operations`, 'GET'),
      ]);

      console.log('📥 API responses received:', { ingredientsRes, operationsRes });

      const ingredientsData = await ingredientsRes.json();
      const operationsData = await operationsRes.json();

      console.log('📊 Parsed data:', { ingredientsData, operationsData });

      setRecipeIngredients(ingredientsData || []);
      setRecipeOperations(operationsData || []);
      
      console.log('✅ Recipe details loaded successfully');
    } catch (error) {
      console.error('❌ Error loading recipe details:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        recipeId
      });
      setRecipeIngredients([]);
      setRecipeOperations([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      programmed: 'bg-blue-100 text-blue-800', 
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      draft: 'Brouillon',
      programmed: 'Programmé',
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const createNewOperation = () => {
    setCurrentOperation({
      id: null,
      code: undefined,
      type: 'preparation',
      status: 'draft',
      operatorId: null,
      storageZoneId: '',
      scheduledDate: '',
      notes: '',
      parentOperationId: null,
      createdAt: new Date().toISOString(),
    });
    setItems([]);
    setSelectedArticle(null);
    setSearchTerm('');
    setIsEditing(true);
    setIsPlanningMode(true); // Mode planification simple par défaut
    setIsPartialMode(false);
    setParentOperation(null);
    
    // Reset recipe details
    setRecipeIngredients([]);
    setRecipeOperations([]);
  };

  const createPartialOperation = async (parentOp: any) => {
    console.log('Creating partial operation from:', parentOp);
    
    try {
      // First, fetch the full operation data including items
      const fullOpRes = await apiRequest(`/api/inventory-operations/${parentOp.id}`, 'GET');
      const fullOpData = await fullOpRes.json();
      
      console.log('Full operation data fetched:', fullOpData);
      
      const newOp = {
        id: null,
        code: undefined,
        type: 'preparation_reliquat',
        status: 'draft',
        operatorId: null,
        storageZoneId: '',
        scheduledDate: '',
        notes: '',
        parentOperationId: parentOp.id,
        createdAt: new Date().toISOString(),
        items: []
      };
      setCurrentOperation(newOp);
      
      // Copy items from parent operation
      if (fullOpData.items && fullOpData.items.length > 0) {
        const parentItem = fullOpData.items[0];
        console.log('Parent item:', parentItem);
        console.log('Parent item article:', parentItem.article);
        console.log('Parent item recipe:', parentItem.recipe);
        
        // Enrich the item data with full article and recipe objects
        const enrichedItem = {
          ...parentItem,
          id: null,
          quantity: 1, // Start with quantity 1 for reliquat
          quantityBefore: parseFloat((parentItem.article?.currentStock ?? 0).toString()),
          quantityAfter: 0,
          // Ensure we have the full article object
          article: parentItem.article || articles.find((a: any) => a.id === parentItem.articleId),
          // Ensure we have the full recipe object
          recipe: parentItem.recipe || recipes.find((r: any) => r.articleId === parentItem.articleId),
        };
        
        console.log('Enriched item created:', enrichedItem);
        setItems([enrichedItem]);
        
        // Load recipe details from parent operation
        if (enrichedItem.recipe) {
          console.log('Loading recipe details for recipe ID:', enrichedItem.recipe.id);
          loadRecipeDetails(enrichedItem.recipe.id);
        } else {
          console.log('No recipe found in parent item');
        }
      } else {
        console.log('No items in parent operation');
        setItems([]);
      }
      
      setIsEditing(true);
      setIsPlanningMode(false);
      setIsPartialMode(true);
      setParentOperation(fullOpData);
      
      console.log('Partial operation setup complete. Items:', items);
    } catch (error) {
      console.error('Error creating partial operation:', error);
      alert('Erreur lors de la création de la préparation de reliquat');
    }
  };

  const editOperation = async (op: any) => {
    try {
      const res = await apiRequest(`/api/inventory-operations/${op.id}`, 'GET');
      const data = await res.json();

      setCurrentOperation({
        id: data.id,
        code: data.code,
        type: data.type,
        status: data.status,
        operatorId: data.operatorId,
        storageZoneId: data.storageZoneId,
        scheduledDate: data.scheduledDate ? data.scheduledDate.split('T')[0] : '',
        notes: data.notes || '',
        parentOperationId: data.parentOperationId,
        createdAt: data.createdAt,
      });

      const mappedItems = (data.items || []).map((it: any) => ({
        id: it.id,
        articleId: it.articleId,
        article: articles.find((a: any) => a.id === it.articleId) || { id: it.articleId },
        recipe: recipes.find((r: any) => r.articleId === it.articleId),
        quantity: parseFloat(it.quantity || '0'),
        quantityBefore: parseFloat(it.quantityBefore || '0'),
        quantityAfter: parseFloat(it.quantityAfter || '0'),
        toStorageZoneId: it.toStorageZoneId || null,
        notes: it.notes || '',
        orderId: it.orderId,
        orderItemId: it.orderItemId,
      }));
      setItems(mappedItems);
      
      // Load recipe details if there's a recipe
      if (mappedItems.length > 0 && mappedItems[0].recipe) {
        loadRecipeDetails(mappedItems[0].recipe.id);
      }
      
      setIsEditing(true);
      
      // Determine modes
      setIsPlanningMode(false);
      setIsPartialMode(data.type === 'preparation_reliquat');
      if (data.type === 'preparation_reliquat' && data.parentOperationId) {
        const parentOp = operations.find(op => op.id === data.parentOperationId);
        setParentOperation(parentOp);
      }
    } catch (error) {
      console.error('Error editing operation:', error);
      alert('Erreur lors de la modification de l\'opération');
    }
  };

  const deleteOperation = async (opId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette préparation ?')) {
      try {
        await apiRequest(`/api/inventory-operations/${opId}`, 'DELETE');
        setOperations(operations.filter(op => op.id !== opId));
        if (currentOperation?.id === opId) {
          setCurrentOperation(null);
          setItems([]);
          setIsEditing(false);
        }
      } catch (e) {
        console.error('Failed to delete operation', e);
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
      const recipe = recipes.find(r => r.articleId === articleToAdd.id);
      if (!recipe) {
        alert('Aucune recette trouvée pour ce produit');
        return;
      }

      const newItem = {
        id:null,
        articleId: articleToAdd.id,
        article: articleToAdd,
        recipe: recipe,
        quantity: 1,
        quantityBefore: parseFloat((articleToAdd.currentStock ?? 0).toString()),
        quantityAfter: 0,
        toStorageZoneId: currentOperation?.storageZoneId || null,
        notes: ''
      };

      // En mode planification ou reliquat, on ne peut avoir qu'un seul produit
      // Si l'utilisateur change de produit, il écrase l'ancien
      if (isPlanningMode || isPartialMode) {
        setItems([newItem]);
        setSelectedArticle(articleToAdd);
        setSearchTerm('');
        
        // Load recipe details for this product
        loadRecipeDetails(recipe.id);
        return;
      }

      // En mode normal, on peut ajouter plusieurs produits
      setItems([...items, newItem]);
      setSelectedArticle(null);
      setSearchTerm('');
      
      // Load recipe details for this product
      loadRecipeDetails(recipe.id);
    }
  };

  const addItemFromDialog = (productData: any) => {
    const recipe = recipes.find(r => r.articleId === productData.articleId);
    if (!recipe) {
      alert('Aucune recette trouvée pour ce produit');
      return;
    }

    const newItem = {
      id: null,
      articleId: productData.articleId,
      article: productData.article,
      recipe: recipe,
      quantity: productData.quantityToProduce,
      quantityBefore: parseFloat((productData.article.currentStock ?? 0).toString()),
      quantityAfter: 0,
      toStorageZoneId: currentOperation?.storageZoneId || null,
      notes: `Commande: ${productData.orderCode}`,
      orderId: productData.orderId,
      orderItemId: productData.orderItemId,
      operationId:0
    };

    // En mode planification ou reliquat, on ne peut avoir qu'un seul produit
    // Si l'utilisateur change de produit, il écrase l'ancien
    if (isPlanningMode || isPartialMode) {
      setItems([newItem]);
      setSelectedArticle(productData.article);
      
      // Load recipe details for this product
      loadRecipeDetails(recipe.id);
    } else {
      // En mode normal, on peut ajouter plusieurs produits
      setItems([...items, newItem]);
      
      // Load recipe details for this product
      loadRecipeDetails(recipe.id);
    }
    
    setShowProductDialog(false);
  };

  const removeItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: number, newQuantity: any) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const quantity = parseFloat(newQuantity || 0);
        return {
          ...item,
          quantity,
          quantityAfter: item.quantityBefore + quantity
        };
      }
      return item;
    }));
  };

  // Check ingredient availability
  const checkIngredientAvailability = async (recipeId: number, quantity: number) => {
    try {
      const res = await apiRequest(`/api/recipes/${recipeId}/check-ingredients`, 'POST', {
        quantity: quantity
      });
      const data = await res.json();
      return data.available;
    } catch (e) {
      console.error('Failed to check ingredients', e);
      return false;
    }
  };
  const canUpdateOp= ()=> { return(currentOperation.status=='draft' || currentOperation.status=='programmed')}

  const saveOperation = async () => {
    if (!currentOperation) return;

    try {    
      // Validation
      if ( items.length === 0) {
        alert('Sélectionnez au moins un produit.');
        return;
      }
      if ( currentOperation.scheduledDate == null) {
        alert('Sélectionnez la date de préparation');
        return;
      }
     
      
      const invalidLine = items.some((it) => (Number(it.quantity) || 0) <= 0);
      if (invalidLine) {
        toast({title:'la quantité doit etre > 0.',variant: "warning"});
        return;
      }
      const parentQuantity = parentOperation?.items?.[0]?.quantity;
      const reliquatQuantity = items?.[0]?.quantity;
      if( currentOperation.type=='preparation_reliquat' && reliquatQuantity >= parentQuantity ){
     
        toast({title:'la quantité doit etre < '+ parentQuantity,variant: "warning"});
        return;
      }

      // Determine status based on scheduled date
      const status = currentOperation.scheduledDate ? 'programmed' : 'draft';

      const preparationHeader = {
        type: currentOperation.type || 'preparation',
        status: status,
        operatorId: currentOperation.operatorId,
        storageZoneId: currentOperation.storageZoneId || null,
        scheduledDate: currentOperation.scheduledDate || null,
        notes: currentOperation.notes || '',
        parentOperationId: currentOperation.parentOperationId || null,
      };

      const itemsPayload = items.map((it) => ({
        articleId: it.articleId,
        quantity: it.quantity.toString(),
        quantityBefore: it.quantityBefore.toString(),
        quantityAfter: it.quantityAfter.toString(),
        toStorageZoneId: it.toStorageZoneId || null,
        notes: it.notes || '',
        operationId:0
      }));


      // Determine if this is a new operation or updating existing one
      const isNewOperation = !currentOperation.id ; // Temporary IDs are typically large numbers
      const method = isNewOperation ? 'POST' : 'PUT';
      const url = method === 'POST' ? '/api/inventory-operations' : `/api/inventory-operations/${currentOperation.id}`;
      
      console.log('🌐 Making API request:', { method, url, isNewOperation, operationId: currentOperation.id });
      
      const res = await apiRequest(url, method, {
        operation: preparationHeader,
        items: itemsPayload,
      });
     const data = await res.json();
     loadOperations();
      // Update operations list
      if (method === 'POST') {
        setOperations([data, ...operations]);
      } else {
        setOperations(operations.map(op => op.id === data.id ? data : op));
      }

      setCurrentOperation({
        id: data.id,
        code: data.code,
        type: data.type,
        status: data.status,
        operatorId: data.operatorId,
        storageZoneId: data.storageZoneId,
        scheduledDate: data.scheduledDate ? data.scheduledDate.split('T')[0] : '',
        notes: data.notes || '',
        createdAt: data.createdAt,
      });

        alert('Préparation sauvegardée');
    } catch (e) {
      console.error('❌ Failed to save preparation:', e);
      console.error('Error details:', {
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        currentOperation,
        items
      });
      alert('Erreur lors de la sauvegarde');
    }
  };

  const startPreparation = async () => {
    if (!currentOperation?.id) {
      alert('Veuillez sauvegarder avant de lancer la préparation.');
      return;
    }

    try {
      // Check all ingredients availability
      for (const item of items) {
        if (item.recipe) {
          const available = await checkIngredientAvailability(item.recipe.id, item.quantity);
          if (!available) {
            alert(`Ingrédients insuffisants pour ${item.article.name}`);
            return;
          }
        }
      }

      await apiRequest(`/api/inventory-operations/${currentOperation.id}`, 'PATCH', { 
        status: 'in_progress',
        startedAt: new Date().toISOString()
      });
      
      setOperations(operations.map(op => 
        op.id === currentOperation.id ? { ...op, status: 'in_progress' } : op
      ));
      setCurrentOperation({ ...currentOperation, status: 'in_progress' });
      
      alert('Préparation lancée');
    } catch (e) {
      console.error('Failed to start preparation', e);
      alert('Erreur lors du lancement');
    }
  };

  const launchAllOperation = async (operationId: number) => {
    try {
      // Check ingredients availability first
      const operation = operations.find(op => op.id === operationId);
      if (!operation) return;

      for (const item of operation.items || []) {
        const recipe = recipes.find(r => r.articleId === item.articleId);
        if (recipe) {
          const available = await checkIngredientAvailability(recipe.id, item.quantity);
          if (!available) {
            alert(`Ingrédients insuffisants pour ${item.article?.name || 'le produit'}`);
            return;
          }
        }
      }

      await apiRequest(`/api/inventory-operations/${operationId}`, 'PATCH', { 
        status: 'in_progress',
        startedAt: new Date().toISOString()
      });
      
      setOperations(operations.map(op => 
        op.id === operationId ? { ...op, status: 'in_progress' } : op
      ));
      
      alert('Préparation lancée');
    } catch (e) {
      console.error('Failed to launch preparation', e);
      alert('Erreur lors du lancement');
    }
  };

  const openCompletionDialog = (operationId: number) => {
    const operation = operations.find(op => op.id === operationId);
    if (!operation) return;

    // Get total planned quantity
    const totalPlanned = (operation.items || []).reduce((sum: number, item: any) => 
      sum + parseFloat(item.quantity || 0), 0);

    setCompletionData({
      operationId,
      conformQuantity: totalPlanned.toString(),
      wasteReason: ''
    });
    setShowCompletionDialog(true);
  };

  const completeOperationWithQuantity = async () => {
    try {
      const { operationId, conformQuantity, wasteReason } = completionData;
      
      if (!operationId || !conformQuantity) {
        alert('Veuillez renseigner la quantité conforme');
        return;
      }

      const operation = operations.find(op => op.id === operationId);
      if (!operation) return;

      const totalPlanned = (operation.items || []).reduce((sum: number, item: any) => 
        sum + parseFloat(item.quantity || 0), 0);
      const conformQty = parseFloat(conformQuantity);

      if (conformQty < 0 || conformQty > totalPlanned) {
        alert(`La quantité conforme doit être comprise entre 0 et ${totalPlanned}`);
        return;
      }

      if (conformQty < totalPlanned && !wasteReason.trim()) {
        alert('Veuillez indiquer la cause du rebut');
        return;
      }

      await apiRequest(`/api/inventory-operations/${operationId}/complete`, 'PATCH', {
        status: 'completed',
        completedAt: new Date().toISOString(),
        conformQuantity: conformQty,
        wasteReason: conformQty < totalPlanned ? wasteReason : null
      });
      
      setOperations(operations.map(op => 
        op.id === operationId ? { ...op, status: 'completed', conformQuantity: conformQty } : op
      ));
      
      setShowCompletionDialog(false);
      setCompletionData({ operationId: null, conformQuantity: '', wasteReason: '' });
      
      // Refresh data
      const artRes = await apiRequest('/api/articles', 'GET');
      const articlesData = await artRes.json();
      setArticles((articlesData || []).filter((a: any) => a.type === 'product'));
      
      const ordRes = await apiRequest('/api/orders/confirmed-with-products-to-prepare', 'GET');
      const ordersData = await ordRes.json();
      setOrders(ordersData || []);
      
      alert('Préparation terminée avec succès');
    } catch (e) {
      console.error('Failed to complete preparation', e);
      alert('Erreur lors de la finalisation');
    }
  };

  const completeOperation = async () => {
    if (!currentOperation?.id) return;
    
    try {
      await apiRequest(`/api/inventory-operations/${currentOperation.id}`, 'PATCH', { 
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      setOperations(operations.map(op => 
        op.id === currentOperation.id ? { ...op, status: 'completed' } : op
      ));
      setCurrentOperation({ ...currentOperation, status: 'completed' });
      
      // Refresh articles to show updated stock
      try {
        const artRes = await apiRequest('/api/articles', 'GET');
        const articlesData = await artRes.json();
        setArticles((articlesData || []).filter((a: any) => a.type === 'product'));
      } catch {}
      
      alert('Préparation terminée');
    } catch (e) {
      console.error('Failed to complete preparation', e);
      alert('Erreur lors de la finalisation');
    }
  };

  const cancelOperation = async () => {
    if (!currentOperation?.id) return;
    
    try {
      await apiRequest(`/api/inventory-operations/${currentOperation.id}`, 'PATCH', { 
        status: 'cancelled' 
      });
      
      setOperations(operations.map(op => 
        op.id === currentOperation.id ? { ...op, status: 'cancelled' } : op
      ));
      setCurrentOperation({ ...currentOperation, status: 'cancelled' });
    } catch (e) {
      console.error('Failed to cancel preparation', e);
      alert('Erreur lors de l\'annulation');
    }
  };

  // Filter operations with hierarchy support
  const getFilteredOperations = () => {
    let filtered = operations;
    console.log(operations);

    if (filterDate) {
      const today = new Date();
      const filterDateObj = new Date(filterDate);
      
      switch (filterDate) {
        case 'today':
          filtered = filtered.filter(op => {
            const opDate = new Date(op.scheduledDate || op.createdAt);
            return opDate.toDateString() === today.toDateString();
          });
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          filtered = filtered.filter(op => {
            const opDate = new Date(op.scheduledDate || op.createdAt);
            return opDate.toDateString() === yesterday.toDateString();
          });
          break;
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          filtered = filtered.filter(op => {
            const opDate = new Date(op.scheduledDate || op.createdAt);
            return opDate.toDateString() === tomorrow.toDateString();
          });
          break;
        default:
          if (filterDate.includes('-')) {
            filtered = filtered.filter(op => {
              const opDate = new Date(op.scheduledDate || op.createdAt);
              return opDate.toDateString() === filterDateObj.toDateString();
            });
          }
      }
    }

    if (filterStatus) {
      filtered = filtered.filter(op => op.status === filterStatus);
    }

    // Organize with hierarchy: parent operations followed by their children
    const parents = filtered.filter(op => !op.parentOperationId);
    const children = filtered.filter(op => op.parentOperationId);
    
    const organized: any[] = [];
    
    parents.sort((a, b) => 
      new Date(b.scheduledDate || b.createdAt).getTime() - 
      new Date(a.scheduledDate || a.createdAt).getTime()
    ).forEach(parent => {
      organized.push(parent);
      
      // Add children of this parent
      const parentChildren = children.filter(child => child.parentOperationId === parent.id);
      parentChildren.sort((a, b) => 
        new Date(b.scheduledDate || b.createdAt).getTime() - 
        new Date(a.scheduledDate || a.createdAt).getTime()
      ).forEach(child => {
        organized.push({ ...child, isChild: true });
      });
    });
    
    return organized;
  };

  if (!isEditing) {
    return (
      <Layout title='Préparations de Produits'>
        <div>
          {/* Header */}
          <div className="mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className='text-gray-600 dark:text-gray-400 mt-2'>
                  Gérer la préparation de vos produits selon leurs recettes
                </p>
                
                {/* Filters */}
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Toutes les dates</option>
                      <option value="today">Aujourd'hui</option>
                      <option value="yesterday">Hier</option>
                      <option value="tomorrow">Demain</option>
                    </select>
                    <input
                      type="date"
                      value={filterDate.includes('-') ? filterDate : ''}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tous les états</option>
                    <option value="draft">Brouillon</option>
                    <option value="programmed">Programmé</option>
                    <option value="pending">En attente</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={createNewOperation}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Planifier une Préparation</span>
              </button>
            </div>
          </div>

          {/* Operations List */}
          <div className="mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Référence</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nom de la Recette</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté Planifiée</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qté Conforme</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Opérateur</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">État</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredOperations().map((operation, index) => {
                    
                      const operator = operators.find(o => o.id === operation.operatorId);
                      const totalQuantity = (operation.items || []).reduce((sum: number, item: any) => 
                        sum + parseFloat(item.quantity || 0), 0);
                      // Sum conformQuantity per item if available, otherwise fallback
                      let conformQuantity = '-';
                      if (operation.status === 'completed') {
                        if (operation.items && operation.items.some((item: any) => item.conformQuantity !== undefined)) {
                          conformQuantity = operation.items.reduce((sum: number, item: any) => sum + parseFloat(item.conformQuantity || 0), 0);
                        } else if (operation.conformQuantity !== undefined) {
                          conformQuantity = operation.conformQuantity;
                        }
                      }
                      // Get recipe names for the operation, prefer item.recipe.designation if available
                      const recipeNames = (operation.items || [])
                      .map(item => recipeMap.get(item.articleId) || 'Recette inconnue')
                      .join(', ');
                  
                      const isChild = operation.isChild;
                      const rowClass = isChild 
                        ? 'bg-blue-50 border-l-4 border-blue-300' 
                        : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
                      return (
                        <tr key={`${operation.id}-${operation.isChild ? 'child' : 'parent'}`} className={rowClass}>
                          <td className={`px-4 py-3 text-sm text-gray-800 ${isChild ? 'pl-8' : ''}`}>
                            {new Date(operation.scheduledDate || operation.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">
                            {isChild && '└─ '}
                            {operation.code}
                            {operation.type === 'preparation_reliquat' && (
                              <span className="ml-2 text-xs text-orange-600 font-medium">(Reliquat)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {recipeNames}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold">
                            {totalQuantity}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                            {conformQuantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {operator ? `${operator.firstName} ${operator.lastName}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(operation.status)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center space-x-1">
                              {/* Lancer tout - pour operations programmées */}
                              {operation.status === 'programmed' && (
                                <button
                                  onClick={() => launchAllOperation(operation.id)}
                                  className="text-green-600 hover:text-green-800 p-1"
                                  title="Lancer tout"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* Terminer - pour operations en cours */}
                              {operation.status === 'in_progress' && (
                                <button
                                  onClick={() => openCompletionDialog(operation.id)}
                                  className="text-purple-600 hover:text-purple-800 p-1"
                                  title="Terminer"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* Créer reliquat - pour operations principales uniquement */}
                              {!isChild && operation.status === 'programmed' && (
                                <button
                                  onClick={() => createPartialOperation(operation)}
                                  className="text-orange-600 hover:text-orange-800 p-1"
                                  title="Créer préparation partielle"
                                >
                                  <CirclePlus className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* Modifier */}
                              <button
                                onClick={() => editOperation(operation)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              {/* Supprimer */}
                              <button
                                onClick={() => deleteOperation(operation.id)}
                                disabled={operation.status === 'completed' || operation.status === 'in_progress'}
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
                
                {getFilteredOperations().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucune préparation trouvée.</p>
                    <button
                      onClick={createNewOperation}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Créer votre première préparation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Selection Dialog */}
        {showProductDialog && (
          <ProductSelectionDialog
            isOpen={showProductDialog}
            onClose={() => setShowProductDialog(false)}
            onSelect={addItemFromDialog}
          />
        )}
      </Layout>
    );
  }

  const getEditTitle = () => {
    if (isPlanningMode) return 'Planifier une Préparation';
    if (isPartialMode) return 'Créer Préparation de Reliquat';
    return currentOperation?.code ? `Modifier ${currentOperation.code}` : 'Nouvelle Préparation';
  };

  return (
    <Layout title={`Préparations de Produits > ${getEditTitle()}`}>
      <div>
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="mx-auto px-4 py-3">
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
{/* *************************************** edition   *************************************  */}
        <div className="mx-auto px-4 py-4">
          {/* Configuration */}
          <div className="bg-white rounded-lg shadow-sm border mb-4">
            <div className="p-4">
              {(isPlanningMode || (!isPlanningMode && !isPartialMode)) && (
                <>
                  {/* Interface unifiée pour ajout et modification */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sélectionner Produit *</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowProductSelect(!showProductSelect)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-left flex items-center justify-between hover:bg-gray-50"
                          disabled={!canUpdateOp()}
                        >
                          <span>{selectedArticle ? selectedArticle.name : items[0]?.article?.name || 'Sélectionner...'}</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {showProductSelect && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                            <div className="p-2">
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Rechercher..."
                                className="w-full px-2 py-1 mb-2 border border-gray-200 rounded"
                              />
                              <div className="max-h-48 overflow-y-auto">
                                {products.filter(article =>
                                  (article?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (article?.code || '').toLowerCase().includes(searchTerm.toLowerCase())
                                ).map(article => (
                                  <div
                                    key={article.id}
                                    className="px-2 py-1 hover:bg-blue-100 cursor-pointer rounded"
                                    onClick={() => {
                                      setSelectedArticle(article);
                                      setShowProductSelect(false);
                                      // Replace the item in edit mode as well
                                      const recipe = recipes.find(r => r.articleId === article.id);
                                      if (!recipe) {
                                        alert('Aucune recette trouvée pour ce produit');
                                        return;
                                      }
                                      const newItem = {
                                        id: null,
                                        articleId: article.id,
                                        article: article,
                                        recipe: recipe,
                                        quantity: 1,
                                        quantityBefore: parseFloat((article.currentStock ?? 0).toString()),
                                        quantityAfter: 0,
                                        toStorageZoneId: currentOperation?.storageZoneId || null,
                                        notes: '',
                                      };
                                      setItems([newItem]);
                                      loadRecipeDetails(recipe.id);
                                    }}
                                  >
                                    <span className="font-medium">{article.name}</span>
                                    <span className="ml-2 text-xs text-gray-500">{article.code}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Depuis commande</label>
                      <button
                        onClick={() => setShowProductDialog(true)}
                        className="w-full px-3 py-1.5 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 flex items-center justify-center space-x-2"
                        disabled={!canUpdateOp()}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Choisir depuis commande</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantité à produire *</label>
                      <input
                        type="number"
                        value={items[0]?.quantity || 1}
                        onChange={e => items[0] && updateItemQuantity(items[0].id, e.target.value)}
                        min="1"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={!canUpdateOp()}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date programmée *</label>
                      <input
                        type="date"
                        value={currentOperation?.scheduledDate || ''}
                        onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, scheduledDate: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={!canUpdateOp()}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Opérateur</label>
                      <select
                        value={currentOperation?.operatorId || null}
                        onChange={e => setCurrentOperation((prev: any) => ({ ...prev, operatorId: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={!canUpdateOp()}
                      >
                        <option value="">Sélectionner...</option>
                        {operators.map(operator => (
                          <option key={operator.id} value={operator.id}>{operator.firstName} {operator.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={currentOperation?.notes || ''}
                        onChange={e => setCurrentOperation((prev: any) => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                        rows={2}
                        placeholder="Notes sur cette préparation..."
                        disabled={!canUpdateOp()}
                      />
                    </div>
                  </div>
                 
              
                </>
              )}
              {isPartialMode  && (
                <>
                  {/* Interface pour préparation de reliquat */}
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="text-sm font-medium text-orange-800 mb-1">Préparation de Reliquat</h4>
                    <p className="text-xs text-orange-700">
                      Opération parent: {parentOperation?.code}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantité à produire *</label>
                      <input
                        type="number"
                        value={items[0]?.quantity || 1}
                        onChange={(e) => items[0] && updateItemQuantity(items[0].id, e.target.value)}
                        min="1"
                        max={parentOperation?.items?.[0]?.quantity || 999}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={!canUpdateOp()}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max: {parentOperation?.items?.[0]?.quantity || 0} {items[0]?.article?.unit}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Zone de stockage</label>
                      <select
                        value={currentOperation?.storageZoneId || ''}
                        onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, storageZoneId: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={!canUpdateOp()}
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Opérateur *</label>
                      <select
                        value={currentOperation?.operatorId }
                        onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, operatorId: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        disabled={false}
                      >
                        <option value="">Sélectionner...</option>
                        {operators.map(operator => (
                          <option key={operator.id} value={operator.id}>
                            {operator.firstName} {operator.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={currentOperation?.notes || ''}
                        onChange={(e) => setCurrentOperation((prev: any) => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                        rows={2}
                        placeholder="Notes sur cette préparation..."
                        disabled={!canUpdateOp()}
                      />
                    </div>
                  </div>

                  {/* Affichage des dates de commande si depuis commande */}
                  {items[0]?.orderId && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Informations de la commande</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Date de création:</span>
                          <span className="ml-2 font-medium">
                            {orders.find(o => o.id === items[0].orderId)?.orderDate 
                              ? new Date(orders.find(o => o.id === items[0].orderId)?.orderDate).toLocaleDateString('fr-FR')
                              : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date prévue de livraison:</span>
                          <span className="ml-2 font-medium">
                            {orders.find(o => o.id === items[0].orderId)?.deliveryDate
                              ? new Date(orders.find(o => o.id === items[0].orderId)?.deliveryDate).toLocaleDateString('fr-FR')
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

                {/* Affichage du produit à préparer */}
                {items[0]?.article && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-3">Produit à préparer</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Produit:</span>
                          <span className="ml-2 font-medium">{items[0].article.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Code:</span>
                          <span className="ml-2 font-medium">{items[0].article.code}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Recette:</span>
                          <span className="ml-2 font-medium">{items[0].recipe?.designation || '-'}</span>
                        </div>
                         <div>
                    <span className="text-sm text-gray-600">Quantité:</span>
                    <span className="ml-2 font-medium text-blue-600">{items[0]?.quantity} {items[0]?.article?.unit}</span>
                  </div>
                        <div>
                          <span className="text-gray-600">Stock actuel:</span>
                          <span className="ml-2 font-medium">{items[0].quantityBefore} {items[0].article.unit}</span>
                        </div>
                      </div>
                    </div>
                  )}

                   {/* Affichage des dates de commande si depuis commande */}
                   {items[0]?.orderId && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Informations de la commande</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Date de création:</span>
                          <span className="ml-2 font-medium">
                            {orders.find(o => o.id === items[0].orderId)?.orderDate 
                              ? new Date(orders.find(o => o.id === items[0].orderId)?.orderDate).toLocaleDateString('fr-FR')
                              : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date prévue de livraison:</span>
                          <span className="ml-2 font-medium">
                            {orders.find(o => o.id === items[0].orderId)?.deliveryDate
                              ? new Date(orders.find(o => o.id === items[0].orderId)?.deliveryDate).toLocaleDateString('fr-FR')
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="bg-white rounded-lg shadow-sm border mb-4">
            <div className="p-4">
              <div className="flex items-center justify-end space-x-3">
                {canUpdateOp() && (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Annuler</span>
                    </button>
                    
                    <button
                      onClick={saveOperation}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Sauvegarder</span>
                    </button>
                    
                    {currentOperation?.id && (
                      <button
                        onClick={startPreparation}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Lancer la préparation</span>
                      </button>
                    )}
                  </>
                )}
                
                {currentOperation?.status === 'in_progress' && (
                  <button
                    onClick={() => openCompletionDialog(currentOperation.id)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Terminer la préparation</span>
                  </button>
                )}
              </div>
            </div>
          </div>

      
          {/* Recipe Details Table  */}
          { items.length > 0 && items[0]?.recipe && (
            <div className="bg-white rounded-lg shadow-sm border mb-4">
              <div className="p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Détail de la recette</h3>
                
                {/* Tabs for Recipe Details */}
                <div className="flex border-b mb-4">
                  <button
                    onClick={() => setActiveRecipeTab('ingredients')}
                    className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm transition-colors ${
                      activeRecipeTab === 'ingredients'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span>Ingrédients</span>
                  </button>
                  <button
                    onClick={() => setActiveRecipeTab('operations')}
                    className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm transition-colors ${
                      activeRecipeTab === 'operations'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span>Opérations</span>
                  </button>
                </div>

                {/* Ingredients Tab */}
                {activeRecipeTab === 'ingredients' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Type Article</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Nom Article</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Prix d'achat (DA)</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Quantité</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Unité</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Coût (DA)</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">En Stock Dispo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipeIngredients.length > 0 ? (
                          recipeIngredients.map((ingredient, index) => {
                            const article = articles.find(a => a.id === ingredient.articleId);
                            const stockDispo = article?.currentStock || 0;
                            const cout = (parseFloat(ingredient.quantity) || 0) * (parseFloat(article?.costPerUnit || '0') || 0);
                            
                            return (
                              <tr key={ingredient.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-3 py-2 text-xs text-gray-600">
                                  {article?.type === 'ingredient' ? 'Ingrédient' : 'Produit'}
                                </td>
                                <td className="px-3 py-2 text-xs font-medium text-gray-800">
                                  {article?.name || 'Article inconnu'}
                                </td>
                                <td className="px-3 py-2 text-center text-xs text-gray-600">
                                  {parseFloat(article?.costPerUnit || '0').toFixed(2)} 
                                </td>
                                <td className="px-3 py-2 text-center text-xs font-semibold">
                                  {parseFloat(ingredient.quantity).toFixed(3)}
                                </td>
                                <td className="px-3 py-2 text-center text-xs text-gray-600">
                                  {ingredient.unit}
                                </td>
                                <td className="px-3 py-2 text-center text-xs font-semibold text-green-600">
                                  {cout.toFixed(2)} 
                                </td>
                                <td className="px-3 py-2 text-center text-xs">
                                  <span className={`font-medium ${stockDispo > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {parseFloat(stockDispo.toString()).toFixed(3)} {article?.unit}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="bg-gray-50">
                            <td className="px-3 py-2 text-xs text-gray-600" colSpan={7}>
                              <em>Chargement des ingrédients...</em>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Operations Tab */}
                {activeRecipeTab === 'operations' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Ordre</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Description</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Durée</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Poste de travail</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Température</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipeOperations.length > 0 ? (
                          recipeOperations.map((operation, index) => (
                            <tr key={operation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-3 py-2 text-center text-xs font-medium text-gray-800">
                                {operation.order || index + 1}
                              </td>
                              <td className="px-3 py-2 text-xs font-medium text-gray-800">
                                {operation.description}
                              </td>
                              <td className="px-3 py-2 text-center text-xs text-gray-600">
                                {operation.duration ? `${operation.duration} min` : '-'}
                              </td>
                              <td className="px-3 py-2 text-center text-xs text-gray-600">
                                {operation.workStationId ? 
                                  workStations.find(ws => ws.id === operation.workStationId)?.designation || 'Poste inconnu'
                                  : '-'
                                }
                              </td>
                              <td className="px-3 py-2 text-center text-xs text-gray-600">
                                {operation.temperature || '-'}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-600">
                                {operation.notes || '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="bg-gray-50">
                            <td className="px-3 py-2 text-xs text-gray-600" colSpan={6}>
                              <em>Aucune opération définie pour cette recette</em>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        
        </div>

        {/* Product Selection Dialog */}
        {showProductDialog && (
          <ProductSelectionDialog
            isOpen={showProductDialog}
            onClose={() => setShowProductDialog(false)}
            onSelect={addItemFromDialog}
          />
        )}

        {/* Completion Dialog */}
        {showCompletionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Terminer la préparation</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantité conforme produite *
                    </label>
                    <input
                      type="number"
                      value={completionData.conformQuantity}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, conformQuantity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      placeholder="Quantité produite"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cause du rebut (si quantité conforme &lt; quantité prévue)
                    </label>
                    <textarea
                      value={completionData.wasteReason}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, wasteReason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Expliquer la cause du rebut..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCompletionDialog(false);
                      setCompletionData({ operationId: null, conformQuantity: '', wasteReason: '' });
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={completeOperationWithQuantity}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Terminer la préparation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PreparationPage;
                              