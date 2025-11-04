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
  Check,
  AlarmClock,
  CircleX,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Article,
} from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliverySplitModal } from "@/components/delivery-split-modal";
import { CancellationDetails } from "@/components/delivery-cancellation-details";
import { CancellationModal } from "@/pages/delivery-cancellations";
import { DeliveryPaymentDetails } from "@/components/delivery-payment-details";
import { DeliveryAssignmentModal } from "@/components/delivery-assignment-modal";
import { DeliveryPackagesModal } from "@/components/delivery-packages-modal";
import { DeliveryTrackingModal } from "@/components/delivery-tracking-modal";
import { DeliveryPaymentModal } from "@/components/delivery-payment-modal";
import {
  DateTypes,
  DEFAULT_CURRENCY_DZD,
  FILTER_ALL,
  InventoryOperationStatus,
  InventoryOperationType,
} from "@shared/constants";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { confirmGlobal, useGlobalConfirm } from "@/contexts/confimContext";

export default function DeliveriesPage() {
  usePageTitle("Livraisons");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Récupérer le paramètre orderId de l'URL
  const [orderId, setOrderId] = useState<number | null>(null);
  const [fromOrder, setfromOrder] = useState<boolean>(false);
  const [urlIsParsed, seturlIsParsed] = useState<boolean>(false);

  // States
  const [currentDelivery, setCurrentDelivery] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [splitModal, setSplitModal] = useState<{
    open: boolean;
    articleId: number | null;
  }>({ open: false, articleId: null });
  const [splits, setSplits] = useState<
    Record<
      number,
      Array<{
        lotId: number | null;
        fromStorageZoneId: number | null;
        quantity: number;
      }>
    >
  >({});
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [inventoryOperations, setInventoryOperations] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  // Nouveaux modals
  const [assignmentModal, setAssignmentModal] = useState<{
    open: boolean;
    delivery: any;
  }>({ open: false, delivery: null });
  const [packagesModal, setPackagesModal] = useState<{
    open: boolean;
    delivery: any;
  }>({ open: false, delivery: null });
  const [trackingModal, setTrackingModal] = useState<{
    open: boolean;
    delivery: any;
  }>({ open: false, delivery: null });
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    delivery: any;
  }>({ open: false, delivery: null });

  const [orderIdFilter, setOrderIdFilter] = useState<string>("all");
  const [clientIdFilter, setClientIdFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [orderDeliveryDetails, setOrderDeliveryDetails] = useState<
    Record<string, any>
  >({});
  // Ajout de l'état pour l'article dont le split est affiché
  const [expandedArticleId, setExpandedArticleId] = useState<number | null>(
    null,
  );

  // État pour gérer l'onglet actif dans la card Articles à livrer
  const [activeTab, setActiveTab] = useState<string>("details");
  const [orderData, setOrderData] = useState<any>(null);

  // Utilisation avec useState et useEffect pour gérer l'état
  const [pageData, setPageData] = useState<{
    deliveries: any[];
    clients: any[];
    orders: Order[];
    articles: any[];
  } | null>(null);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);

  const canUpdate = (status: InventoryOperationStatus) =>
    status == InventoryOperationStatus.DRAFT;
  const canDelete = (status: InventoryOperationStatus) =>
    status == InventoryOperationStatus.DRAFT;
  const canValidate = (status: InventoryOperationStatus) =>
    status == InventoryOperationStatus.DRAFT;
  const canInValidate = (status: InventoryOperationStatus) =>
    status == InventoryOperationStatus.READY;
  const canStartDelivery = (status: InventoryOperationStatus) =>
    status == InventoryOperationStatus.READY;
  const canDeliver = (status: InventoryOperationStatus) =>
    status == InventoryOperationStatus.IN_PROGRESS;
  const canCancel = (status: InventoryOperationStatus) =>
    status == InventoryOperationStatus.IN_PROGRESS ||
    status == InventoryOperationStatus.PARTIALLY_COMPLETED ||
    status == InventoryOperationStatus.COMPLETED;
  const canAssignDeliveryPerson = (status: InventoryOperationStatus) =>
    status != InventoryOperationStatus.DRAFT;
  // Récupérer le paramètre orderId de l'URL au chargement de la page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get("orderId");
    const _orderId = orderIdParam ? parseInt(orderIdParam) : null;
    if (orderIdParam) {
      setOrderId(_orderId);
      setfromOrder(true);
    } else {
      setOrderId(null);
    }

    fetchPageData(_orderId).then((f) =>
      selectCurrentOrderAndDelivery(_orderId),
    );
    seturlIsParsed(true);
  }, [location.search]);

  useEffect(() => {
    if (pageData && orderId) {
      selectCurrentOrderAndDelivery(orderId);
    }
  }, [orderId, pageData]);

  // Charger automatiquement les détails de commande si on a un orderId dans l'URL
  useEffect(() => {
    if (!fromOrder && orderId) {
      ensureOrderDeliveryDetails(orderId);
    }
  }, [fromOrder, orderId]);

  // Détails de livraison côté client pour le mode "toutes livraisons" lors de l'édition/consultation

  // Fonction utilitaire pour charger les détails de livraison d'une commande sans altérer la liste
  const ensureOrderDeliveryDetails = async (
    orderIdToLoad: number | null,
    excludeDeliveryId?: number,
  ) => {
    if (!orderIdToLoad) return null;

    // Créer une clé unique pour le cache qui inclut l'exclusion
    const cacheKey = `${orderIdToLoad}-${excludeDeliveryId || "none"}`;
    if (orderDeliveryDetails[cacheKey]) return orderDeliveryDetails[cacheKey];

    try {
      let url = `/api/orders/${orderIdToLoad}/delivery-details`;
      if (excludeDeliveryId) {
        url += `?excludeDeliveryId=${excludeDeliveryId}`;
      }

      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Failed to fetch order delivery details");
      const data = await resp.json();
      setOrderDeliveryDetails((prev) => ({ ...prev, [cacheKey]: data }));
      return data;
    } catch (e) {
      console.error("Erreur chargement détails de livraison commande:", e);
      return null;
    }
  };

  const fetchPageData = async (
    myOrderId: number | null,
    excludeDeliveryId?: number,
  ) => {
    try {
      setDeliveriesLoading(true);
      let url = `/api/deliveries/page-data${myOrderId ? "?orderId=" + myOrderId : ""}`;
      if (excludeDeliveryId) {
        url += `${myOrderId ? "&" : "?"}excludeDeliveryId=${excludeDeliveryId}`;
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

      setPageData({
        deliveries: adaptedDeliveries,
        clients: data.clients,
        orders: data.orders,
        articles: data.articles,
      });

      // Récupérer les détails de commande depuis la liste orders
    } catch (error) {
      console.error("Error fetching deliveries page data:", error);
      throw error;
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const selectCurrentOrderAndDelivery = (
    myOrderId: number | null,
    deliveryId: number | null = null,
  ) => {
    if (!myOrderId) return;
    // --------------set order---------
    setOrderId(myOrderId || myOrderId || null);
    const currentOrder = pageData?.orders.find((o) => o.id === myOrderId);
    setOrderData(
      currentOrder
        ? {
            id: currentOrder.id,
            code: currentOrder.code,
            clientId: currentOrder.clientId,
            totalTTC: currentOrder.totalTTC,
            createdAt: currentOrder.createdAt,
            deliveryDate: currentOrder.deliveryDate,
            notes: currentOrder.notes,
          }
        : null,
    );

    // --------------set delivery---------
    if (!deliveryId) return;
    const fullDelivery = (pageData?.deliveries || []).find(
      (d: any) => d.id === deliveryId,
    );

    setCurrentDelivery({
      id: fullDelivery.id,
      code: fullDelivery.code,
      type: fullDelivery.type || InventoryOperationType.LIVRAISON,
      status: fullDelivery.status || InventoryOperationStatus.DRAFT,
      clientId: fullDelivery.clientId || fullDelivery.order?.clientId || null,
      orderId: fullDelivery.orderId || null,
      scheduledDate: new Date(
        fullDelivery.scheduledDate || new Date(),
      ).toLocaleDateString("en-CA"),
      notes: fullDelivery.notes || "",
      currency: DEFAULT_CURRENCY_DZD,
    });
  };

  const updateDeliveryStateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: InventoryOperationStatus;
    }) => {
      const payload = {
        status: status,
        isDeliveryValidated: status == InventoryOperationStatus.READY,
      };
      return await apiRequest(
        `/api/inventory-operations/${id}`,
        "PATCH",
        payload,
      );
    },
    onSuccess: async (res: any) => {
      toast({
        title: "Status mis à jour",
        description: "Status mis à jour avec succès",
      });
      resetForm();
      const del = await res.json();
      const delivery = filteredDeliveries?.find((f) => f.id == del.id);
      if (!delivery) return;
      delivery.status = del.status;
      delivery.isValidated = del.isValidated;
      delivery.validatedAt = del.validatedAt;
      delivery.deliveryPersonId = del.deliveryPersonId;
      if (!del.deliveryPersonId) delivery.deliveryPerson = null;
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du status",
        variant: "destructive",
      });
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/deliveries/${id}`, "DELETE");
    },
    onSuccess: () => {
      fetchPageData(orderId);
      toast({
        title: "Livraison supprimée",
        description: "La livraison a été supprimée avec succès",
      });
    },
    onError: (error: any) => {
      console.error("Erreur suppression livraison:", error);
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer cette livraison",
        variant: "destructive",
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

  const startNewDelivery = async () => {
    if (orderId && orderData) {
      const data = await ensureOrderDeliveryDetails(orderId);
      if (!data) return;
      // Si on a un orderId, pré-remplir avec les données de la commande
      setCurrentDelivery({
        type: "delivery",
        status: "draft",
        clientId: orderData.clientId,
        orderId: orderId,
        scheduledDate: new Date().toISOString().split("T")[0],
        notes: `Livraison pour la commande ${orderData.code}`,
        currency: "DZD",
        // Ne plus initialiser les totaux - ils seront calculés côté serveur
      });

      // Pré-remplir avec les articles de la commande (exclure ceux avec quantité restante 0)
      const newItems = data.items
        .filter((item: any) => item.quantityRemaining > 0)
        .map((item: any) => ({
          id: Date.now() + Math.random(), // Nouvel ID temporaire
          articleId: item.articleId,
          article: pageData?.articles.find((a) => a.id === item.articleId), // Récupérer depuis la liste articles
          quantity: Math.min(
            item.quantityRemaining,
            pageData?.articles.find((a) => a.id === item.articleId)
              ?.totalDispo || 0,
          ), // Utiliser la quantité restante
          // Ne plus gérer unitPrice et totalPrice côté client
          notes: "",
        }));

      setItems(newItems);

      // Créer automatiquement les répartitions pour les cas simples
      const newSplits: Record<
        number,
        Array<{
          lotId: number | null;
          fromStorageZoneId: number | null;
          quantity: number;
        }>
      > = {};

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
        scheduledDate: null,
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

  const editDelivery = async (delivery: InventoryOperation) => {
    const data = await ensureOrderDeliveryDetails(
      ((delivery as any).orderId || orderId) as number,
      delivery.id,
    );
    if (!data) return;
    // Recharger les données de la page avec exclusion de cette livraison pour le stock
    await fetchPageData(
      ((delivery as any).orderId || orderId) as number,
      delivery.id,
    );

    selectCurrentOrderAndDelivery(delivery.orderId, delivery.id);

    const fullDelivery =
      (pageData?.deliveries || []).find(
        (d: any) => d.id === (delivery as any).id,
      ) || (delivery as any);

    // Regrouper les items par article avec agrégation des quantités et splits multiples
    const groupedByArticle: Record<
      number,
      {
        articleId: number;
        article: any;
        totalQuantity: number;
        splits: Array<{
          lotId: number | null;
          fromStorageZoneId: number | null;
          quantity: number;
        }>;
        notes: string;
      }
    > = {};

    for (const item of fullDelivery.items || []) {
      const articleId = item.articleId;
      if (!groupedByArticle[articleId]) {
        groupedByArticle[articleId] = {
          articleId,
          article: (pageData?.articles || []).find((a) => a.id === articleId),
          totalQuantity: 0,
          splits: [],
          notes: "",
        };
      }
      groupedByArticle[articleId].totalQuantity += parseFloat(item.quantity);
      groupedByArticle[articleId].splits.push({
        lotId: item.lotId || item.lot?.id || null,
        fromStorageZoneId:
          item.fromStorageZoneId || item.fromStorageZone?.id || null,
        quantity: parseFloat(item.quantity),
      });
    }
    var articleIds = Object.keys(groupedByArticle);

    const notCreated = data.items
      .filter(
        (item: any) =>
          item.quantityRemaining > 0 &&
          !articleIds.includes(item.articleId?.toString()),
      )
      .map((item: any) => ({
        articleId: item.articleId,
        article: pageData?.articles.find((a) => a.id === item.articleId), // Récupérer depuis la liste articles
        totalQuantity: 0, // Utiliser la quantité restante
        // Ne plus gérer unitPrice et totalPrice côté client
        notes: "",
      }));

    // Mettre à jour items (une ligne par article) et splits
    const normalizedItems = [
      ...Object.values(groupedByArticle),
      ...notCreated,
    ].map((g: any) => ({
      id: `${fullDelivery.id}-${g.articleId}`,
      articleId: g.articleId,
      article: g.article,
      quantity: g.totalQuantity,
      notes: g.notes,
    }));
    setItems(normalizedItems);

    const newSplits: Record<
      number,
      Array<{
        lotId: number | null;
        fromStorageZoneId: number | null;
        quantity: number;
      }>
    > = {};
    for (const g of Object.values(groupedByArticle) as any[]) {
      newSplits[g.articleId] = g.splits;
    }
    setSplits(newSplits);

    // Mode toutes livraisons: charger deliveryDetails de la commande au besoin (fusion côté client)

    setIsEditing(true);
    setIsViewing(false);
    setShowForm(true);
  };

  const viewDelivery = async (delivery: InventoryOperation) => {
    // Pré-remplissage identique à edit mais en mode lecture

    await ensureOrderDeliveryDetails(delivery.orderId, delivery.id);
    // Recharger les données de la page avec exclusion de cette livraison pour le stock
    await fetchPageData(
      ((delivery as any).orderId || orderId) as number,
      delivery.id,
    );

    selectCurrentOrderAndDelivery(delivery.orderId, delivery.id);
    const fullDelivery =
      (pageData?.deliveries || []).find(
        (d: any) => d.id === (delivery as any).id,
      ) || (delivery as any);

    // Regrouper items par article pour l'affichage
    const groupedByArticle: Record<
      number,
      {
        articleId: number;
        article: any;
        totalQuantity: number;
        splits: Array<{
          lotId: number | null;
          fromStorageZoneId: number | null;
          quantity: number;
        }>;
        notes: string;
      }
    > = {};

    for (const item of (fullDelivery as any).items || []) {
      const articleId = item.articleId;
      if (!groupedByArticle[articleId]) {
        groupedByArticle[articleId] = {
          articleId,
          article: (pageData?.articles || []).find((a) => a.id === articleId),
          totalQuantity: 0,
          splits: [],
          notes: "",
        };
      }
      groupedByArticle[articleId].totalQuantity += parseFloat(item.quantity);
      groupedByArticle[articleId].splits.push({
        lotId: item.lotId || item.lot?.id || null,
        fromStorageZoneId:
          item.fromStorageZoneId || item.fromStorageZone?.id || null,
        quantity: parseFloat(item.quantity),
      });
    }

    const normalizedItems = Object.values(groupedByArticle).map((g: any) => ({
      id: `${(fullDelivery as any).id}-${g.articleId}`,
      articleId: g.articleId,
      article: g.article,
      quantity: g.totalQuantity,
      notes: g.notes,
    }));
    setItems(normalizedItems);

    const newSplits: Record<
      number,
      Array<{
        lotId: number | null;
        fromStorageZoneId: number | null;
        quantity: number;
      }>
    > = {};
    for (const g of Object.values(groupedByArticle) as any[]) {
      newSplits[g.articleId] = g.splits;
    }
    setSplits(newSplits);

    // if (!fromOrder && ((delivery as any).orderId || orderId)) {
    //   await ensureOrderDeliveryDetails(((delivery as any).orderId || orderId) as number);
    // }

    setIsEditing(false);
    setIsViewing(true);
    setShowForm(true);
  };

  const updateItemQuantity = (itemId: number | string, quantity: number) => {
    if (orderId) {
      // Pour une nouvelle livraison (currentDelivery?.id est undefined), utiliser la clé sans exclusion
      // Pour une livraison existante, utiliser la clé avec exclusion
      const cacheKey = currentDelivery?.id
        ? `${orderId}-${currentDelivery.id}`
        : `${orderId}-none`;

      setItems(
        items.map((item) => {
          if (item.id === itemId) {
            // Vérifier les limites avant de mettre à jour
            const orderItem = orderDeliveryDetails[cacheKey]?.items.find(
              (oi: any) => oi.articleId === item.articleId,
            );
            if (orderItem) {
              const remainingQuantity = orderItem.quantityRemaining;
              const orderedQuantity = orderItem.quantityOrdered;

              // Ne pas dépasser la quantité restante ni la quantité commandée
              const finalQuantity = Math.min(
                quantity,
                remainingQuantity,
                orderedQuantity,
              );

              // Si la quantité change et est différente de la quantité déjà répartie, réinitialiser la répartition
              const currentSplitSum = getSplitSum(item.articleId);
              if (Math.abs(currentSplitSum - finalQuantity) > 0.001) {
                // Supprimer l'ancienne répartition
                const newSplits = { ...splits };
                delete newSplits[item.articleId];
                setSplits(newSplits);

                // Si pas de répartition nécessaire, créer automatiquement
                if (!isSplitRequired(item.articleId, finalQuantity)) {
                  const autoSplit = createAutoSplit(
                    item.articleId,
                    finalQuantity,
                  );
                  if (autoSplit) {
                    setSplits((prev) => ({
                      ...prev,
                      [item.articleId]: autoSplit,
                    }));
                  }
                }
              }

              return {
                ...item,
                quantity: finalQuantity,
                // Ne plus calculer totalPrice côté client
              };
            }
          }
          return item;
        }),
      );
    }
  };

  // Cette fonction n'est plus utilisée car les totaux sont calculés côté serveur
  // const calculateTotals = () => {
  //   const subtotalHT = items.reduce((sum, item) => sum + item.totalPrice, 0);
  //   const totalTax = subtotalHT * 0.19; // TVA 19%
  //   const totalTTC = subtotalHT + totalTax;
  //   return { subtotalHT, totalTax, totalTTC };
  // };
  const [isSaving, setIsSaving] = useState(false);
  const saveDelivery = async () => {
    // Vérifications de base
    if (!currentDelivery.clientId) {
      toast({
        title: "Client requis",
        description: "Veuillez sélectionner un client",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Articles requis",
        description: "Veuillez ajouter au moins un article",
        variant: "destructive",
      });
      return;
    }
    if (!orderId) return;
    // Vérifier que les quantités ne dépassent pas les limites de commande
    if (orderId) {
      // Pour une nouvelle livraison (currentDelivery?.id est undefined), utiliser la clé sans exclusion
      // Pour une livraison existante, utiliser la clé avec exclusion
      const cacheKey = currentDelivery?.id
        ? `${orderId}-${currentDelivery.id}`
        : `${orderId}-none`;

      for (const item of items) {
        const orderItem = orderDeliveryDetails[cacheKey]?.items.find(
          (oi: any) => oi.articleId === item.articleId,
        );
        if (orderItem) {
          const remainingQuantity = orderItem.quantityRemaining;
          const orderedQuantity = orderItem.quantityOrdered;

          if (item.quantity > remainingQuantity) {
            toast({
              title: "Quantité invalide",
              description: `La quantité pour ${item.article?.name} dépasse la quantité restante (${remainingQuantity})`,
              variant: "destructive",
            });
            return;
          }

          if (item.quantity > orderedQuantity) {
            toast({
              title: "Quantité invalide",
              description: `La quantité pour ${item.article?.name} dépasse la quantité commandée (${orderedQuantity})`,
              variant: "destructive",
            });
            return;
          }
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
          variant: "destructive",
        });
        return;
      }

      // Règle 3: Si une seule zone et un seul lot, créer automatiquement la répartition
      if (zones.length === 1 && lots.length <= 1) {
        const autoSplit = createAutoSplit(articleId, quantity);
        if (autoSplit) {
          // Récupérer l'orderItemId depuis les données de commande
          const cacheKey = currentDelivery?.id
            ? `${orderId}-${currentDelivery.id}`
            : `${orderId}-none`;
          const orderItem = orderDeliveryDetails[cacheKey]?.items.find(
            (oi: any) => oi.articleId === articleId,
          );

          allItems.push({
            idArticle: articleId,
            qteLivree: autoSplit[0].quantity.toString(),
            idlot: autoSplit[0].lotId,
            idzone: autoSplit[0].fromStorageZoneId,
            idOrderItem: orderItem?.id || null,
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
          variant: "destructive",
        });
        return;
      }

      // Règle 5: Vérifier que la quantité répartie = quantité à livrer
      const splitSum = getSplitSum(articleId);
      if (Math.abs(splitSum - quantity) > 0.001) {
        toast({
          title: "Quantité répartie incorrecte",
          description: `La quantité répartie (${splitSum}) doit être égale à la quantité à livrer (${quantity}) pour ${item.article?.name}`,
          variant: "destructive",
        });
        return;
      }

      // Règle 6: Vérifier les doublons de combinaisons
      if (hasDuplicateCombinations(split)) {
        toast({
          title: "Combinaisons dupliquées",
          description: `Vous ne pouvez pas utiliser la même combinaison zone/lot plusieurs fois pour ${item.article?.name}`,
          variant: "destructive",
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
            variant: "destructive",
          });
          return;
        }

        // Récupérer l'orderItemId depuis les données de commande
        const cacheKey = currentDelivery?.id
          ? `${orderId}-${currentDelivery.id}`
          : `${orderId}-none`;
        const orderItem = orderDeliveryDetails[cacheKey]?.items.find(
          (oi: any) => oi.articleId === articleId,
        );

        allItems.push({
          idArticle: articleId,
          qteLivree: splitItem.quantity.toString(),
          idlot: splitItem.lotId,
          idzone: splitItem.fromStorageZoneId,
          idOrderItem: orderItem?.id || null,
        });
      }
    }

    const payload = {
      deliveryDate: currentDelivery.scheduledDate || null,
      note: currentDelivery.notes || null,
      orderId: currentDelivery.orderId,
      clientId: currentDelivery.clientId,
      items: allItems,
    };

    try {
      setIsSaving(true);
      let deliveryId = currentDelivery.id;
      let deliveryResponse;
      if (deliveryId) {
        deliveryResponse = await apiRequest(
          `/api/deliveries/${deliveryId}`,
          "PUT",
          payload,
        );

        const cacheKey = `${currentDelivery.orderId}-none`;
        orderDeliveryDetails[cacheKey] = null;
        // Pour un PUT, on suppose que l'id ne change pas
      } else {
        deliveryResponse = await apiRequest("/api/deliveries", "POST", payload);
        const deliveryData = await deliveryResponse.json();
        deliveryId = deliveryData.id;
      }
      await fetchPageData(currentDelivery.orderId);
      setIsSaving(false);
      if (!deliveryId)
        throw new Error("Impossible de récupérer l'ID de la livraison");

      toast({
        title: currentDelivery.id ? "Livraison mise à jour" : "Livraison créée",
        description:
          "La livraison et les réservations de stock ont été enregistrées avec succès",
      });

      resetForm();
    } catch (error: any) {
      setIsSaving(false);
      toast({
        title: "Erreur lors de la sauvegarde",
        description:
          error.message ||
          "Erreur lors de la création ou de la réservation de stock",
        variant: "destructive",
      });
    }
  };

  const getClientName = (clientId: number) => {
    const client = pageData?.clients.find((c) => c.id === clientId);
    if (!client) return "Client inconnu";
    return client.name;
  };

  const getOrderCode = (orderId: number | null) => {
    if (!orderId) return "-";
    const order = pageData?.orders.find((o) => o.id === orderId);
    return order ? order.code : `CMD-${orderId}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Brouillon" },
      pending: { variant: "default" as const, label: "En attente" },
      ready: { variant: "default" as const, label: "Prêt" },
      in_progress: { variant: "default" as const, label: "en cours" },
      completed: { variant: "default" as const, label: "Livré" },
      partially_completed: {
        variant: "default" as const,
        label: "Livré partiellement",
      },
      cancelled: { variant: "destructive" as const, label: "Annulé" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // Fonction utilitaire pour calculer la somme répartie pour un article
  const getSplitSum = (articleId: number) =>
    (splits[articleId] || []).reduce((sum, s) => sum + (s.quantity || 0), 0);

  // Fonction pour obtenir les informations de stock d'un article depuis pageData
  const getArticleStockInfo = (articleId: number) => {
    const article = pageData?.articles.find((a) => a.id === articleId);
    return (article as any)?.stockInfo || [];
  };

  // Fonction pour vérifier si un article est périssable
  const isArticlePerishable = (articleId: number) => {
    const article = pageData?.articles.find((a) => a.id === articleId);
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
    return [
      {
        lotId: firstStock.lotId || firstStock.lot?.id || null,
        fromStorageZoneId:
          firstStock.storageZoneId || firstStock.storageZone?.id || null,
        quantity: Math.min(quantity, parseFloat(firstStock.quantity || "0")),
      },
    ];
  };

  // Fonction pour valider une répartition
  const validateSplit = (articleId: number, split: any) => {
    const stockInfo = getArticleStockInfo(articleId);
    const isPerishable = isArticlePerishable(articleId);

    // Vérifier si l'article est périssable et n'a pas de lot
    if (isPerishable && !split.lotId) {
      return {
        valid: false,
        error: "Un lot est obligatoire pour les articles périssables",
      };
    }

    // Vérifier la disponibilité en stock pour cette combinaison
    const stockItem = stockInfo.find((s: any) => {
      const zoneId = s.storageZoneId || s.storageZone?.id;
      const lotId = s.lotId || s.lot?.id;
      return (
        zoneId === split.fromStorageZoneId &&
        (lotId === split.lotId || (!lotId && !split.lotId))
      );
    });

    if (!stockItem) {
      return {
        valid: false,
        error: "Combinaison zone/lot non trouvée en stock",
      };
    }

    const availableQuantity = parseFloat(stockItem.quantity || "0");
    if (split.quantity > availableQuantity) {
      return {
        valid: false,
        error: `Quantité insuffisante en stock (disponible: ${availableQuantity})`,
      };
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

  // Fonction pour générer les données du résumé des articles à livrer
  const generateSummaryData = () => {
    const summaryItems: Array<{
      articleId: number;
      article: Article;
      totalQuantity: number;
      zones: Array<{
        zoneId: number;
        zoneName: string;
        lotId: number | null;
        lotName: string;
        quantity: number;
        notes: string;
      }>;
    }> = [];

    items.forEach((item) => {
      if (item.quantity === 0) return;

      const articleId = item.articleId;
      const article = item.article;
      const quantity = item.quantity;
      const isRequired = isSplitRequired(articleId, quantity);
      const articleSplits = splits[articleId] || [];

      // Si répartition automatique
      if (!isRequired) {
        const autoSplit = createAutoSplit(articleId, quantity);
        if (autoSplit && autoSplit.length > 0) {
          const s = autoSplit[0];
          const stockInfo = getArticleStockInfo(articleId);
          const stockItem = stockInfo.find(
            (stock: any) =>
              stock.storageZoneId === s.fromStorageZoneId &&
              stock.lotId === s.lotId,
          );

          const zoneName =
            stockItem?.storageZone?.designation ||
            `Zone ${s.fromStorageZoneId || "-"}`;
          const lotName = stockItem?.lot?.code || "vide";

          summaryItems.push({
            articleId,
            article,
            totalQuantity: quantity,
            zones: [
              {
                zoneId: s.fromStorageZoneId || 0,
                zoneName,
                lotId: s.lotId,
                lotName,
                quantity: s.quantity,
                notes: item.notes || "",
              },
            ],
          });
        }
      } else if (articleSplits.length > 0) {
        // Si répartition manuelle
        const zones: Array<{
          zoneId: number;
          zoneName: string;
          lotId: number | null;
          lotName: string;
          quantity: number;
          notes: string;
        }> = [];

        articleSplits.forEach((split) => {
          const stockInfo = getArticleStockInfo(articleId);
          const stockItem = stockInfo.find(
            (stock: any) =>
              stock.storageZoneId === split.fromStorageZoneId &&
              stock.lotId === split.lotId,
          );

          const zoneName =
            stockItem?.storageZone?.designation ||
            `Zone ${split.fromStorageZoneId || "-"}`;
          const lotName = stockItem?.lot?.code || "vide";

          zones.push({
            zoneId: split.fromStorageZoneId || 0,
            zoneName,
            lotId: split.lotId,
            lotName,
            quantity: split.quantity,
            notes: item.notes || "",
          });
        });

        summaryItems.push({
          articleId,
          article,
          totalQuantity: quantity,
          zones,
        });
      }
    });

    return summaryItems;
  };

  const handleValidateDelivery = async (delivery: any) => {
    if (!delivery || !canStartDelivery(delivery.status)) {
      return;
    }
    var isOk = await confirmGlobal(
      "Validation de la livraison",
      "Confirmez-vous la validation de cette livraison ? Cette action est irréversible et entraînera le débit du stock.",
    );
    if (!isOk) return;

    try {
      await apiRequest(`/api/deliveries/${delivery.id}/start`, "POST");
      toast({
        title: "Livraison en cours",
        description: "Le stock a été déduit et l'opération d'inventaire créée.",
      });
      fetchPageData(delivery.orderId, delivery.id);
      resetForm();
    } catch (e: any) {
      toast({
        title: "Erreur lors de du changement d'etat de la livraison",
        description: e?.message || "Erreur inconnue",
        variant: "destructive",
      });
    }
  };
  const handlePartialDelivery = async (delivery: any) => {
    if (!canDeliver(delivery.status)) return;
    const confirmMessage = `Êtes-vous sûr de valider partiellement cette livraison ${delivery.code}  ?\n\nCette action est irréversible.`;
    var isOk = await confirmGlobal(
      "Validation partielle de la livraison",
      confirmMessage,
    );
    if (!isOk) return;
    setSelectedDelivery({ ...delivery, mode: "partial" });
    setIsCancelModalOpen(true);
  };

  const handleCancelDelivery = async (delivery: any) => {
    if (!canCancel(delivery.status)) return;
    const confirmMessage = `Êtes-vous sûr d'annuler cette livraison ${delivery.code}  ?\n\nCette action est irréversible.`;
    var isOk = await confirmGlobal(
      "Annulation de la livraison",
      confirmMessage,
    );
    if (!isOk) return;
    if (delivery.status == InventoryOperationStatus.PARTIALLY_COMPLETED) {
      // Pour l'annulation totale, appel a une nouvelle api et non a cancellationModal
    } else {
      setSelectedDelivery({ ...delivery, mode: "cancel" });
      setIsCancelModalOpen(true);
    }
  };

  const handleCancelModalSuccess = () => {
    setSelectedDelivery(null);
    setIsCancelModalOpen(false);
    // Recharger les livraisons et opérations
    queryClient.invalidateQueries({ queryKey: ["/api/inventory-operations"] });
    fetch("/api/inventory-operations")
      .then((r) => r.json())
      .then(setInventoryOperations);
  };

  const getRelatedOperations = (deliveryId: number) => {
    return inventoryOperations.filter(
      (op) =>
        op.parentOperationId === deliveryId ||
        (op.type === InventoryOperationType.LIVRAISON &&
          op.orderId === deliveryId),
    );
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
      case DateTypes.TODAY:
        return normalizedDeliveryDate.getTime() === normalizedToday.getTime();

      case DateTypes.YESTERDAY:
        return (
          normalizedDeliveryDate.getTime() === normalizedYesterday.getTime()
        );

      case DateTypes.TOMORROW:
        return (
          normalizedDeliveryDate.getTime() === normalizedTomorrow.getTime()
        );

      case DateTypes.RANGE: {
        // Si les deux vides → pas de filtre
        if (!filterDateFrom && !filterDateTo) return true;

        const fromDate = filterDateFrom
          ? normalizeDate(new Date(filterDateFrom))
          : null;
        const toDate = filterDateTo
          ? normalizeDate(new Date(filterDateTo))
          : null;

        if (fromDate && toDate) {
          return (
            normalizedDeliveryDate >= fromDate &&
            normalizedDeliveryDate <= toDate
          );
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

  const filteredDeliveries = pageData?.deliveries.filter((delivery) => {
    const matchesOrder =
      orderIdFilter === FILTER_ALL ||
      String(delivery.orderId ?? "") === orderIdFilter;
    const matchesDate =
      !filterDate ||
      filterDate === FILTER_ALL ||
      matchesDateFilter(delivery?.order?.deliveryDate);
    const matchesClient =
      clientIdFilter === FILTER_ALL ||
      String(delivery.clientId ?? "") === clientIdFilter;
    const matchesStatus =
      statusFilter === FILTER_ALL || delivery.status === statusFilter;
    // Ajoutez ici la logique de recherche si besoin
    return matchesOrder && matchesClient && matchesStatus && matchesDate;
  });

  return (
    <div className=" mx-auto p-6 pt-2 space-y-6">
      {/* livraisons d'une commande spécifique */}
      {orderId && (
        <Card className="flex items-center justify-between p-2 shadow-none border-none">
          {fromOrder && (
            <Button
              className="bg-primary text-white hover:bg-primary-hover "
              variant="outline"
              onClick={() => (window.location.href = "/orders")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux commandes
            </Button>
          )}
          {/* Affichage des informations de la commande liée */}
          {orderData && (
            <div
              className={`p-3 flex gap-3  text-blue-800 text-xs bg-blue-50 border border-blue-200 rounded-lg ${!fromOrder ? "w-full justify-around !text-base " : "w-auto"}`}
            >
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4 text-blue-600" />
                <p className="font-medium">
                  Commande: <b>{orderData.code}</b>
                </p>
              </span>
              <p>
                Client: <b>{getClientName(orderData.clientId || 0)}</b>
              </p>
              <p>
                Date de commande: <b>{formatDate(orderData.createdAt)}</b>
              </p>
              <p>
                Date prévu: <b>{formatDate(orderData.deliveryDate)}</b>
              </p>
              <p>
                Total:{" "}
                <b>
                  {parseFloat(orderData.totalTTC?.toString() || "0").toFixed(2)}{" "}
                  DA
                </b>
              </p>
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
                  <Select
                    value={orderIdFilter}
                    onValueChange={setOrderIdFilter}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filtrer par commande" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les commandes</SelectItem>
                      {pageData?.orders.map((order) => (
                        <SelectItem key={order.id} value={String(order.id)}>
                          {order.code} - {getClientName(order.clientId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={clientIdFilter}
                    onValueChange={setClientIdFilter}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filtrer par client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les clients</SelectItem>
                      {pageData?.clients.map((client) => (
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
                  <SelectItem value={InventoryOperationStatus.DRAFT}>
                    Brouillon
                  </SelectItem>
                  <SelectItem value={InventoryOperationStatus.PENDING}>
                    En attente
                  </SelectItem>
                  <SelectItem value={InventoryOperationStatus.READY}>
                    Prêt
                  </SelectItem>
                  <SelectItem value={InventoryOperationStatus.COMPLETED}>
                    Livré
                  </SelectItem>
                  <SelectItem
                    value={InventoryOperationStatus.PARTIALLY_COMPLETED}
                  >
                    Livré partiellement
                  </SelectItem>
                  <SelectItem value={InventoryOperationStatus.CANCELLED}>
                    Annulé
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Désactiver le bouton Nouvelle livraison */}
              {fromOrder && orderId && (
                <Button
                  onClick={startNewDelivery}
                  data-testid="button-new-delivery"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Nouvelle livraison
                </Button>
              )}
              {/* Dates */}
              <div className="flex  gap-3 items-end w-full">
                <div className="flex flex-1 gap-2 col-span-3">
                  <div className="flex flex-col space-y-1 flex-1">
                    <label className="text-xs text-gray-600">📅 Début</label>
                    <Input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => {
                        setFilterDateFrom(e.target.value);
                        setFilterDate(DateTypes.RANGE);
                      }}
                      data-testid="input-date-from"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex flex-col space-y-1 flex-1">
                    <label className="text-xs text-gray-600">📅 Fin</label>
                    <Input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => {
                        setFilterDateTo(e.target.value);
                        setFilterDate(DateTypes.RANGE);
                      }}
                      data-testid="input-date-to"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Boutons rapides */}
                <div className="flex  col-span-3 items-center justify-center gap-2">
                  {[
                    { label: "Aujourd'hui", value: DateTypes.TODAY },
                    { label: "Hier", value: DateTypes.YESTERDAY },
                    { label: "Demain", value: DateTypes.TOMORROW },
                  ].map(({ label, value }) => (
                    <Button
                      key={value}
                      variant={filterDate === value ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full ${
                        filterDate === value ? "bg-blue-600 text-white" : ""
                      }`}
                      onClick={() => {
                        const base = new Date();
                        let d: Date;
                        if (value === DateTypes.YESTERDAY)
                          d = new Date(base.getTime() - 86400000);
                        else if (value === DateTypes.TOMORROW)
                          d = new Date(base.getTime() + 86400000);
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
                      setFilterDate(FILTER_ALL);
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
              Liste des livraisons ({filteredDeliveries?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  {!orderId && <TableHead>Client</TableHead>}
                  {!orderId && <TableHead>Commande</TableHead>}

                  <TableHead>Total TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Livreur</TableHead>
                  <TableHead>Date validation</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    % de la commande
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveriesLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={orderId ? 6 : 8}
                      className="text-center py-8"
                    >
                      Chargement des livraisons...
                    </TableCell>
                  </TableRow>
                ) : filteredDeliveries?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Aucune livraison trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeliveries?.map((delivery) => (
                    <TableRow
                      key={delivery.id}
                      data-testid={`row-delivery-${delivery.id}`}
                    >
                      <TableCell
                        className={`font-medium cursor-pointer ${currentDelivery?.id == delivery.id ? "border-l-8 border-l-orange-500" : ""}`}
                        onClick={() =>
                          selectCurrentOrderAndDelivery(
                            delivery.orderId,
                            delivery.id,
                          )
                        }
                      >
                        {delivery.code}
                      </TableCell>

                      {!orderId && (
                        <>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <b className="text-red-900">
                                {getClientName(delivery.clientId || 0)}
                              </b>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getOrderCode(delivery.orderId)}
                          </TableCell>
                        </>
                      )}

                      <TableCell className="font-semibold">
                        {parseFloat(delivery.totalTtc || "0").toFixed(2)} DA
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell>
                        <b>
                          {delivery.deliveryPerson?.firstName}{" "}
                          {delivery.deliveryPerson?.lastName || "-"}
                        </b>
                      </TableCell>

                      <TableCell className="w-52">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(delivery.validatedAt)}
                        </div>
                      </TableCell>
                      <TableCell className="w-44 hidden lg:table-cell">
                        <div className="relative w-full">
                          <Progress
                            value={
                              (delivery.totalDelivred / delivery.totalOrdred) *
                              100
                            }
                            className="h-3"
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium ">
                            {Math.round(
                              (delivery.totalDelivred / delivery.totalOrdred) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="min-w-[14rem]"
                            >
                              <DropdownMenuLabel>
                                Livraison {delivery.code}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => viewDelivery(delivery)}
                                data-testid={`button-view-delivery-${delivery.id}`}
                              >
                                <Eye className="h-4 w-4" /> Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => editDelivery(delivery)}
                                disabled={!canUpdate(delivery.status)}
                                data-testid={`button-edit-delivery-${delivery.id}`}
                              >
                                <Edit3 className="h-4 w-4" /> Modifier
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={
                                  !canDelete(delivery.status) ||
                                  deleteDeliveryMutation.isPending
                                }
                                onClick={async () => {
                                  if (!canDelete(delivery.status)) {
                                    toast({
                                      title: "Suppression impossible",
                                      description:
                                        "Les livraisons validées ne peuvent pas être supprimées",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  const confirmMessage = `Êtes-vous sûr de vouloir supprimer la livraison ${delivery.code} ?\n\nCette action est irréversible.`;
                                  var isOk = await confirmGlobal(
                                    "Supression de la livraison",
                                    confirmMessage,
                                  );
                                  if (isOk) {
                                    deleteDeliveryMutation.mutate(delivery.id);
                                  }
                                }}
                                data-testid={`button-delete-delivery-${delivery.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />{" "}
                                Supprimer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                disabled={
                                  !canValidate(delivery.status) &&
                                  !canInValidate(delivery.status)
                                }
                                onClick={() => {
                                  if (canValidate(delivery.status)) {
                                    updateDeliveryStateMutation.mutate({
                                      id: delivery.id,
                                      status: InventoryOperationStatus.READY,
                                    });
                                  } else if (canInValidate(delivery.status)) {
                                    updateDeliveryStateMutation.mutate({
                                      id: delivery.id,
                                      status: InventoryOperationStatus.DRAFT,
                                    });
                                  }
                                }}
                                data-testid={`button-cancel-delivery-${delivery.id}`}
                              >
                                <Package
                                  className={`h-4 w-4 ${canValidate(delivery.status) ? "text-green-500" : "text-red-500"}`}
                                />
                                {canValidate(delivery.status) && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                                {!canValidate(delivery.status) && (
                                  <CircleX className="h-4 w-4 text-red-500" />
                                )}
                                {canValidate(delivery.status)
                                  ? "Valider (prête à livrer)"
                                  : "Annuler validation"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canStartDelivery(delivery.status)}
                                onClick={() => handleValidateDelivery(delivery)}
                                data-testid={`button-cancel-delivery-${delivery.id}`}
                              >
                                <Truck className="h-4 w-4 text-orange-500" />
                                <AlarmClock className="h-4 w-4 text-orange-500" />{" "}
                                Débuter la livraison
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canDeliver(delivery.status)}
                                onClick={() => handlePartialDelivery(delivery)}
                                data-testid={`button-cancel-delivery-${delivery.id}`}
                              >
                                <Truck className="h-4 w-4 text-purple-500" />
                                <Check className="h-4 w-4 text-purple-500" />{" "}
                                Livrer partiellement
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canDeliver(delivery.status)}
                                onClick={async () => {
                                  if (canDeliver(delivery.status)) {
                                    const confirmMessage = `Êtes-vous sûr que cette livraison ${delivery.code} est totalement livrée ?\n\nCette action est irréversible.`;
                                    var isOk = await confirmGlobal(
                                      "Completion de la livraison",
                                      confirmMessage,
                                    );
                                    if (isOk) {
                                      updateDeliveryStateMutation.mutate({
                                        id: delivery.id,
                                        status:
                                          InventoryOperationStatus.COMPLETED,
                                      });
                                    }
                                  }
                                }}
                                data-testid={`button-cancel-delivery-${delivery.id}`}
                              >
                                <>
                                  {" "}
                                  <Truck className="h-4 w-4 text-green-500" />
                                  <CheckCircle className="h-4 w-4 text-green-500" />{" "}
                                  Livrer tout
                                </>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canCancel(delivery.status)}
                                onClick={() => handleCancelDelivery(delivery)}
                                data-testid={`button-cancel-delivery-${delivery.id}`}
                              >
                                <CircleX className="h-4 w-4 text-red-500" />{" "}
                                Annuler
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                disabled={
                                  !canAssignDeliveryPerson(delivery.status)
                                }
                                onClick={() =>
                                  setAssignmentModal({ open: true, delivery })
                                }
                              >
                                <User className="h-4 w-4" />{" "}
                                {delivery.deliveryPersonId
                                  ? "Changer le"
                                  : "Assigner un"}{" "}
                                livreur
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={
                                  delivery.status ===
                                    InventoryOperationStatus.CANCELLED ||
                                  delivery.status ===
                                    InventoryOperationStatus.COMPLETED
                                }
                                onClick={() =>
                                  setPackagesModal({ open: true, delivery })
                                }
                              >
                                <Package className="h-4 w-4" /> Gérer les colis
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={
                                  delivery.status ===
                                    InventoryOperationStatus.CANCELLED ||
                                  delivery.status ===
                                    InventoryOperationStatus.COMPLETED
                                }
                                onClick={() =>
                                  setTrackingModal({ open: true, delivery })
                                }
                              >
                                <Truck className="h-4 w-4" /> Suivi de livraison
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={
                                  delivery.status ===
                                  InventoryOperationStatus.CANCELLED
                                }
                                onClick={() =>
                                  setPaymentModal({ open: true, delivery })
                                }
                              >
                                <CreditCard className="h-4 w-4" /> Paiement à la
                                livraison
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <div>
                            {" "}
                            {(delivery.status ===
                              InventoryOperationStatus.CANCELLED ||
                              delivery.status ===
                                InventoryOperationStatus.PARTIALLY_COMPLETED) && (
                              <CancellationDetails
                                delivery={{
                                  ...delivery,
                                  cancellationReason:
                                    delivery.cancellationReason || undefined,
                                }}
                                inventoryOperations={getRelatedOperations(
                                  delivery.id,
                                )}
                              />
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        // Affichage du formulaire
        (isEditing || isViewing) &&
        currentDelivery && (
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
                  {/* <Button variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button> */}
                  <span className="w-52 m-auto"> Date livraison</span>

                  <Input
                    type="date"
                    value={currentDelivery.scheduledDate}
                    onChange={(e) => {
                      setCurrentDelivery({
                        ...currentDelivery,
                        scheduledDate: e.target.value,
                      });
                    }}
                    className="text-center"
                  />
                  <Button onClick={saveDelivery} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {currentDelivery.id ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              )}
            </Card>
            {/* Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Articles à livrer ({items.length})</span>
                  {currentDelivery.orderId && orderData && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Livraison {currentDelivery.code}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Détails</TabsTrigger>
                    <TabsTrigger value="summary">Résumé</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Article</TableHead>
                          <TableHead className="text-center text-red-900">
                            Quantité commandée
                          </TableHead>
                          <TableHead className="text-center">
                            Quantité déjà livrée
                          </TableHead>
                          <TableHead className="text-center">
                            Quantité restante
                          </TableHead>
                          <TableHead className="text-center">
                            Stock total
                          </TableHead>
                          <TableHead className="text-center">
                            Stock disponible
                          </TableHead>
                          <TableHead className="bg-green-100 text-green-900 font-bold text-center">
                            Quantité à livrer
                          </TableHead>
                          <TableHead className="text-center">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              <span className="text-lg font-bold text-red-900 uppercase">
                                {" "}
                                Aucun produit à livrer
                              </span>
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((item) => {
                            if (!orderId) return;
                            // Utiliser les données optimisées de l'API avec la bonne clé de cache
                            const cacheKey = currentDelivery?.id
                              ? `${orderId}-${currentDelivery.id}`
                              : `${orderId}-none`;
                            const orderItem = orderDeliveryDetails[
                              cacheKey
                            ]?.items.find(
                              (oi: any) => oi.articleId === item.articleId,
                            );
                            const orderedQuantity = orderItem
                              ? orderItem.quantityOrdered
                              : 0;
                            const deliveredQuantity = orderItem
                              ? orderItem.quantityDelivered
                              : 0;
                            const remainingQuantity = orderItem
                              ? orderItem.quantityRemaining
                              : 0;
                            const articleData = pageData?.articles.find(
                              (a: any) =>
                                a.id === (item.article?.id ?? item.articleId),
                            );
                            const totalStock = articleData?.totalStock ?? 0;
                            const availableStock = articleData?.totalDispo ?? 0;
                            const maxQte = Math.min(
                              remainingQuantity,
                              availableStock,
                            );

                            const articleSplits = splits[item.articleId] || [];
                            const splitSum = getSplitSum(item.articleId);
                            const isRequired = isSplitRequired(
                              item.articleId,
                              item.quantity,
                            );
                            const hasValidSplit =
                              articleSplits.length > 0 &&
                              Math.abs(splitSum - item.quantity) < 0.001;
                            const isExpanded =
                              expandedArticleId === item.articleId;
                            return (
                              <React.Fragment key={item.id}>
                                <TableRow className="text-lg cursor-pointer hover:bg-slate-50 transition-all duration-200 ease-in-out group">
                                  <TableCell
                                    className="p-2"
                                    onClick={() =>
                                      setExpandedArticleId(
                                        isExpanded ? null : item.articleId,
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-4 text-xs font-bold flex-1">
                                        <img
                                          src={item.article?.photo}
                                          alt="vérifier photo"
                                          className="w-[4rem] h-[3rem] object-cover rounded-lg shadow-sm"
                                        />
                                        <span className="text-gray-900">
                                          {item.article
                                            ? item.article?.name
                                            : item.articleId}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`transform transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                                        >
                                          <svg
                                            className="w-4 h-4 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M19 9l-7 7-7-7"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center p-2 text-red-900">
                                    {orderedQuantity + " " + item.article.unit}
                                  </TableCell>
                                  <TableCell className="text-center p-2">
                                    {deliveredQuantity +
                                      " " +
                                      item.article.unit}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {remainingQuantity +
                                      " " +
                                      item.article.unit}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {totalStock + " " + item.article.unit}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {availableStock + " " + item.article.unit}
                                  </TableCell>
                                  <TableCell className="bg-green-100 text-center">
                                    {isEditing ? (
                                      <Input
                                        type="number"
                                        min="0"
                                        max={maxQte}
                                        step="1"
                                        value={item.quantity}
                                        onChange={(e) => {
                                          const newQuantity =
                                            parseFloat(e.target.value) || 0;
                                          if (
                                            newQuantity <= maxQte &&
                                            newQuantity <= orderedQuantity
                                          ) {
                                            updateItemQuantity(
                                              item.id,
                                              newQuantity,
                                            );
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
                                        onChange={(e) =>
                                          setItems(
                                            items.map((i) =>
                                              i.id === item.id
                                                ? {
                                                    ...i,
                                                    notes: e.target.value,
                                                  }
                                                : i,
                                            ),
                                          )
                                        }
                                        placeholder="Notes..."
                                        className="w-32"
                                      />
                                    ) : (
                                      item.notes || "-"
                                    )}
                                  </TableCell>
                                  <TableCell
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Empêche la propagation du clic pour ne pas toggle l'accordion */}
                                    {(() => {
                                      const articleId = item.articleId;
                                      const quantity = item.quantity;
                                      const splitSum = getSplitSum(articleId);
                                      const isRequired = isSplitRequired(
                                        articleId,
                                        quantity,
                                      );
                                      const hasValidSplit =
                                        splits[articleId] &&
                                        splits[articleId].length > 0 &&
                                        Math.abs(splitSum - quantity) < 0.001;
                                      if (quantity === 0) {
                                        return (
                                          <span className="text-gray-400">
                                            -
                                          </span>
                                        );
                                      }
                                      if (!isRequired) {
                                        return (
                                          <span className="text-sm text-blue-600 font-medium">
                                            ✓ Répartition auto.
                                          </span>
                                        );
                                      }

                                      return (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              setSplitModal({
                                                open: true,
                                                articleId: item.articleId,
                                              })
                                            }
                                          >
                                            {hasValidSplit ? (
                                              <CheckCircle className="text-green-600 inline-block mr-1" />
                                            ) : (
                                              <AlertTriangle className="text-yellow-500 inline-block mr-1" />
                                            )}
                                            Répartir
                                          </Button>
                                        </>
                                      );
                                    })()}
                                  </TableCell>
                                </TableRow>
                                {/* Ligne de split affichée si expanded */}
                                {isExpanded && (
                                  <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50">
                                    <TableCell colSpan={12} className="p-0">
                                      <div className="p-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                          {/* En-tête du tableau */}
                                          <div className="bg-gray-50 px-4 py-3 border-b">
                                            <h4 className="font-semibold text-gray-800 text-sm">
                                              Détails des livraisons
                                            </h4>
                                          </div>

                                          {/* Tableau unifié */}
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                              <thead className="bg-gray-100">
                                                <tr>
                                                  <th className="px-3 py-2 w-60 max-w-60 text-left font-medium text-gray-700">
                                                    Livraison
                                                  </th>
                                                  <th className="px-3 py-2 w-60 max-w-60 text-left font-medium text-gray-700">
                                                    Zone de stockage
                                                  </th>
                                                  <th className="px-3 py-2 w-48 max-w-48  text-left font-medium text-gray-700">
                                                    Lot
                                                  </th>
                                                  <th className="px-3 py-2 w-28 max-w-28  text-right font-medium text-gray-700">
                                                    Quantité
                                                  </th>
                                                  <th className="px-3 py-2  text-left font-medium text-gray-700">
                                                    Statut
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-200">
                                                {/* Livraisons à venir (en haut) */}
                                                {(() => {
                                                  const upcomingRows = [];

                                                  // Si répartition automatique
                                                  if (!isRequired) {
                                                    const autoSplit =
                                                      createAutoSplit(
                                                        item.articleId,
                                                        item.quantity,
                                                      );
                                                    if (
                                                      autoSplit &&
                                                      autoSplit.length > 0
                                                    ) {
                                                      const s = autoSplit[0];
                                                      const article =
                                                        pageData?.articles.find(
                                                          (a) =>
                                                            a.id ===
                                                            item.articleId,
                                                        );
                                                      const stockInfo =
                                                        (article as any)
                                                          ?.stockInfo || [];
                                                      const stockItem =
                                                        stockInfo.find(
                                                          (stock: any) =>
                                                            stock.storageZoneId ===
                                                              s.fromStorageZoneId &&
                                                            stock.lotId ===
                                                              s.lotId,
                                                        );

                                                      const zoneName =
                                                        stockItem?.storageZone
                                                          ?.designation ||
                                                        `Zone ${s.fromStorageZoneId || "-"}`;
                                                      const lotName =
                                                        stockItem?.lot?.code ||
                                                        "vide";

                                                      upcomingRows.push(
                                                        <tr
                                                          key="auto-split"
                                                          className="bg-blue-50 hover:bg-blue-100"
                                                        >
                                                          <td className="px-3 font-bold text-blue-900">
                                                            Livraison courante
                                                          </td>
                                                          <td className="px-3 py-2   ">
                                                            <div className="flex items-center gap-2">
                                                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                              <span className="font-medium text-gray-900">
                                                                {zoneName}
                                                              </span>
                                                            </div>
                                                          </td>
                                                          <td className="px-3 py-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                              {lotName}
                                                            </span>
                                                          </td>
                                                          <td className="px-3 py-2 text-right">
                                                            <span className="font-bold text-blue-700">
                                                              {s.quantity}{" "}
                                                              {item.article
                                                                ?.unit || ""}
                                                            </span>
                                                          </td>
                                                          <td className="px-3 py-2">
                                                            <Badge
                                                              variant="secondary"
                                                              className="bg-blue-100 text-blue-800"
                                                            >
                                                              <Truck className="h-3 w-3 mr-1" />
                                                              En cours
                                                            </Badge>
                                                          </td>
                                                        </tr>,
                                                      );
                                                    }
                                                  }

                                                  // Si répartition manuelle
                                                  if (
                                                    isRequired &&
                                                    articleSplits.length > 0
                                                  ) {
                                                    articleSplits.forEach(
                                                      (split, idx) => {
                                                        const article =
                                                          pageData?.articles.find(
                                                            (a) =>
                                                              a.id ===
                                                              item.articleId,
                                                          );
                                                        const stockInfo =
                                                          (article as any)
                                                            ?.stockInfo || [];
                                                        const stockItem =
                                                          stockInfo.find(
                                                            (stock: any) =>
                                                              stock.storageZoneId ===
                                                                split.fromStorageZoneId &&
                                                              stock.lotId ===
                                                                split.lotId,
                                                          );

                                                        const zoneName =
                                                          stockItem?.storageZone
                                                            ?.designation ||
                                                          `Zone ${split.fromStorageZoneId || "-"}`;
                                                        const lotName =
                                                          stockItem?.lot
                                                            ?.code || "vide";

                                                        upcomingRows.push(
                                                          <tr
                                                            key={`manual-split-${idx}`}
                                                            className="bg-blue-50 hover:bg-blue-100"
                                                          >
                                                            <td className="px-3 font-bold text-blue-900">
                                                              Livraison courante
                                                            </td>
                                                            <td className="px-3 py-2">
                                                              <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                <span className="font-medium text-gray-900">
                                                                  {zoneName}
                                                                </span>
                                                              </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                {lotName}
                                                              </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                              <span className="font-bold text-blue-700">
                                                                {split.quantity}{" "}
                                                                {item.article
                                                                  ?.unit || ""}
                                                              </span>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                              <Badge
                                                                variant="outline"
                                                                className="bg-blue-100 text-blue-800"
                                                              >
                                                                <Edit3 className="h-3 w-3 mr-1" />
                                                                En cours
                                                              </Badge>
                                                            </td>
                                                          </tr>,
                                                        );
                                                      },
                                                    );
                                                  }

                                                  // Si aucun split sélectionné
                                                  if (
                                                    isRequired &&
                                                    articleSplits.length === 0
                                                  ) {
                                                    upcomingRows.push(
                                                      <tr className="bg-blue-50">
                                                        <td
                                                          colSpan={4}
                                                          className="px-3 py-4 text-center"
                                                        >
                                                          <div className="flex items-center justify-center gap-2 text-blue-600">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            <span className="italic">
                                                              Aucune répartition
                                                              sélectionnée
                                                            </span>
                                                          </div>
                                                        </td>
                                                      </tr>,
                                                    );
                                                  }

                                                  return upcomingRows;
                                                })()}

                                                {/* Livraisons effectuées (en bas) */}
                                                {(() => {
                                                  const deliveredItems =
                                                    pageData?.deliveries
                                                      .filter(
                                                        (f) =>
                                                          f.id !=
                                                          currentDelivery?.id,
                                                      )
                                                      .flatMap((delivery) =>
                                                        (
                                                          delivery.items || []
                                                        ).map((it: any) => ({
                                                          ...it,
                                                          delivery,
                                                        })),
                                                      )
                                                      .filter(
                                                        (it) =>
                                                          it.articleId ===
                                                          item.articleId,
                                                      );

                                                  if (
                                                    deliveredItems?.length === 0
                                                  ) {
                                                    return (
                                                      <tr className="bg-green-50">
                                                        <td
                                                          colSpan={5}
                                                          className="px-3 py-4 text-center text-green-600 italic"
                                                        >
                                                          Aucune livraison
                                                          effectuée pour cet
                                                          article
                                                        </td>
                                                      </tr>
                                                    );
                                                  }

                                                  return deliveredItems?.map(
                                                    (it, idx) => {
                                                      const zoneName =
                                                        it.fromStorageZone
                                                          ?.designation ||
                                                        `Zone ${it.fromStorageZoneId || "-"}`;
                                                      const lotName =
                                                        it.lot?.code || `vide`;

                                                      return (
                                                        <tr
                                                          key={`delivered-${idx}`}
                                                          className="bg-green-50 hover:bg-green-100"
                                                        >
                                                          <td className="px-3 font-bold text-blue-900">
                                                            {it.delivery?.code}
                                                          </td>
                                                          <td className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                              <span className="font-medium text-gray-900">
                                                                {zoneName}
                                                              </span>
                                                            </div>
                                                          </td>
                                                          <td className="px-3 py-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                              {lotName}
                                                            </span>
                                                          </td>
                                                          <td className="px-3 py-2 text-right">
                                                            <span className="font-bold text-green-700">
                                                              {it.qteLivree ||
                                                                it.quantity ||
                                                                "-"}{" "}
                                                              {item.article
                                                                ?.unit || ""}
                                                            </span>
                                                          </td>
                                                          <td className="px-3 py-2">
                                                            <Badge
                                                              variant="default"
                                                              className="bg-green-100 text-green-800"
                                                            >
                                                              <CheckCircle className="h-3 w-3 mr-1" />
                                                              {it.delivery
                                                                ?.status ||
                                                                "Livré"}
                                                            </Badge>
                                                          </td>
                                                        </tr>
                                                      );
                                                    },
                                                  );
                                                })()}
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
                  </TabsContent>

                  <TabsContent value="summary" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Article</TableHead>
                          <TableHead className="text-center">
                            Quantité à livrer
                          </TableHead>
                          <TableHead className="text-center">Zone</TableHead>
                          <TableHead className="text-center">Lot</TableHead>
                          <TableHead className="text-center">
                            Quantité par zone
                          </TableHead>
                          <TableHead className="text-center">Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const summaryData = generateSummaryData();

                          if (summaryData.length === 0) {
                            return (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center py-8"
                                >
                                  <span className="text-lg font-bold text-red-900 uppercase">
                                    {" "}
                                    Aucun produit à livrer
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return summaryData
                            .map((summaryItem) => {
                              const {
                                articleId,
                                article,
                                totalQuantity,
                                zones,
                              } = summaryItem;

                              return zones.map((zone, zoneIndex) => (
                                <TableRow key={`${articleId}-${zoneIndex}`}>
                                  {zoneIndex === 0 && (
                                    <TableCell
                                      rowSpan={zones.length}
                                      className="p-2"
                                    >
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={article?.photo || ""}
                                          alt={article?.name || ""}
                                          className="w-[4rem] h-[3rem] object-cover rounded-lg shadow-sm"
                                        />
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {article?.name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {article?.unit}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  )}
                                  {zoneIndex === 0 && (
                                    <TableCell
                                      rowSpan={zones.length}
                                      className="text-center p-2"
                                    >
                                      <div className="font-bold text-green-700">
                                        {totalQuantity} {article?.unit}
                                      </div>
                                    </TableCell>
                                  )}
                                  <TableCell className="text-center p-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span className="font-medium text-gray-900">
                                        {zone.zoneName}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center p-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      {zone.lotName}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center p-2">
                                    <span className="font-bold text-blue-700">
                                      {zone.quantity} {article?.unit}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center p-2">
                                    <span className="text-sm text-gray-600">
                                      {zone.notes || "-"}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ));
                            })
                            .flat();
                        })()}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            {/* Form */}
          </div>
        )
      )}

      {/* Modal de répartition amélioré */}
      <DeliverySplitModal
        isViewing={isViewing}
        open={splitModal.open}
        onOpenChange={(open: boolean) =>
          setSplitModal({ open, articleId: splitModal.articleId })
        }
        articleId={splitModal.articleId}
        articleName={
          splitModal.articleId
            ? items.find((i) => i.articleId === splitModal.articleId)
                ?.articleName || ""
            : ""
        }
        requestedQuantity={
          splitModal.articleId
            ? items.find((i) => i.articleId === splitModal.articleId)
                ?.quantity || 0
            : 0
        }
        existingSplits={
          splitModal.articleId ? splits[splitModal.articleId] || [] : []
        }
        excludeDeliveryId={currentDelivery?.id}
        onSplitValidated={(
          newSplits: Array<{
            lotId: number | null;
            fromStorageZoneId: number | null;
            quantity: number;
          }>,
        ) => {
          if (splitModal.articleId && !isViewing) {
            setSplits((s) => ({ ...s, [splitModal.articleId!]: newSplits }));
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
        onSuccess={async () => {
          await fetchPageData(orderId);
        }}
      />

      <DeliveryPackagesModal
        open={packagesModal.open}
        onOpenChange={(open) => setPackagesModal({ open, delivery: null })}
        delivery={packagesModal.delivery}
        onSuccess={async () => {
          await fetchPageData(orderId);
        }}
      />

      <DeliveryTrackingModal
        open={trackingModal.open}
        onOpenChange={(open) => setTrackingModal({ open, delivery: null })}
        delivery={trackingModal.delivery}
        onSuccess={async () => {
          await fetchPageData(orderId);
        }}
      />

      <DeliveryPaymentModal
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal({ open, delivery: null })}
        delivery={paymentModal.delivery}
        onSuccess={async () => {
          await fetchPageData(orderId);
        }}
      />
    </div>
  );
}
