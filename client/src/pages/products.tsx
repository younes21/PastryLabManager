import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, Edit, Trash2, Plus, Package, Thermometer, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type Product, type InsertProduct, type ArticleCategory, type StorageZone, type MeasurementUnit } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Unités de mesure communes
const stockTrackingOptions = [
  { value: "unit", label: "Par unité" },
  { value: "weight", label: "Par poids" },
  { value: "volume", label: "Par volume" }
];

const commonUnits = [
  "pièce", "kg", "g", "l", "ml", "m", "cm", "m²", "m³", "boîte", "paquet", "sachet"
];

function ProductForm({ product, onSuccess }: { product?: Product; onSuccess: () => void }) {
  const { toast } = useToast();
  const isEditing = !!product;
  
  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      designation: product?.designation || "",
      description: product?.description || "",
      managedInStock: product?.managedInStock ?? true,
      active: product?.active ?? true,
      stockTracking: product?.stockTracking || "unit",
      managementUnit: product?.managementUnit || "pièce",
      storageZoneId: product?.storageZoneId || undefined,
      stockAlertThreshold: product?.stockAlertThreshold || "0",
      allowedForSale: product?.allowedForSale ?? true,
      vatRate: product?.vatRate || "0",
      salePrice: product?.salePrice || "0",
      saleUnit: product?.saleUnit || "pièce",
      perishable: product?.perishable ?? false,
      conservationDuration: product?.conservationDuration || undefined,
      conservationTemperature: product?.conservationTemperature || undefined,
      dlc: product?.dlc || "",
      categoryId: product?.categoryId || undefined,
      photo: product?.photo || "",
    },
  });

  const watchPerishable = form.watch("perishable");

  const { data: categories } = useQuery<ArticleCategory[]>({
    queryKey: ["/api/article-categories"],
  });

  const { data: storageZones } = useQuery<StorageZone[]>({
    queryKey: ["/api/storage-zones"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertProduct) => apiRequest("/api/products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit créé avec succès" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertProduct) => apiRequest(`/api/products/${product!.id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit modifié avec succès" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    // Si non périssable, vider les champs de conservation
    if (!data.perishable) {
      data.conservationDuration = undefined;
      data.conservationTemperature = undefined;
      data.dlc = "";
    }
    
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="stock">Stock & Gestion</TabsTrigger>
            <TabsTrigger value="vente">Vente & Prix</TabsTrigger>
            <TabsTrigger value="conservation">Conservation</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Désignation *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nom du produit" data-testid="input-designation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Description détaillée du produit" data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune catégorie</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Produit actif</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Le produit est disponible dans le système
                </p>
              </div>
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Gérer en stock</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Activer la gestion des stocks pour ce produit
                </p>
              </div>
              <FormField
                control={form.control}
                name="managedInStock"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-managed-in-stock"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stockTracking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suivi stock *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-stock-tracking">
                        <SelectValue placeholder="Sélectionner le type de suivi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stockTrackingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="managementUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité de gestion *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-management-unit">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
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
                name="stockAlertThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seuil d'alerte stock</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0" data-testid="input-stock-alert" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="storageZoneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone de stockage</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-storage-zone">
                        <SelectValue placeholder="Sélectionner une zone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune zone spécifique</SelectItem>
                      {storageZones?.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>
                          {zone.designation} ({zone.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="vente" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Autorisé à la vente</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Le produit peut être vendu aux clients
                </p>
              </div>
              <FormField
                control={form.control}
                name="allowedForSale"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-allowed-for-sale"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de vente * (DA)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-sale-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saleUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité de vente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-sale-unit">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
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
                name="vatRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux TVA (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-vat-rate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="conservation" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Produit périssable</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Le produit a une durée de conservation limitée
                </p>
              </div>
              <FormField
                control={form.control}
                name="perishable"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-perishable"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {watchPerishable && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conservationDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée de conservation (jours)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            value={field.value || ""} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Ex: 7" 
                            data-testid="input-conservation-duration" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conservationTemperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Température de conservation (°C)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.1" value={field.value || ""} placeholder="Ex: 4.0" data-testid="input-conservation-temperature" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dlc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date limite de consommation</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-dlc" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-submit"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Enregistrement..."
              : isEditing
              ? "Modifier"
              : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Products() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: storageZones } = useQuery<StorageZone[]>({
    queryKey: ["/api/storage-zones"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/products/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setViewMode("edit");
    setIsDialogOpen(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewMode("view");
    setIsDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.designation}" ?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedProduct(undefined);
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
    }).format(Number(price));
  };

  const formatTemperature = (temp: string | number | null) => {
    if (!temp) return "-";
    return `${temp}°C`;
  };

  const formatDLC = (dlc: string | null) => {
    if (!dlc) return "-";
    return new Date(dlc).toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Produits</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedProduct(undefined)} data-testid="button-add">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {viewMode === "view" 
                    ? `Détails du produit` 
                    : selectedProduct 
                      ? "Modifier le produit" 
                      : "Nouveau produit"
                  }
                </DialogTitle>
                <DialogDescription>
                  {viewMode === "view" 
                    ? "Consultation des informations détaillées du produit" 
                    : selectedProduct 
                      ? "Modification des informations du produit existant" 
                      : "Création d'un nouveau produit dans le système"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <ProductForm product={selectedProduct} onSuccess={handleDialogClose} />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {products && products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Conservation</TableHead>
                  <TableHead>DLC</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Zone de stockage</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const storageZone = product.storageZoneId 
                    ? storageZones?.find(z => z.id === product.storageZoneId)
                    : null;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium">{product.designation}</div>
                            <div className="text-sm text-muted-foreground">{product.code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-cyan-500" />
                          {formatTemperature(product.conservationTemperature)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          {formatDLC(product.dlc)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          {formatPrice(product.salePrice)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {storageZone ? storageZone.designation : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={product.active ? "default" : "destructive"}>
                            {product.active ? "Actif" : "Inactif"}
                          </Badge>
                          {product.perishable && (
                            <Badge variant="outline">Périssable</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(product)}
                            data-testid={`button-view-${product.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun produit trouvé. Commencez par ajouter votre premier produit.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}