import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ClientLayout } from "@/components/client-layout";
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
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type {
  Order,
  OrderItem,
  Client,
  Article,
  ArticleCategory,
} from "@shared/schema";

const orderStatusLabels = {
  draft: "Brouillon",
  confirmed: "Confirmé",
  prepared: "Préparé",
  ready: "Prêt",
  partially_delivered: "Livré partiellement",
  delivered: "Livré",
  cancelled: "Annulé",
};

const orderStatusColors = {
  draft: "secondary",
  confirmed: "blue",
  prepared: "orange",
  ready: "green",
  partially_delivered: "yellow",
  delivered: "green",
  cancelled: "red",
} as const;

interface CartItem {
  articleId: number;
  article: Article;
  quantity: number;
}

interface OrderFormData {
  clientId: number;
  deliveryDate: string;
  notes: string;
  items: Array<{
    articleId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Récupérer le client connecté via son userId
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: currentClient } = useQuery({
    queryKey: ["/api/clients"],
    select: (data: Client[]) => 
      data?.find((client: Client) => client.userId === (currentUser as any)?.id),
    enabled: !!(currentUser as any)?.id,
  });

  const currentClientId = currentClient?.id;

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
          article.type === "product" &&
          article.allowSale &&
          article.active &&
          (!selectedCategory || article.saleCategoryId === selectedCategory),
      ),
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      console.log("🔥 CREATING ORDER - Data:", orderData);
      
      const order = await apiRequest("/api/orders", "POST", {
        type: "order",
        clientId: orderData.clientId,
        deliveryDate: orderData.deliveryDate,
        notes: orderData.notes,
        status: "draft",
      });

      console.log("🔥 ORDER CREATED - Order:", order);

      // Ajouter les items de commande
      for (const item of orderData.items) {
        console.log("🔥 ADDING ORDER ITEM:", item);
        await apiRequest(`/api/orders/${order.id}/items`, "POST", {
          articleId: item.articleId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
      }

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
      
      const order = await apiRequest(`/api/orders/${orderData.id}`, "PUT", {
        deliveryDate: orderData.deliveryDate,
        notes: orderData.notes,
        status: "draft", // Maintenir le statut draft lors de l'édition
      });

      console.log("🔥 ORDER UPDATED - Order:", order);

      // Note: Pour la mise à jour des items, on devrait avoir une route spécifique
      // ou gérer les items individuellement. Pour l'instant, on ne peut que créer de nouveaux items.
      
      for (const item of orderData.items) {
        console.log("🔥 ADDING/UPDATING ORDER ITEM:", item);
        await apiRequest(`/api/orders/${orderData.id}/items`, "POST", {
          articleId: item.articleId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
      }

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
      deliveryDate,
      notes: orderNotes,
      items: cart.map((item) => ({
        articleId: item.articleId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.article.salePrice || "0"),
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

      // Charger les items de la commande
      const orderItems = await apiRequest(`/api/orders/${order.id}/items`, "GET");

      const cartItems: CartItem[] = [];

      // Vérifier que orderItems est bien un tableau
      if (Array.isArray(orderItems)) {
        for (const item of orderItems) {
          const product = products.find((p) => p.id === item.articleId);
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
      setDeliveryDate(order.deliveryDate?.split('T')[0] || "");
      setOrderNotes(order.notes || "");
      setCurrentView("cart");
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
              onClick={() => setCurrentView("shop")}
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
                          <Badge
                            variant={
                              orderStatusColors[
                                order.status as keyof typeof orderStatusColors
                              ] as any
                            }
                            className="text-xs px-2 py-1"
                          >
                            {
                              orderStatusLabels[
                                order.status as keyof typeof orderStatusLabels
                              ]
                            }
                          </Badge>
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
                            {parseFloat(order.totalTTC?.toString() || "0").toFixed(2)} DA
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {order.status === "draft" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                onClick={() => handleEditOrder(order)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteOrder(order)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
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
      </div>
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
                <CardHeader>
                  <CardTitle className="text-lg">Catégories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        !selectedCategory
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                          : "hover:bg-orange-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5" />
                        <span className="font-medium">Tous les produits</span>
                      </div>
                    </button>

                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                          selectedCategory === category.id
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                            : "hover:bg-orange-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5" />
                          <div>
                            <div className="font-medium">
                              {category.designation}
                            </div>
                            {/* Les catégories n'ont pas de description pour l'instant */}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
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

                    return (
                      <Card
                        key={product.id}
                        className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all"
                      >
                        <CardContent className="p-0">
                          {/* Image du produit */}
                          <div className="h-48 bg-gradient-to-br from-orange-100 to-amber-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                            {product.photo ? (
                              <img
                                src={product.photo}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-t-lg"
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
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
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
              onClick={() =>
                editingOrder ? setCurrentView("orders") : setCurrentView("shop")
              }
              className="border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {editingOrder ? "Retour aux commandes" : "Continuer mes achats"}
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

                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">
                      {getCartTotal().toFixed(2)} DA
                    </span>
                  </div>
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
                  🚚 Livraison gratuite à partir de 5000 DA
                </p>
                <p className="text-sm text-gray-600">
                  📞 Besoin d'aide ? Contactez-nous au 023 XX XX XX
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ClientLayout title="Gestion des Clients"> {result} </ClientLayout>;
}
