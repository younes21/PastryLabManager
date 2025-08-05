import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Truck, MapPin, Package, User, Calendar } from "lucide-react";
import type { Delivery, Order } from "@shared/schema";

const deliveryFormSchema = z.object({
  orderId: z.number().min(1, "Commande requise"),
  deliveryPersonId: z.number().optional(),
  status: z.enum(["pending", "in_transit", "delivered", "cancelled"]),
  scheduledDate: z.string().optional(),
  deliveryAddress: z.string().min(1, "Adresse de livraison requise"),
  deliveryNotes: z.string().optional(),
  trackingNumber: z.string().optional(),
  packageCount: z.number().min(1, "Nombre de colis minimum 1"),
  signatureRequired: z.boolean(),
  deliveryCost: z.number().min(0, "Coût minimum 0")
});

type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

interface DeliveryFormProps {
  delivery?: Delivery;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function DeliveryForm({ delivery, trigger, onSuccess }: DeliveryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Queries
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      status: "pending",
      scheduledDate: new Date().toISOString().split('T')[0],
      deliveryAddress: "",
      deliveryNotes: "",
      trackingNumber: "",
      packageCount: 1,
      signatureRequired: true,
      deliveryCost: 0
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: DeliveryFormData) => {
      const deliveryData = {
        ...data,
        scheduledDate: data.scheduledDate || null,
        trackingNumber: data.trackingNumber || `LIV-${Date.now()}`
      };
      
      if (delivery) {
        return await apiRequest(`/api/deliveries/${delivery.id}`, "PUT", deliveryData);
      } else {
        return await apiRequest("/api/deliveries", "POST", deliveryData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({ 
        title: delivery ? "Livraison mise à jour" : "Livraison créée",
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

  useEffect(() => {
    if (delivery) {
      form.reset({
        orderId: delivery.orderId,
        deliveryPersonId: delivery.deliveryPersonId || undefined,
        status: delivery.status as any,
        scheduledDate: delivery.scheduledDate ? new Date(delivery.scheduledDate).toISOString().split('T')[0] : "",
        deliveryAddress: delivery.deliveryAddress || "",
        deliveryNotes: delivery.deliveryNotes || "",
        trackingNumber: delivery.trackingNumber || "",
        packageCount: delivery.packageCount || 1,
        signatureRequired: delivery.signatureRequired || true,
        deliveryCost: parseFloat(delivery.deliveryCost || "0")
      });
    }
  }, [delivery, form]);

  const onSubmit = (data: DeliveryFormData) => {
    createMutation.mutate(data);
  };

  const getOrderCode = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    return order ? `${order.code} - ${order.type === "quote" ? "Devis" : "Commande"}` : "";
  };

  const getDeliveryPersonName = (userId: number) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.username} (${user.role})` : "";
  };

  // Filtrer les commandes confirmées uniquement
  const availableOrders = orders.filter(order => 
    ["confirmed", "prepared", "ready"].includes(order.status)
  );

  // Filtrer les livreurs
  const deliveryPersons = (users as any[]).filter((user: any) => 
    ["livreur", "admin", "gerant"].includes(user.role)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-create-delivery">
            <Plus className="h-4 w-4 mr-2" />
            {delivery ? "Modifier" : "Nouvelle livraison"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {delivery ? "Modifier la livraison" : "Nouvelle livraison"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="address">Adresse</TabsTrigger>
                <TabsTrigger value="tracking">Suivi</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commande *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-delivery-order">
                              <SelectValue placeholder="Sélectionner une commande" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableOrders.map((order) => (
                              <SelectItem key={order.id} value={order.id.toString()}>
                                {getOrderCode(order.id)}
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
                    name="deliveryPersonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Livreur</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un livreur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Aucun livreur assigné</SelectItem>
                            {deliveryPersons.map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {getDeliveryPersonName(user.id)}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="in_transit">En cours</SelectItem>
                            <SelectItem value="delivered">Livré</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date prévue</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-scheduled-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="packageCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de colis</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-package-count"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût livraison (DA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-delivery-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="signatureRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-signature-required"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Signature requise</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Le destinataire doit signer pour confirmer la réception
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Adresse de livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse complète *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Adresse de livraison complète..."
                              {...field}
                              data-testid="textarea-delivery-address"
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
                          <FormLabel>Instructions de livraison</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Instructions spéciales pour la livraison..."
                              {...field}
                              data-testid="textarea-delivery-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Conseils pour l'adresse</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Indiquez le nom de la wilaya et de la commune</p>
                        <p>• Précisez les points de repère importants</p>
                        <p>• Ajoutez un numéro de téléphone de contact</p>
                        <p>• Mentionnez l'étage et l'appartement si nécessaire</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tracking" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Suivi de livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="trackingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de suivi</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Numéro de suivi (généré automatiquement)"
                              {...field}
                              data-testid="input-tracking-number"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-muted-foreground">
                            Laissez vide pour génération automatique
                          </p>
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Statuts de livraison</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>En attente :</strong> Livraison programmée</p>
                        <p><strong>En cours :</strong> Livreur en route</p>
                        <p><strong>Livré :</strong> Colis remis au destinataire</p>
                        <p><strong>Annulé :</strong> Livraison annulée</p>
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
                  delivery ? "Mettre à jour" : "Créer la livraison"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}