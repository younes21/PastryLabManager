import React, { useState, useEffect } from 'react';
import { Plus, Save, X, FileText, Trash2, Edit3, ChevronDown, ArrowLeft, Play, Clock, Filter, CheckCircle, AlertTriangle, Pause, Zap, CirclePlus, User } from 'lucide-react';
import { Layout } from '@/components/layout';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { ClientLayout } from '@/components/client-layout';


const PreparateurPreparationsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [operations, setOperations] = useState<any[]>([]);
  const [currentOperation, setCurrentOperation] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // Dialogues
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionData, setCompletionData] = useState<{ operationId: number | null, conformQuantity: string, wasteReason: string }>({ operationId: null, conformQuantity: '', wasteReason: '' });
  
  // Data from API
  const [storageZones, setStorageZones] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [recipeOperations, setRecipeOperations] = useState<any[]>([]);
  const [recipeMap, setrecipeMap] = useState<any>();
  const [workStations, setWorkStations] = useState<any[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  // State for recipe details tabs
  const [activeRecipeTab, setActiveRecipeTab] = useState('ingredients');

  // Ajoute l'état pour gérer l'expansion des sous-ingrédients
  const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set());

  // Fonction pour toggle l'affichage des sous-ingrédients
  const toggleSubIngredients = (ingredientId: number) => {
    setExpandedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  // Load initial data from API
  const loadOperations = async () => {
    if (!user?.id) return;
    
    try {
      const prepRes = await apiRequest(`/api/inventory-operations?operator_id=${user.id}`, 'GET');
      const preparationsData = await prepRes.json();
      // Filtrer les brouillons
      const filteredData = (preparationsData || []).filter((op: any) => op.status !== 'draft');
      setOperations(filteredData);
    } catch (error) {
      console.error('Error loading operations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les préparations",
        variant: "destructive",
      });
    }
  };

  const loadReservations = async (operationId: number) => {
    try {
      const res = await apiRequest(`/api/inventory-operations/${operationId}/reservations`, 'GET');
      const reservationsData = await res.json();
      setReservations(reservationsData || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setReservations([]);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [zoneRes, artRes, recRes, wsRes, muRes] = await Promise.all([
          apiRequest('/api/storage-zones', 'GET'),
          apiRequest('/api/articles', 'GET'),
          apiRequest('/api/recipes', 'GET'),
          apiRequest('/api/work-stations', 'GET'),
          apiRequest('/api/measurement-units', 'GET'),
        ]);

        const zonesData = await zoneRes.json();
        const articlesData = await artRes.json();
        const recipesData = await recRes.json();
        const workStationsData = await wsRes.json();
        const measurementUnitsData = await muRes.json();

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
          
        const recipesMap = new Map(recipesData.map((r:any) => [r.articleId, r.designation]));

        setProducts(products);
        setArticles(allArticles);
        setRecipes(recipesData || []);
        setrecipeMap(recipesMap);
        setWorkStations(workStationsData || []);
        setMeasurementUnits(measurementUnitsData || []);
        
        // Load operations for current user
        await loadOperations();
        
        console.log('State updated successfully');
      } catch (error) {
        console.error('Error loading preparation page data:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des données",
          variant: "destructive",
        });
      }
    };

    loadAll();
  }, [user?.id]);

  // Load recipe details when recipe is selected
  const loadRecipeDetails = async (recipeId: number, productionQuantity?: number) => {
    try {
      console.log('🔍 Loading recipe details for recipe ID:', recipeId, 'with production quantity:', productionQuantity);
      
      const [ingredientsRes, operationsRes] = await Promise.all([
        apiRequest(`/api/recipes/${recipeId}/ingredients`, 'GET'),
        apiRequest(`/api/recipes/${recipeId}/operations`, 'GET'),
      ]);

      const ingredientsData = await ingredientsRes.json();
      const operationsData = await operationsRes.json();

      console.log('📦 Raw ingredients data:', ingredientsData);
      console.log('⚙️ Raw operations data:', operationsData);

      // Scale ingredients based on production quantity if provided
      let scaledIngredients = ingredientsData || [];
      if (productionQuantity !== undefined && ingredientsData) {
        const originalRecipe = recipes.find(r => r.id === recipeId);
        if (originalRecipe) {
          const originalQuantity = parseFloat(originalRecipe.quantity || 1);
          const ratio = productionQuantity / originalQuantity;
          
          console.log('📊 Scaling ratio:', ratio, 'original quantity:', originalQuantity, 'production quantity:', productionQuantity);
          
          scaledIngredients = ingredientsData.map((ingredient: any) => ({
            ...ingredient,
            quantity: (parseFloat(ingredient.quantity || 0) * ratio).toString()
          }));
        }
      }

      // Ajouter les recettes des sous-produits aux ingrédients pour l'affichage hiérarchique
      const enrichedIngredients = await Promise.all(
        scaledIngredients.map(async (ingredient: any) => {
          const article = articles.find(a => a.id === ingredient.articleId);
          if (article?.type === 'product') {
            // Chercher la recette du sous-produit
            const subRecipe = recipes.find(r => r.articleId === article.id);
            if (subRecipe) {
              try {
                const subIngredientsRes = await apiRequest(`/api/recipes/${subRecipe.id}/ingredients`, 'GET');
                const subIngredientsData = await subIngredientsRes.json();
                return {
                  ...ingredient,
                  subIngredients: subIngredientsData || []
                };
              } catch (error) {
                console.warn(`Failed to load sub-recipe for ${article.name}:`, error);
                return ingredient;
              }
            }
          }
          return ingredient;
        })
      );

      setRecipeIngredients(enrichedIngredients);
      setRecipeOperations(operationsData || []);
      
      console.log('✅ Recipe details loaded successfully');
      console.log('📋 Final ingredients:', enrichedIngredients);
      console.log('🔧 Final operations:', operationsData);
    } catch (error) {
      console.error('❌ Error loading recipe details:', error);
      setRecipeIngredients([]);
      setRecipeOperations([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      programmed: 'bg-blue-100 text-blue-800', 
      pending: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      draft: 'Brouillon',
      programmed: 'Programmée',
      pending: 'En attente',
      ready: 'Prête',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      preparation: 'bg-blue-100 text-blue-800',
      preparation_reliquat: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      preparation: 'Préparation',
      preparation_reliquat: 'Reliquat'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type as keyof typeof styles] || styles.preparation}`}>
        {labels[type as keyof typeof labels] || type}
      </span>
    );
  };

  const canUpdateOp = () => {
    if (!currentOperation) return false;
    return ['draft', 'pending', 'ready'].includes(currentOperation.status);
  };

  const canStartOp = () => {
    console.log(currentOperation.status)
    if (!currentOperation) return false;
    return ['programmed'].includes(currentOperation.status);
  };

  const canCompleteOp = () => {
    if (!currentOperation) return false;
    return currentOperation.status === 'in_progress';
  };

  const canCancelOp = () => {
    return false;
    if (!currentOperation) return false;
    return ['draft', 'pending', 'ready', 'in_progress'].includes(currentOperation.status);
  };

  const checkIngredientAvailability = async (recipeId: number, productionQuantity: number): Promise<boolean> => {
    try {
      const [ingredientsRes] = await Promise.all([
        apiRequest(`/api/recipes/${recipeId}/ingredients`, 'GET'),
      ]);

      const ingredientsData = await ingredientsRes.json();
      if (!ingredientsData) return false;

      const originalRecipe = recipes.find(r => r.id === recipeId);
      if (!originalRecipe) return false;

      const originalQuantity = parseFloat(originalRecipe.quantity || 1);
      const ratio = productionQuantity / originalQuantity;

      for (const ingredient of ingredientsData) {
        const stock = ingredientStocks[ingredient.articleId];
        const requiredQuantity = parseFloat(ingredient.quantity || 0) * ratio;
        const stockDispo = stock.availableStock;
        const isAlert =  stockDispo < requiredQuantity;

      
       // const availableStock = parseFloat(ingredient.article?.currentStock || 0);
        
        if (isAlert) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking ingredient availability:', error);
      return false;
    }
  };

  const selectOperation = async (operation: any) => {
    setCurrentOperation(operation);
    setIsEditing(false);
    
    // Load items for this operation
    try {
      const itemsRes = await apiRequest(`/api/inventory-operations/${operation.id}`, 'GET');
      const operationData = await itemsRes.json();
      setItems(operationData.items || []);
      
      // Load recipe details for the first item
      if (operationData.items && operationData.items.length > 0) {
        const firstItem = operationData.items[0];
        // Find recipe by article ID
        const recipe = recipes.find(r => r.articleId === firstItem.articleId);
        if (recipe) {
          console.log('Found recipe:', recipe);
          await loadRecipeDetails(recipe.id, parseFloat(firstItem.quantity));
        } else {
          console.log('No recipe found for article:', firstItem.articleId);
          setRecipeIngredients([]);
          setRecipeOperations([]);
        }
      }
      
      // Load reservations for this operation
      await loadReservations(operation.id);
    } catch (error) {
      console.error('Error loading operation items:', error);
      setItems([]);
      setRecipeIngredients([]);
      setRecipeOperations([]);
    }
  };

  const startPreparation = async () => {
    if (!currentOperation?.id) {
      toast({
        title: "Erreur",
        description: "Veuillez sauvegarder avant de lancer la préparation.",
        variant: "destructive",
      });
      return;
    }

    if (currentOperation.status === 'completed') {
      toast({
        title: "Erreur",
        description: "Impossible de lancer une opération terminée.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check all ingredients availability
      for (const item of items) {
        if (item.recipe) {
          const available = await checkIngredientAvailability(item.recipe.id, item.quantity);
          if (!available) {
            toast({
              title: "Erreur",
              description: `Ingrédients insuffisants pour ${item.article.name}`,
              variant: "destructive",
            });
            return;
          }
        }
      }

   var res=   await apiRequest(`/api/inventory-operations/${currentOperation.id}/start`, 'PATCH', { 
        status: 'in_progress',
        startedAt: new Date().toISOString()
      });
     
      
      setOperations(operations.map(op => 
        op.id === currentOperation.id ? { ...op, status: 'in_progress' } : op
      ));
      setCurrentOperation({ ...currentOperation, status: 'in_progress' });
      
      // Clear reservations when operation starts
      setReservations([]);
      
      toast({
        title: "Succès",
        description: "Préparation lancée",
      });
    } catch (error:any) {
      const message = error?.message?.split("message\":\"")[1]?.replace("\"}", "").trim();
      toast({
        title: "Erreur",
        description: message? message: "Erreur lors du lancement",
        variant: "destructive",
      });
    }
  };

  const openCompletionDialog = (operationId: number) => {
    const operation = operations.find(op => op.id === operationId);
    if (!operation) return;

    if (operation.status === 'completed') {
      toast({
        title: "Erreur",
        description: "Cette opération est déjà terminée.",
        variant: "destructive",
      });
      return;
    }

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
    if (!completionData.operationId) return;
    
    try {
      const conformQuantity = parseFloat(completionData.conformQuantity);
      const operation = operations.find(op => op.id === completionData.operationId);
      
      if (!operation) return;

      const totalPlanned = (operation.items || []).reduce((sum: number, item: any) => 
        sum + parseFloat(item.quantity || 0), 0);

      console.log('🔍 Completion data:', {
        conformQuantity,
        totalPlanned,
        wasteQuantity: totalPlanned - conformQuantity,
        items: operation.items
      });

      // 1. Utiliser l'endpoint de completion qui gère automatiquement la mise à jour des stocks
      await apiRequest(`/api/inventory-operations/${completionData.operationId}/complete`, 'PATCH', { 
        status: 'completed',
        completedAt: new Date().toISOString(),
        conformQuantity: conformQuantity.toString(),
        wasteReason: completionData.wasteReason || ''
      });

      // 3. Le backend gère automatiquement la création de l'opération de rebut si nécessaire
      console.log(`✅ Preparation completed. Conform quantity: ${conformQuantity}, Planned: ${totalPlanned}`);
      
      // 4. Mettre à jour l'état local
      setOperations(operations.map(op => 
        op.id === completionData.operationId ? { ...op, status: 'completed' } : op
      ));
      
      if (currentOperation?.id === completionData.operationId) {
        setCurrentOperation({ ...currentOperation, status: 'completed' });
        // Clear reservations when operation is completed
        setReservations([]);
      }
      
      setShowCompletionDialog(false);
      setCompletionData({ operationId: null, conformQuantity: '', wasteReason: '' });
      
      // 5. Recharger les données pour avoir les stocks à jour
      await loadOperations();
      
      toast({
        title: "Succès",
        description: `Préparation terminée avec succès. Quantité conforme: ${conformQuantity}, Rebut: ${totalPlanned - conformQuantity}`,
      });
    } catch (e) {
      console.error('Failed to complete preparation', e);
      toast({
        title: "Erreur",
        description: "Erreur lors de la finalisation",
        variant: "destructive",
      });
    }
  };

  const completeOperation = async () => {
    if (!currentOperation?.id) return;
    
    if (currentOperation.status === 'completed') {
      toast({
        title: "Erreur",
        description: "Cette opération est déjà terminée.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest(`/api/inventory-operations/${currentOperation.id}`, 'PATCH', { 
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      setOperations(operations.map(op => 
        op.id === currentOperation.id ? { ...op, status: 'completed' } : op
      ));
      setCurrentOperation({ ...currentOperation, status: 'completed' });
      
      // Clear reservations when operation is completed
      setReservations([]);
      
      toast({
        title: "Succès",
        description: "Préparation terminée",
      });
    } catch (e) {
      console.error('Failed to complete preparation', e);
      toast({
        title: "Erreur",
        description: "Erreur lors de la finalisation",
        variant: "destructive",
      });
    }
  };

  const cancelOperation = async () => {
    if (!currentOperation?.id) return;
    
    if (currentOperation.status === 'completed') {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler une opération terminée.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest(`/api/inventory-operations/${currentOperation.id}`, 'PATCH', { 
        status: 'cancelled' 
      });
      
      setOperations(operations.map(op => 
        op.id === currentOperation.id ? { ...op, status: 'cancelled' } : op
      ));
      setCurrentOperation({ ...currentOperation, status: 'cancelled' });
      
      // Clear reservations when operation is cancelled
      setReservations([]);
      
      toast({
        title: "Succès",
        description: "Opération annulée",
      });
    } catch (e) {
      console.error('Failed to cancel preparation', e);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'annulation",
        variant: "destructive",
      });
    }
  };

  // Filter operations with hierarchy support
  const getFilteredOperations = () => {
    let filtered = operations;

    if (searchTerm) {
      filtered = filtered.filter(op => 
        op.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.items?.some((item: any) => 
          item.article?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(op => op.status === filterStatus);
    }

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
          break;
      }
    }

    return filtered;
  };

  // Fonction pour obtenir les informations d'une unité de mesure
  const getMeasurementUnit = (unit: string) => {
    return measurementUnits.find(u => u.abbreviation === unit);
  };

  // Fonction pour obtenir une description lisible de la conversion
  const getConversionDescription = (fromUnit: string, toUnit: string): string => {
    const fromUnitData = getMeasurementUnit(fromUnit);
    const toUnitData = getMeasurementUnit(toUnit);
    
    if (!fromUnitData || !toUnitData) {
      return `${fromUnit}→${toUnit}`;
    }
    
    if (fromUnit === toUnit) {
      return `${fromUnit}`;
    }
    
    const fromFactor = parseFloat(fromUnitData.factor);
    const toFactor = parseFloat(toUnitData.factor);
    
    if (fromUnitData.type === 'reference' && toUnitData.type === 'smaller') {
      return `${fromUnit}→${toUnit} (×${(1/toFactor).toFixed(0)})`;
    } else if (fromUnitData.type === 'smaller' && toUnitData.type === 'reference') {
      return `${fromUnit}→${toUnit} (÷${(1/fromFactor).toFixed(0)})`;
    } else if (fromUnitData.type === 'reference' && toUnitData.type === 'larger') {
      return `${fromUnit}→${toUnit} (÷${toFactor.toFixed(0)})`;
    } else if (fromUnitData.type === 'larger' && toUnitData.type === 'reference') {
      return `${fromUnit}→${toUnit} (×${fromFactor.toFixed(0)})`;
    } else {
      return `${fromUnit}→${toUnit}`;
    }
  };

  // Fonction pour obtenir le facteur de conversion d'une unité
  const getUnitConversionFactor = (unit: string): number => {
    const measurementUnit = getMeasurementUnit(unit);
    return measurementUnit ? parseFloat(measurementUnit.factor) : 1;
  };

  const convertCost = (cost: number, fromUnit: string, toUnit: string): number => {
    const fromUnitData = getMeasurementUnit(fromUnit);
    const toUnitData = getMeasurementUnit(toUnit);
  
    if (!fromUnitData || !toUnitData) {
      console.warn(`Unit not found: fromUnit=${fromUnit}, toUnit=${toUnit}`);
      return cost;
    }
  
    if (fromUnit === toUnit) return cost;
  
    const fromFactor = parseFloat(fromUnitData.factor);
    const toFactor = parseFloat(toUnitData.factor);
  
    if (fromFactor <= 0 || toFactor <= 0) {
      console.warn(`Invalid factor: fromFactor=${fromFactor}, toFactor=${toFactor}`);
      return cost;
    }
  
    let conversionFactor = 1;
  
    // Logique en fonction du type
    if (fromUnitData.type === "reference") {
      conversionFactor = (toUnitData.type === "smaller")
        ? 1 / toFactor
        : (toUnitData.type === "larger")
          ? toFactor
          : 1;
    }
    else if (toUnitData.type === "reference") {
      conversionFactor = (fromUnitData.type === "smaller")
        ? toFactor
        : (fromUnitData.type === "larger")
          ? 1 / fromFactor
          : 1;
    }
    else if (fromUnitData.type === "smaller" && toUnitData.type === "larger") {
      conversionFactor = toFactor / fromFactor; // plus grande baisse de prix
    }
    else if (fromUnitData.type === "larger" && toUnitData.type === "smaller") {
      conversionFactor = 1 / (fromFactor / toFactor); // forte hausse de prix
    }
    else {
      // fallback
      conversionFactor = toFactor / fromFactor;
    }
  
    const result = cost * conversionFactor;
    console.log(`Converting ${cost} from ${fromUnit} (${fromUnitData.type}, factor=${fromFactor}) to ${toUnit} (${toUnitData.type}, factor=${toFactor}) = ${result}`);
    return result;
  };

  // Fonction récursive pour calculer le coût d'un sous-produit basé sur ses ingrédients (incluant les sous-sous-produits)
  const calculateSubProductCost = (subIngredients: any[], subProductQuantity: number): number => {
    return subIngredients.reduce((totalCost, subIngredient) => {
      const subArticle = articles.find(a => a.id === subIngredient.articleId);
      const subIngredientQuantity = parseFloat(subIngredient.quantity || '0');
      
      // Multiplier la quantité du sous-ingrédient par la quantité du sous-produit dans la recette
      const adjustedQuantity = subIngredientQuantity * subProductQuantity;
      
      if (subArticle?.type === 'product') {
        // Si c'est un sous-sous-produit, calculer récursivement son coût
        const subSubRecipe = recipes.find(r => r.articleId === subArticle.id);
        if (subSubRecipe && Array.isArray(subSubRecipe.ingredients)) {
          const subSubIngredients = subSubRecipe.ingredients || [];
          const subSubProductCost = calculateSubProductCost(subSubIngredients, adjustedQuantity);
          console.log(`Sub-sub-product cost: ${subArticle?.name} - ${subSubProductCost} (recursive calculation)`);
          return totalCost + subSubProductCost;
        }
      }
      
      // Pour un ingrédient normal, convertir le coût selon les unités
      const subArticleCost = parseFloat(subArticle?.costPerUnit || '0');
      const convertedCost = convertCost(subArticleCost, subArticle?.unit || 'kg', subIngredient.unit || 'kg');
      
      const ingredientCost = convertedCost * adjustedQuantity;
      console.log(`Sub-ingredient cost: ${subArticle?.name} - ${subArticleCost} ${subArticle?.unit} → ${convertedCost} ${subIngredient.unit} × ${adjustedQuantity} (${subIngredientQuantity} × ${subProductQuantity}) = ${ingredientCost}`);
      
      return totalCost + ingredientCost;
    }, 0);
  };

  // Fonction pour calculer le coût total de la recette (récursivement)
  const calculateTotalRecipeCost = (ingredientsList: any[]): number => {
    return ingredientsList.reduce((totalCost, ingredient) => {
      const article = articles.find(a => a.id === ingredient.articleId);
      
      if (article?.type === 'product') {
        // Pour un sous-produit, calculer le coût basé sur ses ingrédients (récursivement)
        const subRecipe = recipes.find(r => r.articleId === article.id);
        if (subRecipe && Array.isArray(subRecipe.ingredients)) {
          const subIngredients = subRecipe.ingredients || [];
          const subProductQuantity = parseFloat(ingredient.quantity || '0');
          const subProductCost = calculateSubProductCost(subIngredients, subProductQuantity);
          console.log(`Sub-product total cost: ${article?.name} - ${subProductCost} (recursive calculation)`);
          return totalCost + subProductCost;
        }
      }
      
      // Pour un ingrédient normal, convertir le coût selon l'unité de la recette
      const originalCost = parseFloat(article?.costPerUnit || '0');
      const unitCost = convertCost(originalCost, article?.unit || 'kg', ingredient.unit || 'kg');
      const ingredientCost = unitCost * parseFloat(ingredient.quantity || '0');
      console.log(`Ingredient cost: ${article?.name} - ${ingredientCost}`);
      
      return totalCost + ingredientCost;
    }, 0);
  };

  // Ajout utilitaire pour charger les stocks de tous les articles d'une recette
  async function fetchStockDetails(articleIds: number[]): Promise<Record<number, any>> {
    const results: Record<number, any> = {};
    await Promise.all(articleIds.map(async (id) => {
      const res = await apiRequest(`/api/articles/${id}/stock-details`, 'GET');
      if (res.ok) {
        results[id] = await res.json();
      }
    }));
    return results;
  }

  const [ingredientStocks, setIngredientStocks] = useState<Record<number, any>>({});

  useEffect(() => {
    if (!recipeIngredients || recipeIngredients.length === 0) return;
    const articleIds = recipeIngredients.map((ing: any) => ing.articleId);
    fetchStockDetails(articleIds).then(setIngredientStocks);
  }, [recipeIngredients]);

  // Fonction récursive pour afficher les ingrédients et sous-ingrédients (multi-niveaux)
  const renderIngredientsRecursive = (ingredientsList: any[], level = 0, expandedSet: Set<number>, toggleFn: (id: number) => void): React.ReactNode[] => {
    if (!ingredientsList || ingredientsList.length === 0 || level > 5) return []; // Augmenté à 5 niveaux pour supporter plus de profondeur
    return ingredientsList.flatMap((ingredient, index) => {
      const article = articles.find(a => a.id === ingredient.articleId);
      const stockDispo = article?.currentStock || 0;
      
      // Chercher la recette du sous-produit si c'est un produit
      let subRecipe = null;
      let subIngredients: any[] = [];
      if (article?.type === 'product') {
        subRecipe = recipes.find(r => r.articleId === article.id);
        if (subRecipe && Array.isArray(subRecipe.ingredients)) {
          subIngredients = subRecipe.ingredients || [];
        }
      }
      
      // Calculer le coût approprié avec conversion d'unités
      let displayCost = 0;
      let unitCost = 0;
      
      if (article?.type === 'product' && subRecipe && subIngredients.length > 0) {
        // Pour un sous-produit, calculer le coût basé sur ses ingrédients
        const subProductQuantity = parseFloat(ingredient.quantity || '0');
        unitCost = calculateSubProductCost(subIngredients, subProductQuantity);
        displayCost = unitCost; // Le coût total est déjà calculé avec la quantité
      } else {
        // Pour un ingrédient normal, convertir le coût selon l'unité de la recette
        const originalCost = parseFloat(article?.costPerUnit || '0');
        unitCost = convertCost(originalCost, article?.unit || 'kg', ingredient.unit || 'kg');
        displayCost = unitCost * parseFloat(ingredient.quantity || '0');
      }
      
      const hasSubIngredients = article?.type === 'product' && subRecipe && subIngredients.length > 0;
      const isExpanded = expandedSet.has(ingredient.id);
      
      return [
        <tr key={ingredient.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
          <td className="px-3 py-2 text-xs text-gray-600">
            {article?.type === 'ingredient' ? 'Ingrédient' : 'Produit'}
          </td>
          <td className="px-3 py-2 text-xs font-medium text-gray-800" style={{paddingLeft: `${level * 24}px`}}>
            <div className="flex items-center">
              {level > 0 && <span className="text-gray-400 mr-1">{Array(level).fill('—').join('')}</span>}
              {article?.name || 'Article inconnu'}
              {hasSubIngredients && (
                <button
                  onClick={() => toggleFn(ingredient.id)}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  title={isExpanded ? "Masquer les sous-ingrédients" : "Afficher les sous-ingrédients"}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-gray-500 transform rotate-[-90deg]" />
                  )}
                </button>
              )}
            </div>
          </td>
          <td className="px-3 py-2 text-center text-xs text-gray-600">
            {article?.costPerUnit}DA/{article?.unit}
            {hasSubIngredients && (
              <div className="text-xs text-gray-400">(calculé)</div>
            )}
            {!hasSubIngredients && article?.unit !== ingredient.unit && (
              <div className="text-xs text-gray-400">
                {unitCost.toFixed(3)} /{ ingredient.unit}
              </div>
            )}
          </td>
          <td className="px-3 py-2 text-center text-xs font-semibold">
            {parseFloat(ingredient.quantity).toFixed(3)}
          </td>
          <td className="px-3 py-2 text-center text-xs text-gray-600">
            {ingredient.unit}
          </td>
          <td className="px-3 py-2 text-center text-xs font-semibold text-green-600">
            {displayCost.toFixed(2)}
          </td>
          <td className="px-3 py-2 text-center text-xs">
            {(() => {
              const stock = ingredientStocks[ingredient.articleId];
              if (!stock) return <span className="text-gray-400">-</span>;
              return <span>{stock.totalStock}</span>;
            })()}
          </td>
          <td className="px-3 py-2 text-center text-xs">
            {(() => {
              const stock = ingredientStocks[ingredient.articleId];
              const article = articles.find(a => a.id === ingredient.articleId);
              if (!stock) return <span className="text-gray-400">-</span>;
            //  const isSubProduct = article?.type === "product" || article?.type === "semi-fini";
              const required = parseFloat(ingredient.quantity || "0");
              const stockDispo = stock.availableStock;
              const isAlert =  stockDispo < required;
              return (
                <span className={isAlert ? "text-red-600 font-bold" : ""}>
                  {stockDispo?.toFixed(3)}
                </span>
              );
            })()}
          </td>
        </tr>,
        // Affichage récursif des sous-ingrédients seulement si expandé
        (hasSubIngredients && isExpanded)
          ? renderIngredientsRecursive(
              subIngredients.map(subIng => ({
                ...subIng,
                quantity: (parseFloat(subIng.quantity || '0') * parseFloat(ingredient.quantity || '0')).toString()
              })), 
              level + 1, 
              expandedSet, 
              toggleFn
            )
          : null
      ];
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Accès non autorisé</h1>
            <p className="text-gray-600 mt-2">Vous devez être connecté pour accéder à cette page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ClientLayout title='Mes Préparations'>
      <div className="p-4">
    

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Operations List */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Mes Préparations Assignées</h2>
                
                {/* Filters */}
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="ready">Prête</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>

                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="yesterday">Hier</option>
                    <option value="tomorrow">Demain</option>
                  </select>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {getFilteredOperations().length > 0 ? (
                  getFilteredOperations().map((operation) => (
                    <div
                      key={operation.id}
                      onClick={() => selectOperation(operation)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        currentOperation?.id === operation.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">{operation.code}</span>
                        {getStatusBadge(operation.status)}
                      </div>
                      
                      {/* Affichage des produits et quantités */}
                      {operation.items && operation.items.length > 0 && (
                        <div className="text-xs text-gray-600 mb-1">
                          {operation.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between">
                                                             <span>{item.article?.name || 'Article inconnu'}</span>
                               <span>{item.quantity} {item.article?.unit || ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {operation.scheduledDate ? new Date(operation.scheduledDate).toLocaleDateString('fr-FR') : 'Non programmée'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Aucune préparation assignée</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Operation Details */}
          <div className="md:col-span-3">
            {currentOperation ? (
              <div className="space-y-4">
                {/* Operation Header */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{currentOperation.code}</h3>
                        <p className="text-sm text-gray-600">{currentOperation.notes || 'Aucune note'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTypeBadge(currentOperation.type)}
                        {getStatusBadge(currentOperation.status)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Date programmée:</span>
                        <span className="ml-2 text-gray-600">
                          {currentOperation.scheduledDate ? new Date(currentOperation.scheduledDate).toLocaleDateString('fr-FR') : 'Non programmée'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date de début:</span>
                        <span className="ml-2 text-gray-600">
                          {currentOperation.startedAt ? new Date(currentOperation.startedAt).toLocaleDateString('fr-FR') : 'Non démarrée'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date de fin:</span>
                        <span className="ml-2 text-gray-600">
                          {currentOperation.completedAt ? new Date(currentOperation.completedAt).toLocaleDateString('fr-FR') : 'Non terminée'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Articles:</span>
                        <span className="ml-2 text-gray-600">{items.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4">
                    <div className="flex items-center justify-end space-x-3">
                      {canStartOp() && (
                        <button
                          onClick={startPreparation}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Lancer la préparation</span>
                        </button>
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

                      {canCancelOp() && (
                        <button
                          onClick={cancelOperation}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Annuler</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>



                                 {/* Recipe Details */}
                 {items.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border">
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
                         <div>
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
                                   <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Stock réel</th>
                                   <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Stock dispo</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {recipeIngredients.length > 0 ? renderIngredientsRecursive(recipeIngredients, 0, expandedIngredients, toggleSubIngredients) : (
                                   <tr className="bg-gray-50">
                                     <td className="px-3 py-2 text-xs text-gray-600" colSpan={8}>
                                       <em>Aucune recette trouvée pour cet article ou chargement en cours...</em>
                                     </td>
                                   </tr>
                                 )}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       )}

                      {/* Operations Tab */}
                      {activeRecipeTab === 'operations' && (
                        <div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-100 border-b">
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Ordre</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Opération</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Durée (min)</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Poste de travail</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Température</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                                                 {recipeOperations.length > 0 ? (
                                   recipeOperations.map((operation, index) => (
                                     <tr key={operation.id} className="border-b hover:bg-gray-50">
                                       <td className="px-3 py-2 text-center text-xs text-gray-600">
                                         {operation.order || index + 1}
                                       </td>
                                       <td className="px-3 py-2 text-xs text-gray-900">
                                         {operation.description || '-'}
                                       </td>
                                       <td className="px-3 py-2 text-center text-xs text-gray-600">
                                         {operation.duration || '-'}
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
                                       <em>Aucune opération définie pour cette recette ou chargement en cours...</em>
                                     </td>
                                   </tr>
                                 )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune préparation sélectionnée</h3>
                <p className="text-gray-600">Sélectionnez une préparation dans la liste pour voir les détails</p>
              </div>
            )}
          </div>
        </div>

        {/* Completion Dialog */}
        {showCompletionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-2">
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
    </ClientLayout>
  );
};

export default PreparateurPreparationsPage;
