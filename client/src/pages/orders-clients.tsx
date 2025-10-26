import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery as useQueryTanstack } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Plus,
  Minus,
  Calendar,
  Package,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Check,
  X,
  DollarSign,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Undo2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type {
  Order,
  OrderItem,
  Client,
  Article,
  ArticleCategory,
  Tax,
} from "@shared/schema";

import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArticleCategoryType } from "@shared/constants";

const orderTypeLabels = {
  quote: 'Devis',
  order: 'Commande'
}
const orderStatusLabels = {
  draft: "Devis (brouillon)",
  confirmed: "Confirmée",
  validated: "Validée",
  prepared: "Préparée",
  ready: "Prête",
  partially_delivered: "Livrée partiellement",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const orderStatusColors = {
  draft: "bg-gray-200 text-gray-800",
  confirmed: "bg-blue-400 text-white",
  validated: "bg-green-500 text-white",
  prepared: "bg-indigo-300 text-white",
  ready: "bg-yellow-400 text-black",
  partially_delivered: "bg-orange-400 text-white",
  delivered: "bg-green-700 text-white",
  cancelled: "bg-red-500 text-white"
} as const;

interface CartItem {
  articleId: number;
  article: Article;
  quantity: number;
}

interface OrderFormData {
  clientId: number;
  deliveryDate: string;
  status: string;
  notes: string;
  items: Array<{
    articleId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
    taxAmount: number;
  }>;
}

export default function ClientOrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États locaux
  const [currentView, setCurrentView] = useState<"orders" | "shop" | "cart">(
    "orders",
  );
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderStatus, setOrderStatus] = useState<string>("draft");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  // Récupérer le client connecté via son userId
  const storedUser = localStorage.getItem("user");
  let currentClientId = null;
  if (storedUser) {
    currentClientId = JSON.parse(storedUser)?.clientId;
    console.log("client id for this user ", currentClientId);
  }

  // Queries
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data) =>
      data?.filter((order: Order) => order.clientId === currentClientId),
    enabled: !!currentClientId,
  });
  const { data: categories = [] } = useQuery<ArticleCategory[]>({
    queryKey: ["/api/article-categories"],
    select: (data) =>
      data?.filter((cat: ArticleCategory) => cat.forSale && cat.active),
  });

  const { data: products = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    select: (data) =>
      data?.filter(
        (article: Article) =>
          article.type === ArticleCategoryType.PRODUCT &&
          article.allowSale &&
          article.active &&
          (!selectedCategory || article.saleCategoryId === selectedCategory),
      ),
  });

  // Récupérer les taxes pour les calculs
  const { data: taxes = [] } = useQuery<Tax[]>({
    queryKey: ["/api/taxes"],
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      console.log("🔥 CREATING ORDER - Data:", orderData);

      const order = await apiRequest("/api/ordersWithItems", "POST", {
        order: {
          type: "order",
          clientId: orderData.clientId,
          deliveryDate: orderData.deliveryDate,
          notes: orderData.notes,
          status: "draft",
        },
        items: orderData.items.map((f) => ({ orderId: 0, ...f })),
      });

      console.log("🔥 ORDER CREATED - Order:", order);

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setCart([]);
      setDeliveryDate("");
      setOrderNotes("");
      setCurrentView("orders");
      toast({ title: "Commande créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (orderData: { id: number } & OrderFormData) => {
      console.log("🔥 UPDATING ORDER - Data:", orderData);
      const order = await apiRequest(
        `/api/ordersWithItems/${orderData.id}`,
        "PUT",
        {
          order: {
            clientId: orderData.clientId,
            deliveryDate: orderData.deliveryDate,
            notes: orderData.notes,
            status: orderData.status,
          },
          items: orderData.items.map((f) => ({ orderId: 0, ...f })),
        },
      );

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setEditingOrder(null);
      setCart([]);
      setDeliveryDate("");
      setOrderNotes("");
      setCurrentView("orders");
      toast({ title: "Commande modifiée avec succès" });
    },
    onError: () => {
      toast({
        title: "Erreur lors de la modification",
        variant: "destructive",
      });
    },
  });

  const changeOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/orders/${id}`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Statut changé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors du changement de statut", variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/orders/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  // Fonctions du panier
  const addToCart = (product: Article) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.articleId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.articleId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        { articleId: product.id, article: product, quantity: 1 },
      ];
    });
  };

  const updateCartQuantity = (articleId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(articleId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.articleId === articleId ? { ...item, quantity } : item,
      ),
    );
  };

  const removeFromCart = (articleId: number) => {
    setCart((prev) => prev.filter((item) => item.articleId !== articleId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.article.salePrice || "0");
      return total + price * item.quantity;
    }, 0);
  };

  // Calculer les totaux avec TVA
  const calculateOrderTotals = (items: CartItem[]) => {
    let totalHT = 0;
    let totalTVA = 0;

    items.forEach((item) => {
      const priceHT = parseFloat(item.article.salePrice || "0");

      // Récupérer le taux de TVA depuis la table taxes
      let taxRate = 0;
      if (item.article.taxId && taxes.length > 0) {
        const tax = taxes.find((t: Tax) => t.id === item.article.taxId);
        if (tax) {
          taxRate = parseFloat(tax.rate?.toString() || "0");
        }
      }

      const itemTotalHT = priceHT * item.quantity;
      const itemTVA = (itemTotalHT * taxRate) / 100;

      totalHT += itemTotalHT;
      totalTVA += itemTVA;
    });

    const totalTTC = totalHT + totalTVA;

    return {
      totalHT: parseFloat(totalHT.toFixed(2)),
      totalTVA: parseFloat(totalTVA.toFixed(2)),
      totalTTC: parseFloat(totalTTC.toFixed(2)),
    };
  };

  const createOrder = () => {
    setCurrentView("shop");
    setCart([]);
    setDeliveryDate("");
    setOrderNotes("");
    setOrderStatus("draft");
    setEditingOrder(null);
  };

  const handleCreateOrder = () => {
    if (!currentClientId) {
      toast({
        title: "Erreur: Client non identifié",
        variant: "destructive",
      });
      return;
    }

    if (!deliveryDate) {
      toast({
        title: "Veuillez sélectionner une date de livraison",
        variant: "destructive",
      });
      return;
    }

    const orderData: OrderFormData = {
      clientId: currentClientId,
      deliveryDate: deliveryDate,
      notes: orderNotes,
      status: editingOrder?.status || orderStatus || "draft",
      items: cart.map((item) => ({
        articleId: item.articleId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.article.salePrice || "0"),
        taxRate: parseFloat(
          taxes.find((t: Tax) => t.id === item.article.taxId)?.rate || "0",
        ),
        taxAmount:
          (parseFloat(
            taxes.find((t: Tax) => t.id === item.article.taxId)?.rate || "0",
          ) /
            100) * item.quantity *
          parseFloat(item.article.salePrice || "0"),
        totalPrice: parseFloat(item.article.salePrice || "0") * item.quantity,
      })),
    };

    console.log("🔥 ORDER FORM DATA:", orderData);

    if (editingOrder) {
      updateOrderMutation.mutate({ id: editingOrder.id, ...orderData });
    } else {
      createOrderMutation.mutate(orderData);
    }
  };

  const handleEditOrder = async (order: Order) => {
    try {
      setEditingOrder(order);

      //  Charger les items de la commande
      const res = await apiRequest(`/api/orders/${order.id}/items`, "GET");

      const orderItems = await res.json();

      const cartItems: CartItem[] = [];

      // Vérifier que orderItems est bien un tableau
      console.log("**** order items:", orderItems);
      if (Array.isArray(orderItems)) {
        for (const item of orderItems) {
          const product = products.find((p) => p.id === item.articleId);
          console.log("**** article product", product, item.articleId);
          if (product) {
            cartItems.push({
              articleId: item.articleId,
              article: product,
              quantity: parseFloat(item.quantity?.toString() || "1"),
            });
          }
        }
      }

      setCart(cartItems);
      setDeliveryDate(order.deliveryDate?.split(" ")[0] || "");
      setOrderNotes(order.notes || "");
      (order.status || "draft");
      setCurrentView("shop");
    } catch (error) {
      console.error(
        "Erreur lors du chargement des items de la commande:",
        error,
      );
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la commande",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = (order: Order) => {
    if (order.status !== "draft") {
      toast({
        title: "Action non autorisée",
        description:
          "Seules les commandes en brouillon peuvent être supprimées",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      deleteOrderMutation.mutate(order.id);
    }
  };

  const handleValidateQuote = (order: Order) => {
    if (confirm("Confirmer la validation de cette commande ?")) {
      changeOrderStatusMutation.mutate({
        id: order.id,
        status: "confirmed",
      });
    }
  };

  const handleRevertOrder = (order: Order) => {
    if (confirm("Annuler la validation de la commande ?")) {
      changeOrderStatusMutation.mutate({
        id: order.id,
        status: "draft",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  var result = <div></div>;
  // Vue principale des commandes
  if (currentView === "orders") {
    result = (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Mes Commandes
              </h1>
              <p className="text-gray-600">
                Gérez vos commandes et passez de nouvelles commandes
              </p>
            </div>
            <Button
              onClick={() => createOrder()}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle Commande
            </Button>
          </div>

          {/* Liste des commandes compacte */}
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Chargement...</p>
              </div>
            ) : orders.length === 0 ? (
              <Card className="text-center py-8 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardContent>
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune commande
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Vous n'avez pas encore passé de commande
                  </p>
                  <Button
                    onClick={() => setCurrentView("shop")}
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    Commencer mes achats
                  </Button>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card
                  key={order.id}
                  className="bg-white/70 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {order.code}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs px-3 py-1 rounded-full border-gray-300 text-gray-800 "
                            >
                              {order.status == 'draft' ? 'Devis' : 'Commande'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs px-2 py-1 ${orderStatusColors[order.status as keyof typeof orderStatusLabels]} `

                              }
                            >
                              {
                                orderStatusLabels[order.status as keyof typeof orderStatusLabels]
                              }
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-2">
                          <span>Créée le {formatDate(order.createdAt)}</span>
                          {order.deliveryDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(order.deliveryDate)}
                            </span>
                          )}
                        </div>

                        {order.notes && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded line-clamp-1">
                            {order.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">
                            {parseFloat(
                              order.totalTTC?.toString() || "0",
                            ).toFixed(2)}{" "}
                            DA TTC
                          </div>
                          {parseFloat(order.totalTax?.toString() || "0") >
                            0 && (
                              <div className="text-xs text-gray-500">
                                dont TVA:{" "}
                                {parseFloat(
                                  order.totalTax?.toString() || "0",
                                ).toFixed(2)}{" "}
                                DA
                              </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                          {(order.status === "draft" || order.status === "confirmed") && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                onClick={() => handleEditOrder(order)}
                                title="Modifier la commmande"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteOrder(order)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {order.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              onClick={() => handleValidateQuote(order)}
                              title="Confirmer la commande"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}

                          {order.status === "confirmed" && (

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-yellow-700"
                              onClick={() => handleRevertOrder(order)}
                              title="Annuler la validation"
                            >
                              <Undo2 className="w-4 h-4" />
                            </Button>
                          )}
                          {order.status !== "draft" && order.status !== "confirmed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-700 hover:text-orange-600"
                              onClick={() => setViewingOrder(order)}
                              title="Consulter"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        {/* Modale de consultation */}
        <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
          <DialogContent className="max-w-2xl  max-h-[100vh] overflow-y-auto">
            <DialogHeader className="sticky  top-0 z-10 bg-gradient-to-r from-orange-100 to-amber-100 rounded-t-xl p-2">
              <DialogTitle className="text-2xl font-bold text-orange-700 flex items-center gap-2">
                <Eye className="w-6 h-6 text-orange-400" /> Consultation de la commande
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              {viewingOrder && (
                <div className="p-6 pt-0 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700 flex items-center gap-2">
                      <span className="bg-orange-200 text-orange-800 rounded px-2 py-1 text-xs font-mono">{viewingOrder.code}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-1 rounded-full border-gray-300 text-gray-600"
                      >
                        {orderTypeLabels[viewingOrder.type as keyof typeof orderTypeLabels] || viewingOrder.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-1  rounded-full capitalize ${orderStatusColors[viewingOrder.status as keyof typeof orderStatusLabels]} `}
                      >
                        {orderStatusLabels[viewingOrder.status as keyof typeof orderStatusLabels]}
                      </Badge>
                    </div>
                  </div>
                  <hr className="my-2" />
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span>Date de création :</span>
                    </div>
                    <span>{formatDate(viewingOrder.createdAt)}</span>
                    {viewingOrder.deliveryDate && (
                      <>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-orange-400" />
                          <span>Date de livraison :</span>
                        </div>
                        <span>{formatDate(viewingOrder.deliveryDate)}</span>
                      </>
                    )}
                    {viewingOrder.notes && (
                      <>
                        <div className="flex items-center gap-2">
                          <Edit className="w-4 h-4 text-orange-400" />
                          <span>Notes :</span>
                        </div>
                        <span className="italic text-gray-500">{viewingOrder.notes}</span>
                      </>
                    )}
                  </div>
                  <hr className="my-1" />
                  <div className="mt-1">
                    <div className="font-semibold mb-2 text-gray-700 text-base flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-orange-400" /> Articles de la commande
                    </div>
                    <OrderItemsSummary orderId={viewingOrder.id} products={products} />
                  </div>
                  <hr className="my-2" />
                  <div className="grid grid-cols-2 gap-4 text-base font-semibold mt-4">
                    <div className="flex items-center gap-2 text-orange-700">
                      Total TTC
                    </div>
                    <span className="text-right text-orange-700">{parseFloat(viewingOrder.totalTTC?.toString() || "0").toFixed(2)} DA</span>
                    <div className="flex items-center gap-2 text-amber-700">
                      <Badge className="bg-amber-200 text-amber-800 px-2 py-1">TVA</Badge>
                    </div>
                    <span className="text-right text-amber-700">{parseFloat(viewingOrder.totalTax?.toString() || "0").toFixed(2)} DA</span>
                  </div>
                </div>
              )}
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div >
    );
  }

  // Vue boutique (catégories et produits côte à côte)
  if (currentView === "shop") {
    result = (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className=" mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Nos Produits
              </h1>
              <p className="text-gray-600">
                Découvrez nos délicieuses créations
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentView("orders")}
                className="border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Mes commandes
              </Button>

              {cart.length > 0 && (
                <Button
                  onClick={() => setCurrentView("cart")}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 relative"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Panier ({cart.length})
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center text-xs">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                </Button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar des catégories */}
            <div className="lg:col-span-1">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg sticky top-6">
                <CardHeader
                  className="flex flex-row items-center justify-between cursor-pointer"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <CardTitle className="text-lg flex items-center gap-2">
                    Catégories
                  </CardTitle>
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </CardHeader>

                {isOpen && (
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {/* Tous les produits */}
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${!selectedCategory
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                          : "hover:bg-orange-50 text-gray-700"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5" />
                          <span className="font-medium">Tous les produits</span>
                        </div>
                      </button>

                      {/* Catégories */}
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedCategory === category.id
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                            : "hover:bg-orange-50 text-gray-700"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5" />
                            <div className="font-medium">{category.designation}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

            </div>

            {/* Grille des produits */}
            <div className="lg:col-span-3">
              {products.length === 0 ? (
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedCategory
                        ? "Aucun produit dans cette catégorie"
                        : "Aucun produit disponible"}
                    </h3>
                    <p className="text-gray-600">
                      {selectedCategory
                        ? "Essayez une autre catégorie ou revenez plus tard"
                        : "Nos produits seront bientôt disponibles"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3  xl:grid-cols-4  gap-6">
                  {products.map((product) => {
                    const cartItem = cart.find(
                      (item) => item.articleId === product.id,
                    );
                    const quantity = cartItem?.quantity || 0;
                    const isUnavailable = product.saleStatus === "repture" || product.saleStatus === "nonDispo";
                    let saleStatusLabel = "";
                    if (product.saleStatus === "repture") saleStatusLabel = "Rupture";
                    else if (product.saleStatus === "nonDispo") saleStatusLabel = "Non disponible";
                    else if (product.saleStatus === "none" || !product.saleStatus) saleStatusLabel = "Disponible";
                    else saleStatusLabel = product.saleStatus;


                    return (
                      <Card
                        key={product.id}

                      >
                        <CardContent className="p-0 h-full relative">

                          {/* Badge état de vente */}
                          {saleStatusLabel && (
                            <Badge className={`absolute z-10 top-2 left-2 ${isUnavailable ? "bg-red-800 text-white" : "bg-green-500 text-white"}`}>
                              {saleStatusLabel}
                            </Badge>
                          )}
                          {/* Badge état de vente */}
                          {product.saleStatusReason && (
                            <p className="absolute z-10 bottom-0 flex justify-center items-center min-h-24 font-bold w-full text-justify  bg-red-50 text-red-700 text-xs p-3 shadow-inner max-h-24 overflow-y-auto">
                              🚫{product.saleStatusReason}
                            </p>

                          )}
                          <div className={`h-full bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all ${isUnavailable ? "opacity-80 grayscale pointer-events-none" : ""}`}>
                            {/* Image du produit */}
                            <div className="h-48 bg-gradient-to-br from-orange-100 to-amber-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                              {product.photo ? (
                                <img
                                  src={product.photo}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-t-lg mw-12 mh-12"
                                />
                              ) : (
                                <Package className="w-16 h-16 text-orange-400" />
                              )}

                              {/* Badge quantité dans le panier */}
                              {quantity > 0 && (
                                <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
                                  {quantity}
                                </Badge>
                              )}
                            </div>

                            {/* Informations produit */}
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                {product.name}
                              </h3>

                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {product.description || "\u00A0"}
                              </p>

                              <div className="flex justify-between items-center mb-4">
                                <span className="text-2xl font-bold text-orange-600">
                                  {parseFloat(product.salePrice || "0").toFixed(
                                    2,
                                  )}{" "}
                                  DA
                                </span>
                                <span className="text-sm text-gray-500">
                                  par {product.saleUnit}
                                </span>
                              </div>

                              {/* Contrôles quantité */}
                              <div className="flex items-center justify-between">
                                {quantity === 0 ? (
                                  <Button
                                    onClick={() => addToCart(product)}
                                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                                    disabled={isUnavailable}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter
                                  </Button>
                                ) : (
                                  <div className="flex items-center justify-between w-full">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        updateCartQuantity(
                                          product.id,
                                          quantity - 1,
                                        )
                                      }
                                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                                      disabled={isUnavailable}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>

                                    <span className="text-lg font-semibold text-gray-900 px-4">
                                      {quantity}
                                    </span>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        updateCartQuantity(
                                          product.id,
                                          quantity + 1,
                                        )
                                      }
                                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                                      disabled={isUnavailable}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue panier et finalisation
  if (currentView === "cart") {
    console.log("🔍 deliveryDate (render):", deliveryDate);
    result = (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {editingOrder ? "Modifier la Commande" : "Mon Panier"}
              </h1>
              <p className="text-gray-600">
                Vérifiez vos articles et finalisez votre commande
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentView("shop")}
              className="border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {editingOrder
                ? "Ajouter d'autres produits"
                : "Continuer mes achats"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Articles du panier */}
            <div className="lg:col-span-2">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Articles sélectionnés ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Votre panier est vide</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.articleId}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.article.photo ? (
                            <img
                              src={item.article.photo}
                              alt={item.article.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-orange-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {item.article.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {parseFloat(item.article.salePrice || "0").toFixed(
                              2,
                            )}{" "}
                            DA par {item.article.saleUnit}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateCartQuantity(
                                item.articleId,
                                item.quantity - 1,
                              )
                            }
                          >
                            <Minus className="w-4 h-4" />
                          </Button>

                          <span className="w-12 text-center font-semibold">
                            {item.quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateCartQuantity(
                                item.articleId,
                                item.quantity + 1,
                              )
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.articleId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-right font-semibold text-gray-900 min-w-[80px]">
                          {(
                            parseFloat(item.article.salePrice || "0") *
                            item.quantity
                          ).toFixed(2)}{" "}
                          DA
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Résumé et finalisation */}
            <div className="space-y-6">
              {/* Résumé de la commande */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Résumé de la commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.articleId}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.article.name} × {item.quantity}
                        </span>
                        <span>
                          {(
                            parseFloat(item.article.salePrice || "0") *
                            item.quantity
                          ).toFixed(2)}{" "}
                          DA
                        </span>
                      </div>
                    ))}
                  </div>

                  <hr />

                  {(() => {
                    const totals = calculateOrderTotals(cart);
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sous-total HT</span>
                          <span>{totals.totalHT.toFixed(2)} DA</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>TVA</span>
                          <span>{totals.totalTVA.toFixed(2)} DA</span>
                        </div>
                        <hr />
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total TTC</span>
                          <span className="text-orange-600">
                            {totals.totalTTC.toFixed(2)} DA
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Informations de livraison */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Informations de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de livraison souhaitée *
                    </label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optionnel)
                    </label>
                    <Textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Instructions spéciales, allergies, préférences..."
                      rows={3}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bouton de validation */}
              <Button
                onClick={handleCreateOrder}
                disabled={
                  cart.length === 0 ||
                  !deliveryDate ||
                  createOrderMutation.isPending ||
                  updateOrderMutation.isPending
                }
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {createOrderMutation.isPending ||
                  updateOrderMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingOrder ? "Modification..." : "Création..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {editingOrder
                      ? "Modifier la commande"
                      : "Confirmer la commande"}
                  </div>
                )}
              </Button>

              {/* Informations supplémentaires */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  📞 Besoin d'aide ? Contactez-nous au 0554 XX XX XX
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  usePageTitle('Gestion des commandes');
  return (result);
}

function OrderItemsSummary({ orderId, products }: { orderId: number; products: Article[] }) {
  const { data: items, isLoading } = useQueryTanstack({
    queryKey: ["/api/orders", orderId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/items`);
      return res.json();
    },
    enabled: !!orderId,
  });
  if (isLoading) return <div>Chargement des articles...</div>;
  if (!items || items.length === 0) return <div className="text-gray-400 italic">Aucun article</div>;

  // Calcul du total HT
  const totalHT = items.reduce((sum: number, item: any) => sum + parseFloat(item.unitPrice || "0") * parseFloat(item.quantity || "0"), 0);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-orange-100 sticky top-0 z-10">
            <tr>
              <th className="p-2 text-left font-semibold text-gray-700">Produit</th>
              <th className="p-2 text-right font-semibold text-gray-700">Qté</th>
              <th className="p-2 text-right font-semibold text-gray-700">PU</th>
              <th className="p-2 text-right font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => {
              const product = products.find((p) => p.id === item.articleId);
              return (
                <tr key={item.articleId}>
                  <td className="p-2 font-semibold"> <div className="flex items-center gap-4">
                    <img src={product?.photo} alt={product?.name} className="w-[5rem] h-[4rem] object-cover rounded-t-lg" />
                    {product ? product.name : item.articleId}
                  </div></td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">{parseFloat(item.unitPrice || "0").toFixed(2)} DA</td>
                  <td className="p-2 text-right font-semibold">{(parseFloat(item.unitPrice || "0") * parseFloat(item.quantity || "0")).toFixed(2)} DA</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-2">
        <span className="text-sm text-gray-700 font-semibold bg-gray-50 rounded px-3 py-1">Total HT : {totalHT.toFixed(2)} DA</span>
      </div>
    </>
  );
}
