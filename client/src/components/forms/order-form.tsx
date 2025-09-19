import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
} from "lucide-react";
import { type Order, type Client, type Article, type ArticleCategory, type Tax } from "@shared/schema";

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
    taxRate: number;
    taxAmount: number;
  }>;
}

interface OrderFormProps {
  order?: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Utilitaire pour générer le payload order/items comme dans orders-clients
function buildOrderWithItemsPayload(data: OrderFormData, orderId: number, articles: Article[], taxes: Tax[]) {
  const items = data.items.map((item) => {
    const article = articles.find((a) => a.id === item.articleId);
    let taxRate = 0;
    if (article && article.taxId && taxes.length > 0) {
      const tax = taxes.find((t) => t.id === article.taxId);
      if (tax) {
        taxRate = parseFloat(tax.rate?.toString() || "0");
      }
    }
    const unitPrice = parseFloat(article?.salePrice || "0");
    const taxAmount = (unitPrice * item.quantity * taxRate) / 100;
    const totalPrice = unitPrice * item.quantity;
    return {
      orderId: orderId,
      articleId: item.articleId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      taxRate,
      taxAmount,
      notes: ""
    };
  });
  // Totaux
  const subtotalHT = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const totalTax = items.reduce((sum, i) => sum + i.taxAmount, 0);
  const totalTTC = subtotalHT + totalTax;
  return {
    order: {
      type: "order",
      clientId: data.clientId,
      orderDate: new Date().toISOString(),
      deliveryDate: data.deliveryDate || null,
      notes: data.notes,
      status: "draft",
      subtotalHT: subtotalHT.toString(),
      totalTax: totalTax.toString(),
      totalTTC: totalTTC.toString(),
    },
    items,
  };
}

export function OrderForm({ order, onSuccess, onCancel }: OrderFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États locaux
  const [currentView, setCurrentView] = useState<"catalog" | "cart">("catalog");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number>(0);

  // Queries
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
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

  const { data: taxes = [] } = useQuery<Tax[]>({
    queryKey: ["/api/taxes"],
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      const orderPayload = buildOrderWithItemsPayload(orderData, 0, products, taxes);
      return await apiRequest("/api/ordersWithItems", "POST", orderPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setCart([]);
      setDeliveryDate("");
      setOrderNotes("");
      setCurrentView("catalog");
      toast({ title: "Commande créée avec succès" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      const orderPayload = buildOrderWithItemsPayload(orderData, order!.id, products, taxes);
      return await apiRequest(`/api/ordersWithItems/${order!.id}`, "PUT", orderPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setCart([]);
      setDeliveryDate("");
      setOrderNotes("");
      setCurrentView("catalog");
      toast({ title: "Commande modifiée avec succès" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
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

  const handleCreateOrder = () => {
    if (!selectedClientId) {
      toast({
        title: "Erreur: Veuillez sélectionner un client",
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
      clientId: selectedClientId,
      deliveryDate: deliveryDate,
      notes: orderNotes,
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

    if (order) {
      updateOrderMutation.mutate(orderData);
    } else {
      createOrderMutation.mutate(orderData);
    }
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (client?.type !== 'societe') {
      return client ? `${client.firstName} ${client.lastName}` : "";
    } else {
      return client ? `${client.companyName}` : "";
    }
  };

  // Initialiser les données si on modifie une commande
  useEffect(() => {
    if (order) {
      setSelectedClientId(order.clientId);
      setDeliveryDate(order.deliveryDate?.split(" ")[0] || "");
      setOrderNotes(order.notes || "");
      // TODO: Charger les items de la commande existante
    }
  }, [order]);

  // Vue catalogue des produits
  if (currentView === "catalog") {
  return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {order ? "Modifier la Commande" : "Nouvelle Commande"}
              </h1>
              <p className="text-gray-600">
                Sélectionnez les produits pour la commande
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
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

          {/* Sélection du client */}
          <Card className="mb-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 min-w-[100px]">
                  Client *
                </label>
                <Select 
                  value={selectedClientId.toString()} 
                  onValueChange={(value) => setSelectedClientId(parseInt(value))}
                  disabled={!!order} // Désactiver en mode édition
                >
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {getClientName(client.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {order && (
                  <span className="text-sm text-gray-500 italic">
                    (Client non modifiable en mode édition)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

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
                          <div>
                            <div className="font-medium">
                              {category.designation}
                        </div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
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
                                {parseFloat(product.salePrice || "0").toFixed(2)} DA
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
                                      updateCartQuantity(product.id, quantity - 1)
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
                                      updateCartQuantity(product.id, quantity + 1)
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {order ? "Modifier la Commande" : "Finaliser la Commande"}
              </h1>
              <p className="text-gray-600">
                Vérifiez les articles et finalisez la commande
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentView("catalog")}
              className="border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {order ? "Modifier les produits" : "Continuer la sélection"}
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
                            {parseFloat(item.article.salePrice || "0").toFixed(2)} DA
                            par {item.article.saleUnit}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateCartQuantity(item.articleId, item.quantity - 1)
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
                              updateCartQuantity(item.articleId, item.quantity + 1)
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
                          ).toFixed(2)} DA
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
                          ).toFixed(2)} DA
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
                  !selectedClientId ||
                  createOrderMutation.isPending ||
                  updateOrderMutation.isPending
                }
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {createOrderMutation.isPending ||
                  updateOrderMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {order ? "Modification..." : "Création..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {order ? "Modifier la commande" : "Confirmer la commande"}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}