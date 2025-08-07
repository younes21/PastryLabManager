import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { RecipeImage } from "@/components/recipe-image";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  // Fetch client's orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/orders?customerId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch active recipes for catalog
  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ["/api/recipes/active"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setCart({});
      toast({
        title: "Commande créée",
        description: "Votre commande a été créée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande.",
        variant: "destructive",
      });
    },
  });

  const addToCart = (recipeId: number) => {
    setCart(prev => ({
      ...prev,
      [recipeId]: (prev[recipeId] || 0) + 1
    }));
  };

  const removeFromCart = (recipeId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[recipeId] > 1) {
        newCart[recipeId]--;
      } else {
        delete newCart[recipeId];
      }
      return newCart;
    });
  };

  const getTotalAmount = () => {
    return Object.entries(cart).reduce((total, [recipeId, quantity]) => {
      const recipe = recipes?.find((r: any) => r.id === parseInt(recipeId));
      return total + (parseFloat(recipe?.price || "0") * quantity);
    }, 0);
  };

  const submitOrder = () => {
    if (Object.keys(cart).length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des articles à votre panier avant de commander.",
        variant: "destructive",
      });
      return;
    }

    const orderItems = Object.entries(cart).map(([recipeId, quantity]) => {
      const recipe = recipes?.find((r: any) => r.id === parseInt(recipeId));
      return {
        recipeId: parseInt(recipeId),
        quantity,
        unitPrice: parseFloat(recipe?.price || "0"),
        totalPrice: parseFloat(recipe?.price || "0") * quantity
      };
    });

    // Create the order with items
    const orderData = {
      customerId: user?.id,
      customerName: `${user?.firstName} ${user?.lastName}`,
      customerEmail: user?.email,
      customerPhone: user?.phone || "",
      totalAmount: getTotalAmount().toFixed(2),
      status: "pending",
      deliveryAddress: "Adresse non spécifiée",
      items: orderItems
    };

    createOrderMutation.mutate(orderData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      confirmed: { label: "Confirmée", variant: "default" as const },
      preparation: { label: "En préparation", variant: "default" as const },
      ready: { label: "Prête", variant: "outline" as const },
      in_delivery: { label: "En livraison", variant: "default" as const },
      delivered: { label: "Livrée", variant: "outline" as const },
      cancelled: { label: "Annulée", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateOutstandingDebt = () => {
    return orders?.filter((order: any) => order.status === "delivered" && !order.paymentReceived)
      .reduce((total: number, order: any) => total + parseFloat(order.totalAmount), 0) || 0;
  };

  return (
    <Layout title="Espace Client">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bonjour {user?.firstName} !</h1>
            <p className="text-gray-600">Bienvenue dans votre espace client</p>
          </div>
        </div>

        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="catalog">Catalogue</TabsTrigger>
            <TabsTrigger value="orders">Mes Commandes</TabsTrigger>
            <TabsTrigger value="invoices">Factures</TabsTrigger>
            <TabsTrigger value="cart">Panier ({Object.keys(cart).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <Card>
              <CardHeader>
                <CardTitle>Notre Catalogue de Pâtisseries</CardTitle>
              </CardHeader>
              <CardContent>
                {recipesLoading ? (
                  <div className="text-center py-8">Chargement du catalogue...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes?.map((recipe: any) => (
                      <div key={recipe.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-center mb-4">
                          <RecipeImage recipeName={recipe.name} size={120} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{recipe.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{recipe.description}</p>
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-lg font-bold text-primary">
                            {parseFloat(recipe.price).toFixed(2)} DA
                          </div>
                          <div className="text-sm text-gray-500">
                            {recipe.preparationTime} min
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            {recipe.servings} portions
                          </div>
                          <Button onClick={() => addToCart(recipe.id)} size="sm">
                            Ajouter au panier
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Mes Commandes</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">Chargement des commandes...</div>
                ) : orders?.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">Commande #{order.id}</h3>
                            <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <div className="text-lg font-bold mt-1">{parseFloat(order.totalAmount).toFixed(2)} DA</div>
                          </div>
                        </div>
                        {order.deliveryAddress && (
                          <p className="text-sm text-gray-600">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {order.deliveryAddress}
                          </p>
                        )}
                        {order.deliveryDate && (
                          <p className="text-sm text-gray-600">
                            <i className="fas fa-calendar mr-1"></i>
                            Livraison prévue le {formatDate(order.deliveryDate)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                    <p className="text-lg font-medium mb-2">Aucune commande</p>
                    <p className="text-sm text-gray-600">Passez votre première commande depuis le catalogue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Factures et Dettes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-yellow-800">Solde à payer</h3>
                      <p className="text-sm text-yellow-600">Commandes livrées non payées</p>
                    </div>
                    <div className="text-2xl font-bold text-yellow-800">
                      {calculateOutstandingDebt().toFixed(2)} DA
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {orders?.filter((order: any) => order.status === "delivered").map((order: any) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">Facture #{order.id}</h3>
                          <p className="text-sm text-gray-600">Livrée le {formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{parseFloat(order.totalAmount).toFixed(2)} DA</div>
                          <Badge variant={order.paymentReceived ? "outline" : "destructive"}>
                            {order.paymentReceived ? "Payée" : "À payer"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cart">
            <Card>
              <CardHeader>
                <CardTitle>Mon Panier</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-shopping-basket text-4xl text-gray-300 mb-4"></i>
                    <p className="text-lg font-medium mb-2">Votre panier est vide</p>
                    <p className="text-sm text-gray-600">Ajoutez des articles depuis le catalogue</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {Object.entries(cart).map(([recipeId, quantity]) => {
                        const recipe = recipes?.find((r: any) => r.id === parseInt(recipeId));
                        return (
                          <div key={recipeId} className="flex justify-between items-center border-b pb-4">
                            <div className="flex items-center space-x-4">
                              <RecipeImage recipeName={recipe?.name || ""} size={60} />
                              <div>
                                <h3 className="font-semibold">{recipe?.name}</h3>
                                <p className="text-sm text-gray-600">{parseFloat(recipe?.price || "0").toFixed(2)} DA l'unité</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(parseInt(recipeId))}
                              >
                                -
                              </Button>
                              <span className="font-semibold">{quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addToCart(parseInt(recipeId))}
                              >
                                +
                              </Button>
                              <div className="text-lg font-bold ml-4">
                                {(parseFloat(recipe?.price || "0") * quantity).toFixed(2)} DA
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Total</h3>
                        <div className="text-2xl font-bold">{getTotalAmount().toFixed(2)} DA</div>
                      </div>
                      <Button
                        onClick={submitOrder}
                        disabled={createOrderMutation.isPending}
                        className="w-full"
                      >
                        {createOrderMutation.isPending ? "Commande en cours..." : "Passer la commande"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}