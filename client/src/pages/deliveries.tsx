import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  FileText,
  Edit3,
  Trash2,
  Package,
  Truck,
  ArrowLeft,
  Eye,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Plus,
  CreditCard,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type {
  InventoryOperation,
  InventoryOperationItem,
  Client,
  Order,
  Article
} from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DeliverySplitModal } from "@/components/delivery-split-modal";
import { CancellationDetails } from '@/components/delivery-cancellation-details';
import { CancellationModal } from '@/pages/delivery-cancellations';
import { DeliveryPaymentDetails } from "@/components/delivery-payment-details";
import { DeliveryAssignmentModal } from "@/components/delivery-assignment-modal";
import { DeliveryPackagesModal } from "@/components/delivery-packages-modal";
import { DeliveryTrackingModal } from "@/components/delivery-tracking-modal";
import { DeliveryPaymentModal } from "@/components/delivery-payment-modal";

export default function DeliveriesPage() {
  usePageTitle("Livraisons");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer le paramètre orderId de l'URL
  const [orderId, setOrderId] = useState<number | null>(null);

  // States
  const [currentDelivery, setCurrentDelivery] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [splitModal, setSplitModal] = useState<{ open: boolean, articleId: number | null }>({ open: false, articleId: null });
  const [splits, setSplits] = useState<Record<number, Array<{ lotId: number | null, fromStorageZoneId: number | null, quantity: number }>>>({});
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [inventoryOperations, setInventoryOperations] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  // Nouveaux modals
  const [assignmentModal, setAssignmentModal] = useState<{ open: boolean, delivery: any }>({ open: false, delivery: null });
  const [packagesModal, setPackagesModal] = useState<{ open: boolean, delivery: any }>({ open: false, delivery: null });
  const [trackingModal, setTrackingModal] = useState<{ open: boolean, delivery: any }>({ open: false, delivery: null });
  const [paymentModal, setPaymentModal] = useState<{ open: boolean, delivery: any }>({ open: false, delivery: null });

  const [orderIdFilter, setOrderIdFilter] = useState<string>('all');
  const [clientIdFilter, setClientIdFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Ajout de l'état pour l'article dont le split est affiché
  const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null);


  // Récupérer le paramètre orderId de l'URL au chargement de la page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');
    if (orderIdParam) {
      setOrderId(parseInt(orderIdParam));
    }
  }, []);



  // Query optimisée - récupère toutes les données nécessaires en un seul appel
  const { data: pageData, isLoading: deliveriesLoading } = useQuery<{
    deliveries: any[];
    clients: any[];
    orders: Order[];
    articles: Article[];
  }>({
    queryKey: ["/api/deliveries/page-data", { orderId }],
    queryFn: async () => {
      let url = "/api/deliveries/page-data";
      if (orderId) {
        url += `?orderId=${orderId}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch deliveries page data");
      const data = await response.json();

      // Adapter la structure des livraisons pour la compatibilité
      const adaptedDeliveries = data.deliveries.map((d: any) => ({
        ...d,
        scheduledDate: d.deliveryDate || d.scheduledDate, // compatibilité
        notes: d.notes,
        orderId: d.orderId,
        clientId: d.clientId,
        code: d.code,
        totalTTC: d.totalTTC,
        status: d.status,
        items: d.items,
        // autres champs si besoin
      }));

      setInventoryOperations(adaptedDeliveries);

      return {
        deliveries: adaptedDeliveries,
        clients: data.clients,
        orders: data.orders,
        articles: data.articles
      };
    },
    enabled: true,
  });

  // Extraire les données de la réponse
  const deliveries = pageData?.deliveries || [];
  const clients = pageData?.clients || [];
  const orders = pageData?.orders || [];
  const articles = pageData?.articles || [];

  // Récupérer les détails de commande depuis la liste orders
  const currentOrder = orderId ? orders.find(o => o.id === orderId) : null;
  const orderDetails = (currentOrder as any)?.deliveryDetails;

  // Extraire les données de la commande
  const orderData = currentOrder ? {
    id: currentOrder.id,
    code: currentOrder.code,
    clientId: currentOrder.clientId,
    totalTTC: currentOrder.totalTTC,
    createdAt: currentOrder.createdAt,
    deliveryDate: currentOrder.deliveryDate,
    notes: currentOrder.notes
  } : null;

  const orderItems = orderDetails?.items || [];

  // Mutations
  // Adaptation de la mutation création
  const createDeliveryMutation = useMutation({
    mutationFn: async (data: any) => {
      // Adapter le payload pour l'API backend
      const payload = {
        deliveryDate: data.deliveryDate,
        note: data.note,
        orderId: data.orderId,
        items: data.items.map((item: any) => ({
          idArticle: item.idArticle,
          idzone: item.idzone,
          idlot: item.idlot,
          qteLivree: item.qteLivree,
        })),
      };
      return await apiRequest("/api/deliveries", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
      toast({
        title: "Livraison créée",
        description: "La livraison a été créée avec succès"
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création",
        variant: "destructive"
      });
    },
  });

  // Adaptation de la mutation modification
  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const payload = {
        deliveryDate: data.deliveryDate,
        note: data.note,
        orderId: data.orderId,
        items: data.items.map((item: any) => ({
          idArticle: item.idArticle,
          idzone: item.idzone,
          idlot: item.idlot,
          qteLivree: item.qteLivree,
        })),
      };
      return await apiRequest(`/api/deliveries/${id}`, "PUT", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
      toast({
        title: "Livraison mise à jour",
        description: "La livraison a été modifiée avec succès"
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modification",
        variant: "destructive"
      });
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/deliveries/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
      toast({
        title: "Livraison supprimée",
        description: "La livraison a été supprimée avec succès"
      });
    },
    onError: (error: any) => {
      console.error("Erreur suppression livraison:", error);
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer cette livraison",
        variant: "destructive"
      });
    },
  });



  // Helper functions
  const resetForm = () => {
    setCurrentDelivery(null);
    setItems([]);
    setIsEditing(false);
    setIsViewing(false);
    setShowForm(false);
  };

  const startNewDelivery = () => {
    if (orderId && orderData && orderDetails) {
      // Si on a un orderId, pré-remplir avec les données de la commande
      setCurrentDelivery({
        type: "delivery",
        status: "draft",
        clientId: orderData.clientId,
        orderId: orderId,
        scheduledDate: new Date().toISOString().split('T')[0],
        notes: `Livraison pour la commande ${orderData.code}`,
        currency: "DZD",
        // Ne plus initialiser les totaux - ils seront calculés côté serveur
      });

      // Pré-remplir avec les articles de la commande (exclure ceux avec quantité restante 0)
      const newItems = orderDetails.items
        .filter((item: any) => item.quantityRemaining > 0)
        .map((item: any) => ({
          id: Date.now() + Math.random(), // Nouvel ID temporaire
          articleId: item.articleId,
          article: articles.find(a => a.id === item.articleId), // Récupérer depuis la liste articles
          quantity: item.quantityRemaining, // Utiliser la quantité restante
          // Ne plus gérer unitPrice et totalPrice côté client
          notes: "",
        }));

      setItems(newItems);

      // Créer automatiquement les répartitions pour les cas simples
      const newSplits: Record<number, Array<{ lotId: number | null, fromStorageZoneId: number | null, quantity: number }>> = {};
      
      newItems.forEach((item: any) => {
        const articleId = item.articleId;
        const quantity = item.quantity;
        
        // Si pas de répartition nécessaire, créer automatiquement
        if (!isSplitRequired(articleId, quantity)) {
          const autoSplit = createAutoSplit(articleId, quantity);
          if (autoSplit) {
            newSplits[articleId] = autoSplit;
          }
        }
      });

      setSplits(newSplits);
    } else {
      // Formulaire vide normal
      setCurrentDelivery({
        type: "delivery",
        status: "draft",
        clientId: null,
        orderId: null,
        scheduledDate: new Date().toISOString().split('T')[0],
        notes: "",
        currency: "DZD",
        // Ne plus initialiser les totaux - ils seront calculés côté serveur
      });
      setItems([]);
      setSplits({});
    }
    setIsEditing(true);
    setIsViewing(false);
    setShowForm(true);
  };

  const editDelivery = (delivery: InventoryOperation) => {
    setCurrentDelivery(delivery);
    // Charger les items de la livraison
    loadDeliveryItems(delivery.id);
    setIsEditing(true);
    setIsViewing(false);
    setShowForm(true);
  };

  const viewDelivery = (delivery: InventoryOperation) => {
    setCurrentDelivery(delivery);
    loadDeliveryItems(delivery.id);
    setIsEditing(false);
    setIsViewing(true);
    setShowForm(true);
  };

  const loadDeliveryItems = async (deliveryId: number) => {
    try {
      const response = await fetch(`/api/inventory-operations/${deliveryId}/items`);
      if (!response.ok) throw new Error("Failed to fetch delivery items");
      const deliveryItems = await response.json();

      setItems(deliveryItems.map((item: any) => ({
        id: item.id,
        articleId: item.articleId,
        article: articles.find(a => a.id === item.articleId), // Récupérer depuis la liste articles
        quantity: parseFloat(item.quantity),
        // Ne plus gérer unitPrice et totalPrice côté client
        notes: item.notes || "",
      })));
    } catch (error) {
      console.error("Erreur lors du chargement des articles:", error);
    }
  };



  const updateItemQuantity = (itemId: number | string, quantity: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        // Vérifier les limites avant de mettre à jour
        const orderItem = orderDetails?.items.find((oi: any) => oi.articleId === item.articleId);
        if (orderItem) {
          const remainingQuantity = orderItem.quantityRemaining;
          const orderedQuantity = orderItem.quantityOrdered;

          // Ne pas dépasser la quantité restante ni la quantité commandée
          const finalQuantity = Math.min(quantity, remainingQuantity, orderedQuantity);

          // Si la quantité change et est différente de la quantité déjà répartie, réinitialiser la répartition
          const currentSplitSum = getSplitSum(item.articleId);
          if (Math.abs(currentSplitSum - finalQuantity) > 0.001) {
            // Supprimer l'ancienne répartition
            const newSplits = { ...splits };
            delete newSplits[item.articleId];
            setSplits(newSplits);

            // Si pas de répartition nécessaire, créer automatiquement
            if (!isSplitRequired(item.articleId, finalQuantity)) {
              const autoSplit = createAutoSplit(item.articleId, finalQuantity);
              if (autoSplit) {
                setSplits(prev => ({
                  ...prev,
                  [item.articleId]: autoSplit
                }));
              }
            }
          }

          return {
            ...item,
            quantity: finalQuantity
            // Ne plus calculer totalPrice côté client
          };
        }
      }
      return item;
    }));
  };





  // Cette fonction n'est plus utilisée car les totaux sont calculés côté serveur
  // const calculateTotals = () => {
  //   const subtotalHT = items.reduce((sum, item) => sum + item.totalPrice, 0);
  //   const totalTax = subtotalHT * 0.19; // TVA 19%
  //   const totalTTC = subtotalHT + totalTax;
  //   return { subtotalHT, totalTax, totalTTC };
  // };

  const saveDelivery = async () => {
    // Vérifications de base
    if (!currentDelivery.clientId) {
      toast({
        title: "Client requis",
        description: "Veuillez sélectionner un client",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Articles requis",
        description: "Veuillez ajouter au moins un article",
        variant: "destructive"
      });
      return;
    }

    // Vérifier que les quantités ne dépassent pas les limites de commande
    for (const item of items) {
      const orderItem = orderDetails?.items.find((oi: any) => oi.articleId === item.articleId);
      if (orderItem) {
        const remainingQuantity = orderItem.quantityRemaining;
        const orderedQuantity = orderItem.quantityOrdered;

        if (item.quantity > remainingQuantity) {
          toast({
            title: "Quantité invalide",
            description: `La quantité pour ${item.article?.name} dépasse la quantité restante (${remainingQuantity})`,
            variant: "destructive"
          });
          return;
        }

        if (item.quantity > orderedQuantity) {
          toast({
            title: "Quantité invalide",
            description: `La quantité pour ${item.article?.name} dépasse la quantité commandée (${orderedQuantity})`,
            variant: "destructive"
          });
          return;
        }
      }
    }

    // Traiter chaque article selon les règles de répartition
    const allItems: any[] = [];
    
    for (const item of items) {
      const articleId = item.articleId;
      const quantity = item.quantity;
      const isPerishable = isArticlePerishable(articleId);
      const zones = getArticleZones(articleId);
      const lots = getArticleLots(articleId);

      // Règle 1: Si quantité = 0, pas besoin de répartir
      if (quantity === 0) {
        continue;
      }

      // Règle 2: Si périssable et pas de lot, erreur
      if (isPerishable && lots.length === 0) {
        toast({
          title: "Article périssable sans lot",
          description: `L'article ${item.article?.name} est périssable mais aucun lot n'est disponible. Impossible de sauvegarder.`,
          variant: "destructive"
        });
        return;
      }

      // Règle 3: Si une seule zone et un seul lot, créer automatiquement la répartition
      if (zones.length === 1 && lots.length <= 1) {
        const autoSplit = createAutoSplit(articleId, quantity);
        if (autoSplit) {
          allItems.push({
            idArticle: articleId,
            qteLivree: autoSplit[0].quantity.toString(),
            idlot: autoSplit[0].lotId,
            idzone: autoSplit[0].fromStorageZoneId,
          });
          continue;
        }
      }

      // Règle 4: Si plus d'une zone ou plus d'un lot, répartition obligatoire
      const split = splits[articleId];
      if (!split || split.length === 0) {
        toast({
          title: "Répartition obligatoire",
          description: `Veuillez répartir la quantité pour l'article ${item.article?.name} (plusieurs zones ou lots disponibles)`,
          variant: "destructive"
        });
        return;
      }

      // Règle 5: Vérifier que la quantité répartie = quantité à livrer
      const splitSum = getSplitSum(articleId);
      if (Math.abs(splitSum - quantity) > 0.001) {
        toast({
          title: "Quantité répartie incorrecte",
          description: `La quantité répartie (${splitSum}) doit être égale à la quantité à livrer (${quantity}) pour ${item.article?.name}`,
          variant: "destructive"
        });
        return;
      }

      // Règle 6: Vérifier les doublons de combinaisons
      if (hasDuplicateCombinations(split)) {
        toast({
          title: "Combinaisons dupliquées",
          description: `Vous ne pouvez pas utiliser la même combinaison zone/lot plusieurs fois pour ${item.article?.name}`,
          variant: "destructive"
        });
        return;
      }

      // Règle 7: Valider chaque split individuellement
      for (const splitItem of split) {
        const validation = validateSplit(articleId, splitItem);
        if (!validation.valid) {
          toast({
            title: "Erreur de répartition",
            description: `${item.article?.name}: ${validation.error}`,
            variant: "destructive"
          });
          return;
        }

        allItems.push({
          idArticle: articleId,
          qteLivree: splitItem.quantity.toString(),
          idlot: splitItem.lotId,
          idzone: splitItem.fromStorageZoneId,
        });
      }
    }

    const payload = {
      deliveryDate: currentDelivery.scheduledDate || null,
      note: currentDelivery.notes || null,
      orderId: currentDelivery.orderId,
      items: allItems,
    };

    if (currentDelivery.id) {
      updateDeliveryMutation.mutate({ id: currentDelivery.id, data: payload });
    } else {
      createDeliveryMutation.mutate(payload);
    }
  };

  const getClientName = (clientId: number) => {
    const client = pageData?.clients.find(c => c.id === clientId);
    if (!client) return "Client inconnu";
    return client.name;
  };

  const getOrderCode = (orderId: number | null) => {
    if (!orderId) return "-";
    const order = pageData?.orders.find(o => o.id === orderId);
    return order ? order.code : `CMD-${orderId}`;
  };



  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Brouillon" },
      pending: { variant: "default" as const, label: "En attente" },
      ready: { variant: "default" as const, label: "Prêt" },
      completed: { variant: "default" as const, label: "Livré" },
      cancelled: { variant: "destructive" as const, label: "Annulé" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] ||
      { variant: "outline" as const, label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // Fonction utilitaire pour calculer la somme répartie pour un article
  const getSplitSum = (articleId: number) => (splits[articleId] || []).reduce((sum, s) => sum + (s.quantity || 0), 0);

  // Fonction pour obtenir les informations de stock d'un article depuis pageData
  const getArticleStockInfo = (articleId: number) => {
    const article = articles.find(a => a.id === articleId);
    return (article as any)?.stockInfo || [];
  };

  // Fonction pour vérifier si un article est périssable
  const isArticlePerishable = (articleId: number) => {
    const article = articles.find(a => a.id === articleId);
    return (article as any)?.isPerishable || false;
  };

  // Fonction pour obtenir les zones uniques d'un article
  const getArticleZones = (articleId: number) => {
    const stockInfo = getArticleStockInfo(articleId);
    const zones = new Map();
    stockInfo.forEach((stock: any) => {
      const zoneId = stock.storageZoneId || stock.storageZone?.id;
      if (zoneId && stock.storageZone) {
        zones.set(zoneId, stock.storageZone);
      }
    });
    return Array.from(zones.values());
  };

  // Fonction pour obtenir les lots uniques d'un article
  const getArticleLots = (articleId: number) => {
    const stockInfo = getArticleStockInfo(articleId);
    const lots = new Map();
    stockInfo.forEach((stock: any) => {
      const lotId = stock.lotId || stock.lot?.id;
      if (lotId && stock.lot) {
        lots.set(lotId, stock.lot);
      }
    });
    return Array.from(lots.values());
  };

  // Fonction pour vérifier si la répartition est nécessaire
  const isSplitRequired = (articleId: number, quantity: number) => {
    // Si quantité = 0, pas besoin de répartir
    if (quantity === 0) return false;

    const zones = getArticleZones(articleId);
    const lots = getArticleLots(articleId);
    const isPerishable = isArticlePerishable(articleId);

    // Si périssable et pas de lot, répartition obligatoire
    if (isPerishable && lots.length === 0) return true;

    // Si plus d'une zone ou plus d'un lot, répartition obligatoire
    if (zones.length > 1 || lots.length > 1) return true;

    return false;
  };

  // Fonction pour créer une répartition automatique (cas simple)
  const createAutoSplit = (articleId: number, quantity: number) => {
    const stockInfo = getArticleStockInfo(articleId);
    if (stockInfo.length === 0) return null;

    // Prendre la première combinaison zone/lot disponible
    const firstStock = stockInfo[0];
    return [{
      lotId: firstStock.lotId || firstStock.lot?.id || null,
      fromStorageZoneId: firstStock.storageZoneId || firstStock.storageZone?.id || null,
      quantity: Math.min(quantity, parseFloat(firstStock.quantity || "0"))
    }];
  };

  // Fonction pour valider une répartition
  const validateSplit = (articleId: number, split: any) => {
    const stockInfo = getArticleStockInfo(articleId);
    const isPerishable = isArticlePerishable(articleId);

    // Vérifier si l'article est périssable et n'a pas de lot
    if (isPerishable && !split.lotId) {
      return { valid: false, error: "Un lot est obligatoire pour les articles périssables" };
    }

    // Vérifier la disponibilité en stock pour cette combinaison
    const stockItem = stockInfo.find((s: any) => {
      const zoneId = s.storageZoneId || s.storageZone?.id;
      const lotId = s.lotId || s.lot?.id;
      return zoneId === split.fromStorageZoneId && 
             (lotId === split.lotId || (!lotId && !split.lotId));
    });

    if (!stockItem) {
      return { valid: false, error: "Combinaison zone/lot non trouvée en stock" };
    }

    const availableQuantity = parseFloat(stockItem.quantity || "0");
    if (split.quantity > availableQuantity) {
      return { valid: false, error: `Quantité insuffisante en stock (disponible: ${availableQuantity})` };
    }

    return { valid: true };
  };

  // Fonction pour vérifier les doublons dans une répartition
  const hasDuplicateCombinations = (splits: any[]) => {
    const combinations = new Set();
    for (const split of splits) {
      const key = `${split.fromStorageZoneId}-${split.lotId}`;
      if (combinations.has(key)) {
        return true;
      }
      combinations.add(key);
    }
    return false;
  };

  const handleCancelDelivery = (delivery: any) => {
    setSelectedDelivery(delivery);
    setIsCancelModalOpen(true);
  };

  const handleCancelModalSuccess = () => {
    setSelectedDelivery(null);
    setIsCancelModalOpen(false);
    // Recharger les livraisons et opérations
    queryClient.invalidateQueries({ queryKey: ["/api/inventory-operations"] });
    fetch('/api/inventory-operations').then(r => r.json()).then(setInventoryOperations);
  };

  const getRelatedOperations = (deliveryId: number) => {
    return inventoryOperations.filter(op => op.parentOperationId === deliveryId || (op.type === 'livraison' && op.orderId === deliveryId));
  };
  // Fonction pour vérifier si une date correspond au filtre
  const matchesDateFilter = (DeliveryDate: string | null) => {
    if (!DeliveryDate) return false;

    const DeliveryDateObj = new Date(DeliveryDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Normaliser les dates (ignorer l'heure)
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const normalizedDeliveryDate = normalizeDate(DeliveryDateObj);
    const normalizedToday = normalizeDate(today);
    const normalizedYesterday = normalizeDate(yesterday);
    const normalizedTomorrow = normalizeDate(tomorrow);

    switch (filterDate) {
      case "today":
        return normalizedDeliveryDate.getTime() === normalizedToday.getTime();

      case "yesterday":
        return normalizedDeliveryDate.getTime() === normalizedYesterday.getTime();

      case "tomorrow":
        return normalizedDeliveryDate.getTime() === normalizedTomorrow.getTime();

      case "range": {
        // Si les deux vides → pas de filtre
        if (!filterDateFrom && !filterDateTo) return true;

        const fromDate = filterDateFrom ? normalizeDate(new Date(filterDateFrom)) : null;
        const toDate = filterDateTo ? normalizeDate(new Date(filterDateTo)) : null;

        if (fromDate && toDate) {
          return normalizedDeliveryDate >= fromDate && normalizedDeliveryDate <= toDate;
        }
        if (fromDate) {
          return normalizedDeliveryDate >= fromDate;
        }
        if (toDate) {
          return normalizedDeliveryDate <= toDate;
        }
        return true;
      }

      default:
        return true;
    }

  };

  // Les totaux sont maintenant calculés côté serveur
  // const totals = calculateTotals();

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesOrder = orderIdFilter === 'all' || String(delivery.orderId ?? '') === orderIdFilter;
    const matchesDate = !filterDate || filterDate === "all" || matchesDateFilter(delivery?.order?.deliveryDate);
    const matchesClient = clientIdFilter === 'all' || String(delivery.clientId ?? '') === clientIdFilter;
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    // Ajoutez ici la logique de recherche si besoin
    return matchesOrder && matchesClient && matchesStatus && matchesDate;
  });

  return (
    <div className=" mx-auto p-6 pt-2 space-y-6">
      {/* livraisons d'une commande spécifique */}
      {orderId && (
        <Card className="flex items-center justify-between p-2 shadow-none border-none">

          <Button
            className="bg-primary text-white hover:bg-primary-hover "
            variant="outline"
            onClick={() => window.location.href = '/orders'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Button>
          {/* Affichage des informations de la commande liée */}
          {orderData && (
            <div className="p-3 flex gap-3  text-blue-800 text-xs bg-blue-50 border border-blue-200 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
              <p className="font-medium">Commande: <b>{orderData.code}</b></p>
              <p>Client: <b>{getClientName(orderData.clientId || 0)}</b></p>
              <p>Date de commande: <b>{formatDate(orderData.createdAt)}</b></p>
              <p>Date prévu: <b>{formatDate(orderData.deliveryDate)}</b></p>
              <p>Total: <b>{parseFloat(orderData.totalTTC?.toString() || "0").toFixed(2)} DA</b></p>

            </div>
          )}
        </Card>
      )}
      {!showForm && (
        <Card className="flex  items-center justify-between p-4">
          <CardContent className="p-0 w-full">
            <div className="flex flex-wrap items-center  gap-4">
              {/* Filtres avancés */}
              {!orderId && (
                <>

                  <Select value={orderIdFilter} onValueChange={setOrderIdFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filtrer par commande" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les commandes</SelectItem>
                      {pageData?.orders.map(order => (
                        <SelectItem key={order.id} value={String(order.id)}>
                          {order.code} - {getClientName(order.clientId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={clientIdFilter} onValueChange={setClientIdFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filtrer par client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les clients</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={String(client.id)}>
                          {getClientName(client.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="ready">Prêt</SelectItem>
                  <SelectItem value="completed">Livré</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
              {/* Désactiver le bouton Nouvelle livraison */}
              {orderId && <Button onClick={startNewDelivery} data-testid="button-new-delivery">
                <FileText className="h-4 w-4 mr-2" />
                Nouvelle livraison
              </Button>}
              {/* Dates */}
              <div className="flex  gap-3 items-end w-full">

                <div className="flex flex-1 gap-2 col-span-3">
                  <div className="flex flex-col space-y-1 flex-1">
                    <label className="text-xs text-gray-600">📅 Début</label>
                    <Input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => { setFilterDateFrom(e.target.value); setFilterDate("range"); }}
                      data-testid="input-date-from"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex flex-col space-y-1 flex-1">
                    <label className="text-xs text-gray-600">📅 Fin</label>
                    <Input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => { setFilterDateTo(e.target.value); setFilterDate("range"); }}
                      data-testid="input-date-to"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Boutons rapides */}
                <div className="flex  col-span-3 items-center justify-center gap-2">
                  {[
                    { label: "Aujourd'hui", value: "today" },
                    { label: "Hier", value: "yesterday" },
                    { label: "Demain", value: "tomorrow" },
                  ].map(({ label, value }) => (
                    <Button
                      key={value}
                      variant={filterDate === value ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full ${filterDate === value ? "bg-blue-600 text-white" : ""
                        }`}
                      onClick={() => {
                        const base = new Date();
                        let d: Date;
                        if (value === "yesterday") d = new Date(base.getTime() - 86400000);
                        else if (value === "tomorrow") d = new Date(base.getTime() + 86400000);
                        else d = base;
                        const iso = d.toISOString().split("T")[0];
                        setFilterDate(value);

                      }}
                    >
                      {label}
                    </Button>
                  ))}

                  {/* Bouton reset */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-orange-200 text-orange-600 hover:bg-orange-600"
                    onClick={() => {
                      setFilterDate("all");
                      setFilterDateFrom("");
                      setFilterDateTo("");
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

      )}


      {/* Affichage conditionnel : Liste ou Formulaire */}
      {!showForm ? (
        // Affichage de la liste des livraisons
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Liste des livraisons ({filteredDeliveries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  {!orderId && (<TableHead>Client</TableHead>)}
                  {!orderId && (<TableHead>Commande</TableHead>)}

                  <TableHead>Total TTC</TableHead>
                  <TableHead>etat</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date valdiation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveriesLoading ? (
                  <TableRow>
                    <TableCell colSpan={orderId ? 6 : 8} className="text-center py-8">
                      Chargement des livraisons...
                    </TableCell>
                  </TableRow>
                ) : filteredDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Aucune livraison trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id} data-testid={`row-delivery-${delivery.id}`}>
                      <TableCell className="font-medium">{delivery.code}</TableCell>

                      {!orderId && (
                        <>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {getClientName(delivery.clientId || 0)}
                            </div>
                          </TableCell>
                          <TableCell>{getOrderCode(delivery.orderId)}</TableCell>
                        </>
                      )}

                      <TableCell className="font-semibold">
                        {parseFloat(delivery.totalTTC || "0").toFixed(2)} DA
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.isPartial)}</TableCell>
                      <TableCell>
                        <Select
                          value={delivery.status}
                          onValueChange={(newStatus) => {
                            if (newStatus !== delivery.status) {
                              updateDeliveryMutation.mutate({
                                id: delivery.id,
                                data: { status: newStatus }
                              });
                            }
                          }}
                          disabled={delivery.status === "completed"}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="ready">Prêt</SelectItem>
                            <SelectItem value="completed">Livré</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(delivery.validatedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewDelivery(delivery)}
                            data-testid={`button-view-delivery-${delivery.id}`}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editDelivery(delivery)}
                            disabled={delivery.status === "completed"}
                            data-testid={`button-edit-delivery-${delivery.id}`}
                            title="Modifier"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAssignmentModal({ open: true, delivery })}
                            title="Assigner un livreur"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPackagesModal({ open: true, delivery })}
                            title="Gérer les colis"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTrackingModal({ open: true, delivery })}
                            title="Suivi de livraison"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPaymentModal({ open: true, delivery })}
                            title="Paiement à la livraison"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const confirmMessage = delivery.status === "completed" 
                                ? "Cette livraison est validée et ne peut pas être supprimée."
                                : `Êtes-vous sûr de vouloir supprimer la livraison ${delivery.code} ?\n\nCette action est irréversible.`;
                              
                              if (delivery.status === "completed") {
                                toast({
                                  title: "Suppression impossible",
                                  description: "Les livraisons validées ne peuvent pas être supprimées",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              if (confirm(confirmMessage)) {
                                deleteDeliveryMutation.mutate(delivery.id);
                              }
                            }}
                            disabled={delivery.status === "completed" || deleteDeliveryMutation.isPending}
                            data-testid={`button-delete-delivery-${delivery.id}`}
                            title={delivery.status === "completed" ? "Impossible de supprimer une livraison validée" : "Supprimer la livraison"}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelDelivery(delivery)}
                            disabled={delivery.status === "completed" || delivery.status === "cancelled"}
                            data-testid={`button-cancel-delivery-${delivery.id}`}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                      {delivery.status === 'cancelled' && (
                        <CancellationDetails
                          delivery={{
                            ...delivery,
                            cancellationReason: delivery.cancellationReason || undefined
                          }}
                          inventoryOperations={getRelatedOperations(delivery.id)}
                        />
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        // Affichage du formulaire
        (isEditing || isViewing) && currentDelivery && (
          <div className="space-y-6">
            {/* Header */}
            <Card className="flex items-center justify-between p-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  className="w-52 bg-slate-100"
                  onClick={() => setShowForm(false)}
                  data-testid="button-back-to-list"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la liste
                </Button>

              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    onClick={saveDelivery}
                    disabled={createDeliveryMutation.isPending || updateDeliveryMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {currentDelivery.id ? "Mettre à jour" : "Créer"}
                  </Button>
                  {currentDelivery.id && currentDelivery.status !== "completed" && (
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        try {
                          await apiRequest(`/api/deliveries/${currentDelivery.id}/validate`, "POST");
                          toast({ title: "Livraison validée", description: "Le stock a été déduit et l'opération d'inventaire créée." });
                          queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
                          resetForm();
                        } catch (e: any) {
                          toast({ title: "Erreur lors de la validation", description: e?.message || "Erreur inconnue", variant: "destructive" });
                        }
                      }}
                      disabled={createDeliveryMutation.isPending || updateDeliveryMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider la livraison
                    </Button>
                  )}
                </div>
              )}
            </Card>
            {/* Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Articles à livrer ({items.length})</span>
                  {currentDelivery.orderId && orderData && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Package className="h-3 w-3 mr-1" />
                      Commande {orderData.code}
                    </Badge>
                  )}

                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead >Article</TableHead>
                      <TableHead className="text-center text-red-900">Quantité commandée</TableHead>
                      <TableHead className="text-center">Quantité déjà livrée</TableHead>
                      <TableHead className="text-center">Quantité restante</TableHead>
                      <TableHead className="bg-green-100 text-green-900 font-bold text-center">Quantité à livrer</TableHead>
                      <TableHead className="text-center">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isEditing ? 4 : 4} className="text-center py-8">
                          Aucun article ajouté
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => {
                        // Utiliser les données optimisées de l'API
                        const orderItem = orderDetails?.items.find((oi: any) => oi.articleId === item.articleId);
                        const orderedQuantity = orderItem ? orderItem.quantityOrdered : 0;
                        const deliveredQuantity = orderItem ? orderItem.quantityDelivered : 0;
                        const remainingQuantity = orderItem ? orderItem.quantityRemaining : 0;
                        const articleSplits = splits[item.articleId] || [];
                        const splitSum = getSplitSum(item.articleId);
                        const isRequired = isSplitRequired(item.articleId, item.quantity);
                        const hasValidSplit = articleSplits.length > 0 && Math.abs(splitSum - item.quantity) < 0.001;
                        const isExpanded = expandedArticleId === item.articleId;
                        return (
                          <React.Fragment key={item.id}>
                            <TableRow className="text-lg cursor-pointer hover:bg-slate-50 transition-all duration-200 ease-in-out group"
                            
                            >
                              <TableCell className="p-2"   onClick={() => setExpandedArticleId(isExpanded ? null : item.articleId)}>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-4 text-xs font-bold flex-1">
                                    <img src={item.article?.photo} alt='vérifier photo' className="w-[4rem] h-[3rem] object-cover rounded-lg shadow-sm" />
                                    <span className="text-gray-900">{item.article ? item.article?.name : item.articleId}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                  
                                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2 text-red-900">
                                {orderedQuantity + ' ' + item.article.unit}
                              </TableCell>
                              <TableCell className="text-center p-2">
                                {deliveredQuantity + ' ' + item.article.unit}
                              </TableCell>
                              <TableCell className="text-center">
                                {remainingQuantity + ' ' + item.article.unit}
                              </TableCell>
                              <TableCell className="bg-green-100 text-center">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max={remainingQuantity}
                                    step="1"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseFloat(e.target.value) || 0;
                                      if (newQuantity <= remainingQuantity && newQuantity <= orderedQuantity) {
                                        updateItemQuantity(item.id, newQuantity);
                                      }
                                    }}
                                    className="text-center"
                                  />
                                ) : (
                                  item.quantity
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    value={item.notes}
                                    onChange={(e) => setItems(items.map(i =>
                                      i.id === item.id ? { ...i, notes: e.target.value } : i
                                    ))}
                                    placeholder="Notes..."
                                    className="w-32"
                                  />
                                ) : (
                                  item.notes || "-"
                                )}
                              </TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                {/* Empêche la propagation du clic pour ne pas toggle l'accordion */}
                                {(() => {
                                  const articleId = item.articleId;
                                  const quantity = item.quantity;
                                  const splitSum = getSplitSum(articleId);
                                  const isRequired = isSplitRequired(articleId, quantity);
                                  const hasValidSplit = splits[articleId] && splits[articleId].length > 0 && Math.abs(splitSum - quantity) < 0.001;
                                  if (quantity === 0) {
                                    return <span className="text-gray-400">-</span>;
                                  }
                                  if (!isRequired) {
                                    return (
                                      <span className="text-sm text-blue-600 font-medium">
                                        ✓ Répartition automatique
                                      </span>
                                    );
                                  }
                                  if (hasValidSplit) {
                                    return (
                                      <>
                                        <CheckCircle className="text-green-600 inline-block mr-1" />
                                        <span className="text-sm text-green-600 font-medium">
                                          ✓ Répartition validée
                                        </span>
                                      </>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <AlertTriangle className="text-yellow-500 inline-block mr-1" />
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => setSplitModal({ open: true, articleId: item.articleId })}
                                        >
                                          Répartir
                                        </Button>
                                      </>
                                    );
                                  }
                                })()}
                              </TableCell>
                            </TableRow>
                            {/* Ligne de split affichée si expanded */}
                            {isExpanded && (
                              <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50">
                                <TableCell colSpan={7} className="p-0">
                                  <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    {/* Livraisons partielles déjà effectuées */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1 bg-green-100 rounded-full">
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        <h4 className="font-semibold text-gray-800">Livraisons déjà effectuées</h4>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                          {deliveries.flatMap(delivery => (delivery.items || []).map((it: any) => ({...it, delivery}))).filter(it => it.articleId === item.articleId).length} livraison(s)
                                        </Badge>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">Zone de stockage</th>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">Lot</th>
                                              <th className="px-3 py-2 text-right font-medium text-gray-700">Quantité livrée</th>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">Date de livraison</th>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">Statut</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200">
                                            {(() => {
                                              const deliveredItems = deliveries
                                                .flatMap(delivery => (delivery.items || []).map((it: any) => ({...it, delivery})))
                                                .filter(it => it.articleId === item.articleId);
                                              
                                              if (deliveredItems.length === 0) {
                                                return (
                                                  <tr>
                                                    <td colSpan={5} className="px-3 py-4 text-center text-gray-500 italic">
                                                      Aucune livraison effectuée pour cet article
                                                    </td>
                                                  </tr>
                                                );
                                              }
                                              
                                              return deliveredItems.map((it, idx) => {
                                                // Récupérer les informations de zone et lot depuis les données d'articles
                                                const article = articles.find(a => a.id === it.articleId);
                                                const stockInfo = (article as any)?.stockInfo || [];
                                                const stockItem = stockInfo.find((s: any) => 
                                                  s.storageZoneId === it.fromStorageZoneId && 
                                                  s.lotId === it.lotId
                                                );
                                                
                                                const zoneName = it.fromStorageZone?.designation || 
                                                              stockItem?.storageZone?.designation || 
                                                              it.zoneName || 
                                                              it.zoneDesignation || 
                                                              it.storageZoneDesignation || 
                                                              `Zone ${it.fromStorageZoneId || '-'}`;
                                                
                                                const lotName = it.lot?.code || 
                                                             stockItem?.lot?.code || 
                                                             it.lotName || 
                                                             it.lotCode || 
                                                             `Lot ${it.lotId || '-'}`;
                                                
                                                return (
                                                  <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">
                                                      <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        <span className="font-medium text-gray-900">{zoneName}</span>
                                                      </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                        {lotName}
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                      <span className="font-bold text-green-700">
                                                        {it.qteLivree || it.quantity || '-'} {item.article?.unit || ''}
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <span className="text-gray-600">
                                                        {it.delivery?.deliveryDate ? new Date(it.delivery.deliveryDate).toLocaleDateString('fr-FR') : '-'}
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <Badge variant="default" className="bg-green-100 text-green-800">
                                                        Livré
                                                      </Badge>
                                                    </td>
                                                  </tr>
                                                );
                                              });
                                            })()}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* Livraison à venir (prévisualisation) */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1 bg-blue-100 rounded-full">
                                          <Truck className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <h4 className="font-semibold text-gray-800">Livraison à venir</h4>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                          {isRequired ? (articleSplits.length > 0 ? 'Répartition manuelle' : 'En attente') : 'Automatique'}
                                        </Badge>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">Zone de stockage</th>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">Lot</th>
                                              <th className="px-3 py-2 text-right font-medium text-gray-700">Quantité à livrer</th>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">Type de répartition</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200">
                                            {/* Si répartition automatique */}
                                            {!isRequired && (() => {
                                              const autoSplit = createAutoSplit(item.articleId, item.quantity);
                                              if (autoSplit && autoSplit.length > 0) {
                                                const s = autoSplit[0];
                                                const article = articles.find(a => a.id === item.articleId);
                                                const stockInfo = (article as any)?.stockInfo || [];
                                                const stockItem = stockInfo.find((stock: any) => 
                                                  stock.storageZoneId === s.fromStorageZoneId && 
                                                  stock.lotId === s.lotId
                                                );
                                                
                                                const zoneName = stockItem?.storageZone?.designation || 
                                                              `Zone ${s.fromStorageZoneId || '-'}`;
                                                const lotName = stockItem?.lot?.code || 
                                                             `Lot ${s.lotId || '-'}`;
                                                
                                                return (
                                                  <tr className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">
                                                      <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        <span className="font-medium text-gray-900">{zoneName}</span>
                                                      </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                        {lotName}
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                      <span className="font-bold text-blue-700">
                                                        {s.quantity} {item.article?.unit || ''}
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Automatique
                                                      </Badge>
                                                    </td>
                                                  </tr>
                                                );
                                              }
                                              return null;
                                            })()}
                                            
                                            {/* Sinon, splits manuels */}
                                            {isRequired && articleSplits.length > 0 && articleSplits.map((split, idx) => {
                                              const article = articles.find(a => a.id === item.articleId);
                                              const stockInfo = (article as any)?.stockInfo || [];
                                              const stockItem = stockInfo.find((stock: any) => 
                                                stock.storageZoneId === split.fromStorageZoneId && 
                                                stock.lotId === split.lotId
                                              );
                                              
                                              const zoneName = stockItem?.storageZone?.designation || 
                                                            `Zone ${split.fromStorageZoneId || '-'}`;
                                              const lotName = stockItem?.lot?.code || 
                                                           `Lot ${split.lotId || '-'}`;
                                              
                                              return (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                  <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                      <span className="font-medium text-gray-900">{zoneName}</span>
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                      {lotName}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2 text-right">
                                                    <span className="font-bold text-blue-700">
                                                      {split.quantity} {item.article?.unit || ''}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-800">
                                                      <Edit3 className="h-3 w-3 mr-1" />
                                                      Répartition manuelle
                                                    </Badge>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                            
                                            {/* Si aucun split manuel sélectionné */}
                                            {isRequired && articleSplits.length === 0 && (
                                              <tr>
                                                <td colSpan={4} className="px-3 py-4 text-center">
                                                  <div className="flex items-center justify-center gap-2 text-gray-500">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <span className="italic">Aucune répartition sélectionnée</span>
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {/* Form */}

          </div>
        )
      )}

      {/* Modal de répartition amélioré */}
      <DeliverySplitModal
        open={splitModal.open}
        onOpenChange={(open: boolean) => setSplitModal({ open, articleId: splitModal.articleId })}
        articleId={splitModal.articleId}
        articleName={splitModal.articleId ? items.find(i => i.articleId === splitModal.articleId)?.articleName || "" : ""}
        requestedQuantity={splitModal.articleId ? items.find(i => i.articleId === splitModal.articleId)?.quantity || 0 : 0}
        onSplitValidated={(newSplits: Array<{ lotId: number | null, fromStorageZoneId: number | null, quantity: number }>) => {
          if (splitModal.articleId) {
            setSplits(s => ({ ...s, [splitModal.articleId!]: newSplits }));
          }
        }}
      />
      {selectedDelivery && (
        <CancellationModal
          delivery={selectedDelivery}
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onSuccess={handleCancelModalSuccess}
        />
      )}

      {/* Nouveaux modals */}
      <DeliveryAssignmentModal
        open={assignmentModal.open}
        onOpenChange={(open) => setAssignmentModal({ open, delivery: null })}
        delivery={assignmentModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
        }}
      />

      <DeliveryPackagesModal
        open={packagesModal.open}
        onOpenChange={(open) => setPackagesModal({ open, delivery: null })}
        delivery={packagesModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
        }}
      />

      <DeliveryTrackingModal
        open={trackingModal.open}
        onOpenChange={(open) => setTrackingModal({ open, delivery: null })}
        delivery={trackingModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
        }}
      />

      <DeliveryPaymentModal
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal({ open, delivery: null })}
        delivery={paymentModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
        }}
      />
    </div>
  );
}