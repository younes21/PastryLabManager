import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Eye, Edit, Trash2, ShoppingCart } from "lucide-react";
import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";

interface PurchaseOrder {
  id: number;
  code: string;
  supplierId: number;
  status: string;
  orderDate: string;
  expectedDate: string | null;
  receivedDate: string | null;
  subtotalHT: string;
  totalTax: string;
  totalTTC: string;
  discount: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  articleId: number;
  storageZoneId: number | null;
  currentStock: string;
  quantityOrdered: string;
  unitPrice: string;
  totalPrice: string;
  taxRate: string;
  taxAmount: string;
  notes: string | null;
}

interface Supplier {
  id: number;
  code: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  website: string | null;
}

interface Article {
  id: number;
  code: string;
  name: string;
  type: string;
  category: string | null;
  unit: string | null;
  stock_current: string;
}

const purchaseOrderSchema = z.object({
  supplierId: z.number().min(1, "Le fournisseur est requis"),
  status: z.string().default("draft"),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
});

const purchaseOrderItemSchema = z.object({
  articleId: z.number().min(1, "L'article est requis"),
  storageZoneId: z.number().optional(),
  quantityOrdered: z.string().min(1, "La quantité est requise"),
  unitPrice: z.string().min(1, "Le prix unitaire est requis"),
  taxRate: z.string().default("19.00"),
  notes: z.string().optional(),
});

const purchaseOrderWithItemsSchema = z.object({
  purchaseOrder: purchaseOrderSchema,
  items: z.array(purchaseOrderItemSchema).min(1, "Au moins un article est requis"),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderWithItemsSchema>;

function getStatusColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    case "confirmed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
    case "received":
      return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "confirmed":
      return "Confirmé";
    case "received":
      return "Reçu";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
}

export default function PurchaseOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const queryClient = useQueryClient();

  // Queries
  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: ingredients = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles", { type: "ingredient" }],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: PurchaseOrderFormData) => {
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create purchase order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Bon de commande créé",
        description: "Le bon de commande d'achat a été créé avec succès.",
      });
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le bon de commande d'achat.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete purchase order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Bon de commande supprimé",
        description: "Le bon de commande d'achat a été supprimé avec succès.",
      });
    },
  });

  // Form
  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderWithItemsSchema),
    defaultValues: {
      purchaseOrder: {
        status: "draft",
      },
      items: [
        {
          quantityOrdered: "1",
          unitPrice: "0",
          taxRate: "19.00",
        },
      ],
    },
  });

  const [items, setItems] = useState([
    {
      articleId: undefined,
      storageZoneId: undefined,
      quantityOrdered: "1",
      unitPrice: "0",
      taxRate: "19.00",
      notes: "",
    },
  ]);

  // Filter purchase orders
  const filteredOrders = purchaseOrders.filter((order: PurchaseOrder) => {
    const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSupplier = supplierFilter === "all" || order.supplierId.toString() === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const onSubmit = (data: PurchaseOrderFormData) => {
    // Calculate totals for each item and overall order
    const processedItems = data.items.map(item => {
      const quantity = parseFloat(item.quantityOrdered);
      const unitPrice = parseFloat(item.unitPrice);
      const taxRate = parseFloat(item.taxRate) / 100;
      
      const totalPrice = quantity * unitPrice;
      const taxAmount = totalPrice * taxRate;
      
      return {
        ...item,
        totalPrice: totalPrice.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        currentStock: "0", // Will be filled from article data
      };
    });

    const subtotalHT = processedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const totalTax = processedItems.reduce((sum, item) => sum + parseFloat(item.taxAmount), 0);
    const totalTTC = subtotalHT + totalTax;

    const orderData = {
      purchaseOrder: {
        ...data.purchaseOrder,
        subtotalHT: subtotalHT.toFixed(2),
        totalTax: totalTax.toFixed(2),
        totalTTC: totalTTC.toFixed(2),
        discount: "0.00",
      },
      items: processedItems,
    };

    createMutation.mutate(orderData);
  };

  const addItem = () => {
    setItems([...items, {
      articleId: undefined,
      storageZoneId: undefined,
      quantityOrdered: "1",
      unitPrice: "0",
      taxRate: "19.00",
      notes: "",
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Achats Fournisseurs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les commandes d'achat auprès des fournisseurs
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-purchase-order">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau bon de commande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau bon de commande d'achat</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">Informations générales</TabsTrigger>
                    <TabsTrigger value="items">Articles à commander</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purchaseOrder.supplierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fournisseur *</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger data-testid="select-supplier">
                                  <SelectValue placeholder="Sélectionner un fournisseur" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {suppliers.map((supplier) => (
                                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                    {supplier.code} - {supplier.name}
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
                        name="purchaseOrder.status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Statut</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Brouillon</SelectItem>
                                <SelectItem value="confirmed">Confirmé</SelectItem>
                                <SelectItem value="received">Reçu</SelectItem>
                                <SelectItem value="cancelled">Annulé</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="purchaseOrder.expectedDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de livraison prévue</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                                data-testid="input-expected-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div></div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="purchaseOrder.notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Notes sur la commande..."
                                  {...field}
                                  data-testid="input-notes"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="items" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Articles à commander</h3>
                      <Button type="button" onClick={addItem} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un article
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-4 gap-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.articleId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Article *</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                      <FormControl>
                                        <SelectTrigger data-testid={`select-article-${index}`}>
                                          <SelectValue placeholder="Sélectionner un article" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {ingredients.map((ingredient) => (
                                          <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                                            {ingredient.code} - {ingredient.name}
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
                                name={`items.${index}.quantityOrdered`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Quantité *</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        placeholder="1.000"
                                        {...field}
                                        data-testid={`input-quantity-${index}`}
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
                                        placeholder="0.00"
                                        {...field}
                                        data-testid={`input-price-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="flex items-end">
                                {items.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`button-remove-${index}`}
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
                </Tabs>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Création..." : "Créer le bon de commande"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par code ou notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="received">Reçu</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-64">
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger data-testid="select-supplier-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.code} - {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Bons de commande d'achat ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de commande</TableHead>
                <TableHead>Date prévue</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order: PurchaseOrder) => {
                const supplier = suppliers.find(s => s.id === order.supplierId);
                
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono" data-testid={`text-code-${order.id}`}>
                      {order.code}
                    </TableCell>
                    <TableCell data-testid={`text-supplier-${order.id}`}>
                      {supplier?.name || "Fournisseur inconnu"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-order-date-${order.id}`}>
                      {formatDistance(new Date(order.orderDate), new Date(), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </TableCell>
                    <TableCell data-testid={`text-expected-date-${order.id}`}>
                      {order.expectedDate ? 
                        formatDistance(new Date(order.expectedDate), new Date(), { 
                          addSuffix: true, 
                          locale: fr 
                        }) : 
                        "-"
                      }
                    </TableCell>
                    <TableCell className="font-semibold" data-testid={`text-total-${order.id}`}>
                      {parseFloat(order.totalTTC).toFixed(2)} DA
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsViewOpen(true);
                          }}
                          data-testid={`button-view-${order.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(order.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-${order.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Aucun bon de commande trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Détails du bon de commande {selectedOrder?.code}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Informations générales</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Code:</span> {selectedOrder.code}</p>
                    <p><span className="font-medium">Statut:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Date de commande:</span> {new Date(selectedOrder.orderDate).toLocaleDateString('fr-FR')}</p>
                    {selectedOrder.expectedDate && (
                      <p><span className="font-medium">Date prévue:</span> {new Date(selectedOrder.expectedDate).toLocaleDateString('fr-FR')}</p>
                    )}
                    {selectedOrder.receivedDate && (
                      <p><span className="font-medium">Date de réception:</span> {new Date(selectedOrder.receivedDate).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Totaux</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Sous-total HT:</span> {parseFloat(selectedOrder.subtotalHT).toFixed(2)} DA</p>
                    <p><span className="font-medium">TVA:</span> {parseFloat(selectedOrder.totalTax).toFixed(2)} DA</p>
                    <p><span className="font-medium">Remise:</span> {parseFloat(selectedOrder.discount).toFixed(2)} DA</p>
                    <p className="text-lg"><span className="font-bold">Total TTC:</span> {parseFloat(selectedOrder.totalTTC).toFixed(2)} DA</p>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}