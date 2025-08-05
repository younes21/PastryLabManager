import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Plus, Trash2, ShoppingCart, User, Calculator } from "lucide-react";
import type { Order, Client, Article } from "@shared/schema";

const orderFormSchema = z.object({
  type: z.enum(["order", "quote"]),
  clientId: z.number().min(1, "Client requis"),
  orderDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
  deliveryNotes: z.string().optional(),
  items: z.array(z.object({
    articleId: z.number().min(1, "Article requis"),
    quantity: z.number().min(0.001, "Quantité minimum 0.001"),
    unitPrice: z.number().min(0, "Prix unitaire requis"),
    notes: z.string().optional()
  })).min(1, "Au moins un article requis")
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  order?: Order;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function OrderForm({ order, trigger, onSuccess }: OrderFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Queries
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      type: "order",
      clientId: 0,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: "",
      notes: "",
      deliveryNotes: "",
      items: [{ articleId: 0, quantity: 1, unitPrice: 0, notes: "" }]
    }
  });

  const { watch, setValue, getValues } = form;
  const watchedItems = watch("items");

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const orderData = {
        ...data,
        orderDate: data.orderDate || new Date().toISOString(),
        deliveryDate: data.deliveryDate || null,
        subtotalHT: calculateSubtotal(),
        totalTax: calculateTax(),
        totalTTC: calculateTotal()
      };
      
      if (order) {
        return await apiRequest(`/api/orders/${order.id}`, "PUT", orderData);
      } else {
        return await apiRequest("/api/orders", "POST", orderData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ 
        title: order ? "Commande mise à jour" : "Commande créée",
        description: "L'opération s'est déroulée avec succès"
      });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Une erreur est survenue",
        variant: "destructive" 
      });
    },
  });

  // Calculs
  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.20; // TVA 20%
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // Gestion des articles
  const addItem = () => {
    const currentItems = getValues("items");
    setValue("items", [...currentItems, { articleId: 0, quantity: 1, unitPrice: 0, notes: "" }]);
  };

  const removeItem = (index: number) => {
    const currentItems = getValues("items");
    if (currentItems.length > 1) {
      setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  const updateItemPrice = (index: number, articleId: number) => {
    const article = articles.find(a => a.id === articleId);
    if (article && article.salePrice) {
      const currentItems = getValues("items");
      currentItems[index].unitPrice = parseFloat(article.salePrice);
      setValue("items", currentItems);
    }
  };

  useEffect(() => {
    if (order) {
      form.reset({
        type: order.type as "order" | "quote",
        clientId: order.clientId,
        orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : "",
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : "",
        notes: order.notes || "",
        deliveryNotes: order.deliveryNotes || "",
        items: [{ articleId: 0, quantity: 1, unitPrice: 0, notes: "" }] // TODO: Charger les items existants
      });
    }
  }, [order, form]);

  const onSubmit = (data: OrderFormData) => {
    createMutation.mutate(data);
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName} (${client.code})` : "";
  };

  const getArticleName = (articleId: number) => {
    const article = articles.find(a => a.id === articleId);
    return article ? `${article.name} (${article.code || 'N/A'})` : "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-create-order">
            <Plus className="h-4 w-4 mr-2" />
            {order ? "Modifier" : "Nouvelle commande"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {order ? "Modifier la commande" : "Nouvelle commande / devis"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="items">Articles</TabsTrigger>
                <TabsTrigger value="summary">Résumé</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-order-type">
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="quote">Devis</SelectItem>
                            <SelectItem value="order">Commande</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-order-client">
                              <SelectValue placeholder="Sélectionner un client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {getClientName(client.id)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date commande</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-order-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date livraison</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-delivery-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes sur la commande..."
                            {...field}
                            data-testid="textarea-order-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes de livraison</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Instructions de livraison..."
                            {...field}
                            data-testid="textarea-delivery-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Articles de la commande</h3>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un article
                  </Button>
                </div>

                <div className="space-y-4">
                  {watchedItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <FormField
                            control={form.control}
                            name={`items.${index}.articleId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Article *</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    const articleId = parseInt(value);
                                    field.onChange(articleId);
                                    updateItemPrice(index, articleId);
                                  }} 
                                  value={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choisir un article" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {articles.filter(a => a.allowSale).map((article) => (
                                      <SelectItem key={article.id} value={article.id.toString()}>
                                        {getArticleName(article.id)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantité *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prix unitaire (DA) *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Notes article..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-2">
                            <div className="text-sm font-medium">
                              Total: {(item.quantity * item.unitPrice).toFixed(2)} DA
                            </div>
                            {watchedItems.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Résumé financier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Sous-total HT:</span>
                          <span className="font-medium">{calculateSubtotal().toFixed(2)} DA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TVA (20%):</span>
                          <span className="font-medium">{calculateTax().toFixed(2)} DA</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total TTC:</span>
                          <span>{calculateTotal().toFixed(2)} DA</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          <div>Nombre d'articles: {watchedItems.length}</div>
                          <div>Quantité totale: {watchedItems.reduce((sum, item) => sum + item.quantity, 0)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  "Enregistrement..."
                ) : (
                  order ? "Mettre à jour" : "Créer la commande"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}