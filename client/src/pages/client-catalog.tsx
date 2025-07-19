import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { RecipeImage } from "@/components/recipe-image";

export default function ClientCatalog() {
  const [cart, setCart] = useState<any[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    deliveryDate: "",
    deliveryTime: "",
    notes: ""
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["/api/recipes/active"],
  });

  const { data: myOrders } = useQuery({
    queryKey: ["/api/orders"],
    select: (orders: any[]) => user ? orders.filter(order => order.customerId === user.id) : [],
    enabled: !!user
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Commande passée",
        description: "Votre commande a été passée avec succès.",
      });
      setCart([]);
      setIsOrderModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de passer la commande.",
        variant: "destructive",
      });
    },
  });

  const addToCart = (recipe: any) => {
    const existingItem = cart.find(item => item.id === recipe.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === recipe.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...recipe, quantity: 1 }]);
    }
    
    toast({
      title: "Ajouté au panier",
      description: `${recipe.name} a été ajouté à votre panier.`,
    });
  };

  const removeFromCart = (recipeId: number) => {
    setCart(cart.filter(item => item.id !== recipeId));
  };

  const updateQuantity = (recipeId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(recipeId);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === recipeId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.price || "0") * item.quantity), 0);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast({
        title: "Erreur",
        description: "Votre panier est vide.",
        variant: "destructive",
      });
      return;
    }

    if (!orderFormData.customerName || !orderFormData.customerEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      customerId: user?.id || null,
      ...orderFormData,
      totalAmount: getCartTotal().toFixed(2),
      status: "pending",
      deliveryDate: orderFormData.deliveryDate ? new Date(orderFormData.deliveryDate).toISOString() : null
    };

    createOrderMutation.mutate(orderData);
  };

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyConfig = {
      easy: { label: "Facile", variant: "secondary" as const },
      medium: { label: "Moyen", variant: "default" as const },
      hard: { label: "Difficile", variant: "destructive" as const },
    };

    const config = difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig.easy;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      confirmed: { label: "Confirmée", variant: "default" as const },
      preparation: { label: "En préparation", variant: "default" as const },
      ready: { label: "Prête", variant: "outline" as const },
      in_delivery: { label: "En livraison", variant: "default" as const },
      delivered: { label: "Livrée", variant: "default" as const },
      cancelled: { label: "Annulée", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Layout title="Catalogue">
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Catalogue">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Catalogue de Pâtisseries</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Panier: {cart.length} article(s) - {getCartTotal().toFixed(2)}€
            </div>
            {cart.length > 0 && (
              <Button onClick={() => setIsOrderModalOpen(true)}>
                <i className="fas fa-shopping-cart mr-2"></i>
                Commander ({cart.length})
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Catalog */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes && recipes.length > 0 ? (
                recipes.map((recipe: any) => (
                  <Card key={recipe.id} className="overflow-hidden">
                    <RecipeImage recipeName={recipe.name} />
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{recipe.price || 0}€</div>
                          {getDifficultyBadge(recipe.difficulty)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {recipe.description || "Délicieuse pâtisserie préparée avec soin."}
                      </p>
                      
                      <div className="flex justify-between text-sm text-gray-500 mb-4">
                        <span><i className="fas fa-clock mr-1"></i>{recipe.preparationTime || 0} min</span>
                        <span><i className="fas fa-users mr-1"></i>{recipe.servings || 1} portions</span>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => addToCart(recipe)}
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Ajouter au panier
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <i className="fas fa-birthday-cake text-6xl text-gray-300 mb-4"></i>
                  <p className="text-xl font-medium text-gray-500 mb-2">Catalogue vide</p>
                  <p className="text-gray-400">Aucune pâtisserie disponible pour le moment</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Panier</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length > 0 ? (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              -
                            </Button>
                            <span className="text-xs">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{(parseFloat(item.price || "0") * item.quantity).toFixed(2)}€</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="h-5 w-5 p-0 text-red-500"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 flex justify-between font-medium">
                      <span>Total</span>
                      <span>{getCartTotal().toFixed(2)}€</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Panier vide</p>
                )}
              </CardContent>
            </Card>

            {/* My Orders */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mes Commandes</CardTitle>
                </CardHeader>
                <CardContent>
                  {myOrders && myOrders.length > 0 ? (
                    <div className="space-y-3">
                      {myOrders.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="text-sm">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">#{order.id}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex justify-between text-gray-500 mt-1">
                            <span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                            <span>{order.totalAmount}€</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune commande</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Order Modal */}
        <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Passer Commande</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Résumé de la commande</h4>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{(parseFloat(item.price || "0") * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total</span>
                    <span>{getCartTotal().toFixed(2)}€</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nom complet *</Label>
                  <Input
                    id="customerName"
                    value={orderFormData.customerName}
                    onChange={(e) => setOrderFormData({...orderFormData, customerName: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={orderFormData.customerEmail}
                    onChange={(e) => setOrderFormData({...orderFormData, customerEmail: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerPhone">Téléphone</Label>
                  <Input
                    id="customerPhone"
                    value={orderFormData.customerPhone}
                    onChange={(e) => setOrderFormData({...orderFormData, customerPhone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliveryTime">Heure souhaitée</Label>
                  <Input
                    id="deliveryTime"
                    value={orderFormData.deliveryTime}
                    onChange={(e) => setOrderFormData({...orderFormData, deliveryTime: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="deliveryAddress">Adresse de livraison</Label>
                <Textarea
                  id="deliveryAddress"
                  value={orderFormData.deliveryAddress}
                  onChange={(e) => setOrderFormData({...orderFormData, deliveryAddress: e.target.value})}
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="deliveryDate">Date de livraison souhaitée</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={orderFormData.deliveryDate}
                  onChange={(e) => setOrderFormData({...orderFormData, deliveryDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Instructions spéciales</Label>
                <Textarea
                  id="notes"
                  value={orderFormData.notes}
                  onChange={(e) => setOrderFormData({...orderFormData, notes: e.target.value})}
                  rows={3}
                  placeholder="Allergies, préférences, instructions de livraison..."
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOrderModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? "Commande en cours..." : `Commander (${getCartTotal().toFixed(2)}€)`}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
