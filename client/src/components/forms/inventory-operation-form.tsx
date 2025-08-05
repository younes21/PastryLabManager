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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Factory, User, Package, Calendar } from "lucide-react";
import type { InventoryOperation, StorageZone, User as UserType, Order, Supplier } from "@shared/schema";

const operationFormSchema = z.object({
  type: z.enum(["reception", "preparation", "preparation_reliquat", "ajustement", "ajustement_rebut", "inventaire_initiale", "interne", "livraison"]),
  supplierId: z.number().optional(),
  orderId: z.number().optional(),
  storageZoneId: z.number().optional(),
  operatorId: z.number().optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    articleId: z.number().min(1, "Article requis"),
    quantityPlanned: z.number().min(0, "Quantité minimum 0"),
    quantityReal: z.number().min(0, "Quantité minimum 0"),
    unitCost: z.number().min(0, "Coût unitaire minimum 0"),
    lotNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    notes: z.string().optional()
  })).min(1, "Au moins un article requis")
});

type OperationFormData = z.infer<typeof operationFormSchema>;

interface InventoryOperationFormProps {
  operation?: InventoryOperation;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const operationTypeLabels = {
  reception: "Réception",
  preparation: "Préparation",
  preparation_reliquat: "Préparation Reliquat",
  ajustement: "Ajustement",
  ajustement_rebut: "Ajustement Rebut",
  inventaire_initiale: "Inventaire Initial",
  interne: "Transfert Interne",
  livraison: "Livraison"
};

export function InventoryOperationForm({ operation, trigger, onSuccess }: InventoryOperationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Queries
  const { data: storageZones = [] } = useQuery<StorageZone[]>({
    queryKey: ["/api/storage-zones"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["/api/articles"],
  });

  const form = useForm<OperationFormData>({
    resolver: zodResolver(operationFormSchema),
    defaultValues: {
      type: "reception",
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: "",
      items: [{ 
        articleId: 0, 
        quantityPlanned: 0, 
        quantityReal: 0, 
        unitCost: 0, 
        lotNumber: "", 
        expiryDate: "",
        notes: "" 
      }]
    }
  });

  const { watch, setValue, getValues } = form;
  const watchedType = watch("type");
  const watchedItems = watch("items");

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: OperationFormData) => {
      const operationData = {
        ...data,
        scheduledDate: data.scheduledDate || null,
        subtotalHT: calculateSubtotal(),
        totalTax: calculateTax(),
        totalTTC: calculateTotal()
      };
      
      if (operation) {
        return await apiRequest(`/api/inventory-operations/${operation.id}`, "PUT", operationData);
      } else {
        return await apiRequest("/api/inventory-operations", "POST", operationData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-operations"] });
      toast({ 
        title: operation ? "Opération mise à jour" : "Opération créée",
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
      return sum + (item.quantityReal * item.unitCost);
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
    setValue("items", [...currentItems, { 
      articleId: 0, 
      quantityPlanned: 0, 
      quantityReal: 0, 
      unitCost: 0, 
      lotNumber: "", 
      expiryDate: "",
      notes: "" 
    }]);
  };

  const removeItem = (index: number) => {
    const currentItems = getValues("items");
    if (currentItems.length > 1) {
      setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    if (operation) {
      form.reset({
        type: operation.type as any,
        supplierId: operation.supplierId || undefined,
        orderId: operation.orderId || undefined,
        storageZoneId: operation.storageZoneId || undefined,
        operatorId: operation.operatorId || undefined,
        scheduledDate: operation.scheduledDate ? new Date(operation.scheduledDate).toISOString().split('T')[0] : "",
        notes: operation.notes || "",
        items: [{ 
          articleId: 0, 
          quantityPlanned: 0, 
          quantityReal: 0, 
          unitCost: 0, 
          lotNumber: "", 
          expiryDate: "",
          notes: "" 
        }]
      });
    }
  }, [operation, form]);

  const onSubmit = (data: OperationFormData) => {
    createMutation.mutate(data);
  };

  const showSupplier = ["reception"].includes(watchedType);
  const showOrder = ["preparation", "livraison"].includes(watchedType);
  const showLotInfo = ["reception", "ajustement", "inventaire_initiale"].includes(watchedType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-create-operation">
            <Plus className="h-4 w-4 mr-2" />
            {operation ? "Modifier" : "Nouvelle opération"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            {operation ? "Modifier l'opération" : "Nouvelle opération d'inventaire"}
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
                        <FormLabel>Type d'opération *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-operation-type">
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(operationTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date programmée</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            data-testid="input-scheduled-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showSupplier && (
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fournisseur</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un fournisseur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                  {supplier.companyName || `${supplier.firstName} ${supplier.lastName}`} ({supplier.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {showOrder && (
                    <FormField
                      control={form.control}
                      name="orderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commande</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une commande" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {orders.map((order) => (
                                <SelectItem key={order.id} value={order.id.toString()}>
                                  {order.code} - {order.type === "quote" ? "Devis" : "Commande"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="storageZoneId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone de stockage</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {storageZones.map((zone) => (
                              <SelectItem key={zone.id} value={zone.id.toString()}>
                                {zone.designation}
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
                    name="operatorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opérateur</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un opérateur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.filter((user: any) => ["admin", "preparateur", "gerant"].includes(user.role)).map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.username} ({user.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notes sur l'opération..."
                          {...field}
                          data-testid="textarea-operation-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Articles de l'opération</h3>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un article
                  </Button>
                </div>

                <div className="space-y-4">
                  {watchedItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.articleId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Article *</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choisir un article" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {(articles as any[]).map((article: any) => (
                                      <SelectItem key={article.id} value={article.id.toString()}>
                                        {article.name} ({article.code || 'N/A'})
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
                            name={`items.${index}.quantityPlanned`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Qté prévue</FormLabel>
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
                            name={`items.${index}.quantityReal`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Qté réelle</FormLabel>
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
                            name={`items.${index}.unitCost`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Coût unitaire (DA)</FormLabel>
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

                          {showLotInfo && (
                            <>
                              <FormField
                                control={form.control}
                                name={`items.${index}.lotNumber`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>N° Lot</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Numéro de lot..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.expiryDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Date expiration</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          <FormField
                            control={form.control}
                            name={`items.${index}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Input placeholder="Notes article..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <div className="text-sm font-medium">
                            Total article: {(item.quantityReal * item.unitCost).toFixed(2)} DA
                          </div>
                          {watchedItems.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              Supprimer
                            </Button>
                          )}
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
                      <Package className="h-5 w-5" />
                      Résumé de l'opération
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
                          <div>Type: {operationTypeLabels[watchedType]}</div>
                          <div>Nombre d'articles: {watchedItems.length}</div>
                          <div>Quantité totale prévue: {watchedItems.reduce((sum, item) => sum + item.quantityPlanned, 0)}</div>
                          <div>Quantité totale réelle: {watchedItems.reduce((sum, item) => sum + item.quantityReal, 0)}</div>
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
                  operation ? "Mettre à jour" : "Créer l'opération"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}